import React, { useEffect, useState, useRef } from 'react'; // Added useRef here
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated, // Added Animated here
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ENDPOINTS from "../../api/endpoints";
import apiClient from '../../api/apiClient';
import { getToken } from '../../api/storage/storage';

const HEADER_GRADIENT = ['#0D47A1', '#1976D2'];

// ═══════════════════════════════════════════════════════════════════
//  ANIMATED CHAPTER CARD WITH PROGRESS
// ═══════════════════════════════════════════════════════════════════
function AnimatedChapterCard({ item, index, onPress }) {
  const barWidth = useRef(new Animated.Value(0)).current;
  
  // Safely get progress data (fallback to 0 if API doesn't send it yet)
  const progress = item.progress ?? 0;
  const topicsDone = item.topicsDone ?? 0;
  const totalTopics = item.totalTopics ?? 0;

  // Animate the bar filling up on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(barWidth, {
        toValue: progress,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }, index * 80 + 200); // staggered animation
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.circle}>
          <Text style={styles.circleText}>{index + 1}</Text>
        </View>
        
        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={styles.chapter}>{item.subject_chapter_name}</Text>
          
          {/* ── Progress Graph Section ── */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>
                {topicsDone}/{totalTopics} topics
              </Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: barWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={22} color="#888" />
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function ChapterScreen({ route, navigation }) {
  const { classId, subjectId, subjectName } = route.params; 

  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [subjectInfo, setSubjectInfo] = useState(null);

  useEffect(() => {
    fetchChapter();
  }, [classId, subjectId]);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const url = `${ENDPOINTS.CHAPTER}?classId=${classId}&subjectId=${subjectId}`;
      const response = await apiClient.get(url);
      const json = response.data;

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        if (json.data[0].chapters) {
          setSubjectInfo(json.data[0]);
          setChapters(json.data[0].chapters);
        } 
        else if (json.data[0].lms_subject_chapter_id) {
          setChapters(json.data);
        } else {
          throw new Error('Unexpected response structure');
        }
      } else {
        throw new Error('No chapters found');
      }
    } catch (err) {
      // ✅ FIX: Removed the duplicate setError from your code
      setError(err.message || 'Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const keyExtractor = (item, index) => {
    return item?.lms_subject_chapter_id?.toString() || `chapter-${index}`;
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={styles.loadingText}>Loading chapters...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={60} color="#E53935" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchChapter}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="book-outline" size={60} color="#999" />
      <Text style={styles.emptyText}>No chapters available</Text>
    </View>
  );

  const handleChapterPress = (item) => {
    navigation.navigate('TopicList', {
      classId: item.lms_branch_class_id,
      subjectId: item.lms_subject_id,
      chapterId: item.lms_subject_chapter_id,
    });
  };

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
          <Text style={styles.title}>
            {subjectName || subjectInfo?.subject_name || 'Chapters'}
          </Text>
          <Text style={styles.subtitle}>
            {chapters.length} Chapter{chapters.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={chapters}
        keyExtractor={keyExtractor}
        contentContainerStyle={chapters.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item, index }) => (
          <AnimatedChapterCard 
            item={item} 
            index={index} 
            onPress={() => handleChapterPress(item)} 
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#E3F2FD',
    marginTop: 4,
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
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chapter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  
  // ── Progress Graph Styles ──
  progressSection: {
    marginTop: 10,
    // Since it is inside the flex: 1 view, it automatically aligns under the chapter name
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1976D2', // Matches the circle color
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E3F2FD', // Very light blue matching header
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976D2', // Solid blue fill
    borderRadius: 3,
  },

  // ── Utility Styles ──
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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