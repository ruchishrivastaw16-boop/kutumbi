import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ENDPOINTS from '../../api/endpoints';
import apiClient from '../../api/apiClient';
import { getToken } from '../../api/storage/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';
import JSZip from 'jszip';

export default function ContentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { classId, subjectId, chapterId, chapterName, topicId, topicName } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contents, setContents] = useState([]);
  const [embedUrl, setEmbedUrl] = useState('');
  const [downloadState, setDownloadState] = useState({ id: null, status: '' });
  const [downloadedItems, setDownloadedItems] = useState({});

  useEffect(() => {
    loadDownloadedItems();
    fetchContents();
  }, [classId, subjectId, chapterId, topicId]);

  const loadDownloadedItems = async () => {
    try {
      const existing = await AsyncStorage.getItem('downloads');
      const list = existing ? JSON.parse(existing) : [];
      const map = {};

      list.forEach((entry) => {
        if (entry?.id) {
          map[String(entry.id)] = entry;
        }
      });

      setDownloadedItems(map);
    } catch (error) {
      console.log('Load downloaded items error:', error);
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = `${ENDPOINTS.CONTENT}?classId=${classId}&subjectId=${subjectId}&chapterId=${chapterId}&topicId=${topicId}`;
      const response = await apiClient.get(url, { headers });
      const json = response.data;

      if (json.success && Array.isArray(json.data)) {
        setContents(json.data);
        if (json.embedUrl) setEmbedUrl(json.embedUrl);
      } else if (Array.isArray(json.data)) {
        setContents(json.data);
        if (json.embedUrl) setEmbedUrl(json.embedUrl);
      } else {
        throw new Error('No content found');
      }
    } catch (err) {
      setError(err.message || 'Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  const downloadContent = async (item) => {
    const dataId = item?.lms_subject_topic_data_id;
    try {
      setDownloadState({ id: dataId, status: 'downloading' });
      setError(null);

      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const baseName = item?.lms_subject_topic_data_file_code_name || `content-${dataId}`;
      const relativeUrl = `${ENDPOINTS.DOWNLOAD}?classId=${classId}&subjectId=${subjectId}&chapterId=${chapterId}&topicId=${topicId}&dataId=${dataId}`;

      const response = await apiClient.get(relativeUrl, {
        headers,
        responseType: 'arraybuffer', 
        onDownloadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          if (total > 0) {
            const percent = Math.round((loaded * 100) / total);
            setDownloadState({ id: dataId, status: `downloading ${percent}%` });
          } else {
            setDownloadState({ id: dataId, status: 'downloading' });
          }
        }
      });

      const contentType = response.headers['content-type'] || '';
      let storyUrl = '';
      const extractDir = new Directory(Paths.document, baseName);
      extractDir.create({ intermediates: true, idempotent: true });

      setDownloadState({ id: dataId, status: 'extracting' });

      if (contentType.includes('application/zip')) {
        const zip = await JSZip.loadAsync(response.data);
        const entryNames = Object.keys(zip.files);

        for (const name of entryNames) {
          const entry = zip.files[name];
          const parts = name.split('/').filter(Boolean);

          if (entry.dir) {
            if (parts.length) {
              new Directory(extractDir, ...parts).create({ intermediates: true, idempotent: true });
            }
            continue;
          }

          const fileName = parts.pop();
          const parentDir = parts.length ? new Directory(extractDir, ...parts) : extractDir;
          if (parts.length) parentDir.create({ intermediates: true, idempotent: true });

          const fileBase64 = await entry.async('base64');
          const outFile = new File(parentDir, fileName);
          
          // ✅ FIX: writeAsync hata ke sirf 'write' use kiya hai
          await outFile.write(fileBase64, { encoding: 'base64' }); 
        }

        const preferredEntryPoints = ['story.html', 'index_lms.html'];
        let htmlEntry = entryNames.find((name) => preferredEntryPoints.includes(name));
        
        if (!htmlEntry) {
          htmlEntry = entryNames.find(name => !name.includes('/') && (name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm')));
        }
        if (!htmlEntry) {
          htmlEntry = entryNames.find(name => name.toLowerCase().endsWith('.html') || name.toLowerCase().endsWith('.htm'));
        }

        if (!htmlEntry) {
          throw new Error('No HTML file found inside the downloaded ZIP.');
        }

        const htmlParts = htmlEntry.split('/').filter(Boolean);
        storyUrl = new File(extractDir, ...htmlParts).uri;

      } else {
        const htmlText = new TextDecoder().decode(response.data);
        const outFile = new File(extractDir, 'index.html');
        
        // ✅ FIX: yahan bhi writeAsync ko 'write' mein badla
        await outFile.write(htmlText, { encoding: 'utf8' });
        storyUrl = outFile.uri;
      }

      setDownloadState({ id: dataId, status: 'complete' });

      const downloadedItem = {
        id: dataId,
        title: item?.lms_subject_topic_data_kind || baseName || 'Downloaded Item',
        path: extractDir.uri, 
        extractDir: extractDir.uri,
        storyUrl,
        contentType: 'application/zip',
        type: item?.lms_subject_topic_data_type || 'Downloaded content',
      };

      const existing = await AsyncStorage.getItem('downloads');
      const list = existing ? JSON.parse(existing) : [];
      const filtered = list.filter((entry) => entry.id !== downloadedItem.id);
      filtered.unshift(downloadedItem);
      await AsyncStorage.setItem('downloads', JSON.stringify(filtered));
      setDownloadedItems((prev) => ({ ...prev, [String(downloadedItem.id)]: downloadedItem }));

      Alert.alert('Success', `"${downloadedItem.title}" is ready to play offline!`);

    } catch (err) {
      console.error("DOWNLOAD_ERROR: ", err);
      let message = err?.message || 'Download failed.';
      
      if (err.response?.data) {
        try {
          const errorObj = JSON.parse(new TextDecoder().decode(err.response.data));
          message = errorObj.message || message;
        } catch (e) {}
      }
      
      setError(message);
      Alert.alert('Download Error', message);
    } finally {
      setTimeout(() => {
        setDownloadState({ id: null, status: '' });
      }, 500);
    }
  };

  const keyExtractor = (item, index) => {
    return item?.lms_subject_topic_data_id?.toString() || `content-${index}`;
  };

  const getContentIcon = (kind, type) => {
    if (type === 'Video' || kind?.toLowerCase().includes('video')) return 'play-circle-outline';
    if (kind?.toLowerCase().includes('assessment') || kind?.toLowerCase().includes('quiz')) return 'clipboard-outline';
    if (kind?.toLowerCase().includes('mind map')) return 'git-branch-outline';
    if (kind?.toLowerCase().includes('activity')) return 'fitness-outline';
    return 'document-text-outline';
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={styles.loadingText}>Loading content...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={60} color="#E53935" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchContents}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="folder-open-outline" size={60} color="#999" />
      <Text style={styles.emptyText}>No content available</Text>
    </View>
  );

  const renderItem = ({ item, index }) => {
    const itemId = String(item?.lms_subject_topic_data_id || '');
    const isCurrentItemDownloading = downloadState.id === item?.lms_subject_topic_data_id;
    const status = downloadState.status;
    const offlineItem = downloadedItems[itemId];
    const isDownloaded = Boolean(offlineItem?.storyUrl || offlineItem?.path);

    let downloadUI;
    
    if (status === 'complete' && isCurrentItemDownloading) {
      downloadUI = (
        <View style={styles.progressContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        </View>
      );
    } else if (isCurrentItemDownloading) {
      let statusText = 'Downloading...';
      if (status.includes('extracting')) statusText = 'Extracting...';
      else if (status.includes('downloading')) {
        statusText = status.replace('downloading', 'Downloading').trim();
        if (statusText === 'Downloading') statusText = 'Downloading...';
      }

      downloadUI = (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#1976D2" />
          <Text style={styles.progressText}>{statusText}</Text>
        </View>
      );
    } else if (isDownloaded) {
      downloadUI = (
        <View style={styles.progressContainer}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.progressText}>Offline</Text>
        </View>
      );
    } else {
      downloadUI = (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => downloadContent(item)}
        >
          <Ionicons name="download-outline" size={22} color="#1976D2" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          const offlineContent = downloadedItems[itemId];
          navigation.navigate('PlayerScreen', {
            title: item.lms_subject_topic_data_kind,
            url: offlineContent?.storyUrl || item.html5_file_name || embedUrl,
            type: item.lms_subject_topic_data_type,
          });
        }}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getContentIcon(item.lms_subject_topic_data_kind, item.lms_subject_topic_data_type)}
            size={30}
            color="#1976D2"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.kind}>{item.lms_subject_topic_data_kind}</Text>
          <Text style={styles.type}>{item.lms_subject_topic_data_type}</Text>
          <Text style={styles.codeName}>{item.lms_subject_topic_data_file_code_name}</Text>
        </View>

        <View style={styles.rightContainer}>
          {downloadUI}
        </View>

        {!isCurrentItemDownloading && (
          <Ionicons name="chevron-forward" size={22} color="#999" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return renderLoading();
  if (error) return renderError();

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      <LinearGradient
        colors={['#0D47A1', '#1976D2']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {topicName || 'Content'}
          </Text>
          <Text style={styles.subTitle}>
            {contents.length} Content{contents.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={contents}
        keyExtractor={keyExtractor}
        contentContainerStyle={contents.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#E3F2FD',
    marginTop: 3,
  },
  list: {
    padding: 15,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  kind: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  type: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  codeName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rightContainer: {
    marginRight: 6,
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  downloadButton: {
    padding: 6,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  progressText: {
    fontSize: 10,
    color: '#1976D2',
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F4F6F9',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    color: '#E53935',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});