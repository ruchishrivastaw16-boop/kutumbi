import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ENDPOINTS from "../../api/endpoints";
import apiClient from '../../api/apiClient';
import { getToken } from '../../api/storage/storage';

const HEADER_GRADIENT = ['#0D47A1', '#1976D2'];

export default function TopicScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { classId, subjectId, chapterId, chapterName } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetchTopics();
  }, [classId, subjectId, chapterId]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const url = `${ENDPOINTS.TOPICS}?classId=${classId}&subjectId=${subjectId}&chapterId=${chapterId}`;
      const response = await apiClient.get(url);
      const json = response.data;
      

      // ✅ FIX: Handle TOPIC response structure (direct array)
      if (json.success && Array.isArray(json.data)) {
        setTopics(json.data);
      } else if (Array.isArray(json.data)) {
        // Fallback if success is not true but data is array
        setTopics(json.data);
      } else {
        throw new Error('No topics found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  // ✅ FIX: Safe keyExtractor with fallback
  const keyExtractor = (item, index) => {
    return item?.lms_subject_topic_id?.toString() || `topic-${index}`;
  };

  // Download Function
  
     const handleChapterPress = (item) => {

        navigation.navigate('ContentList', {
            classId: item.lms_branch_class_id,
            subjectId: item.lms_subject_id,
            chapterId : item.lms_subject_chapter_id,
            topicId : item.lms_subject_topic_id
        });
    };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={styles.loadingText}>Loading topics...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={60} color="#E53935" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchTopics}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="document-text-outline" size={60} color="#999" />
      <Text style={styles.emptyText}>No topics available</Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      // onPress={() =>
      //   navigation.navigate('ContentList', {
      //     topicId: item.lms_subject_topic_id,
      //     topicName: item.subject_topic_name,
      //   })
      // }
    onPress = {()=> handleChapterPress(item)}
    >
      <View style={styles.leftContainer}>
        <View style={[
          styles.numberCircle,
          item.is_completed === 1 && styles.completedCircle
        ]}>
          <Text style={styles.number}>{index + 1}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.topicName,
              item.is_completed === 1 && styles.completedText
            ]}
          >
            {item.subject_topic_name}
          </Text>
          
        </View>
      </View>

      <View style={styles.rightContainer}>
        {item.is_completed === 1 ? (
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        ) : (
          <Ionicons name="chevron-forward" size={22} color="#999" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) return renderLoading();
  if (error) return renderError();

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      <LinearGradient
        colors={HEADER_GRADIENT}
        style={[styles.header, { paddingTop: insets.top + 15 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chapterName || 'Topics'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {topics.length} Topic{topics.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={topics}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={topics.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmpty}
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
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#E3F2FD',
    marginTop: 5,
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
    marginBottom: 14,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCircle: {
    backgroundColor: '#4CAF50',
  },
  number: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  completedText: {
    color: '#4CAF50',
  },
  topicId: {
    marginTop: 4,
    color: '#666',
    fontSize: 12,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    marginRight: 12,
    padding: 5,
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