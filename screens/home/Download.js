import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Download({ navigation }) {
  const [downloads, setDownloads] = useState([]);


  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const saved = await AsyncStorage.getItem('downloads');
      if (saved) {
        setDownloads(JSON.parse(saved));
      }
    } catch (error) {
      
    }
  };

  const handleOpenDownloaded = (item) => {
    if (item?.storyUrl) {
      navigation.navigate('PlayerScreen', {
        title: item.title,
        url: item.storyUrl,
        type: item.type || 'Offline',
      });
      return;
    }

    if (item?.path) {
      Alert.alert('Downloaded file', `${item.fileName || item.title} is saved locally.`);
      return;
    }

    navigation.navigate('PlayerScreen', {
      title: item.title,
      url: item.url,
      type: item.type || 'Offline',
    });
  };

  const clearDownloads = async () => {
    Alert.alert('Clear downloads', 'Remove all downloaded items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('downloads');
          setDownloads([]);
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpenDownloaded(item)}>
      <View style={styles.iconContainer}>
        <Ionicons name="download-outline" size={24} color="#1976D2" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.type || 'Downloaded content'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Downloads</Text>
        {downloads.length > 0 ? (
          <TouchableOpacity onPress={clearDownloads}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-download-outline" size={54} color="#999" />
          <Text style={styles.emptyText}>No downloaded items yet.</Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item, index) => item.id || `${item.title}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8EF',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#16233F' },
  clearText: { color: '#1976D2', fontWeight: '600' },
  list: { padding: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '600', color: '#222' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 10, color: '#666', fontSize: 15 },
});