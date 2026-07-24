import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated, // Added Animated
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
//  ANIMATED SUBJECT CARD WITH PROGRESS
// ═══════════════════════════════════════════════════════════════════
function AnimatedSubjectCard({ item, index, onPress }) {
  const barWidth = useRef(new Animated.Value(0)).current;

  // Safely get progress data (fallback to 0 if API doesn't send it yet)
  const progress = item.progress ?? 0;
  const chaptersDone = item.chaptersDone ?? 0;
  const totalChapters = item.totalChapters ?? 0;

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
      <View style={styles.leftContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={28} color="#1976D2" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName}>{item.subject_name}</Text>
          
          {/* ── Progress Graph Section ── */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>
                {chaptersDone}/{totalChapters} chapters
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

      <Ionicons name="chevron-forward" size={22} color="#999" />
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function SubjectScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);

  const { classId, boardName } = route.params;
  const headerTitle = boardName || 'NCERT English Medium';

  useEffect(() => {
    fetchSubject();
  }, [classId]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const orderBy = encodeURIComponent(JSON.stringify([{ column: 'lms_subject_id', order: 'desc' }]));
      const url = `${ENDPOINTS.SUBJECT}?classId=${classId}&orderBy=${orderBy}`;

      const response = await apiClient.get(url, { headers });
      const json = response.data;
      if (json.success && Array.isArray(json.data)) {
        setSubjects(json.data);
      } else {
        throw new Error('Unexpected response shape');
      }
    } catch (err) {
      setError('Could not load subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectPress = (item) => {
    navigation.navigate('ChapterList', {
      classId: item.lms_branch_class_id,
      subjectId: item.lms_subject_id,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBar, { paddingTop: insets.top + 15 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {subjects.length} Subjects Available
          </Text>
        </View>
      </LinearGradient>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading subjects…</Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.lms_subject_id.toString()}
          renderItem={({ item, index }) => (
            <AnimatedSubjectCard 
              item={item} 
              index={index} 
              onPress={() => handleSubjectPress(item)} 
            />
          )}
          contentContainerStyle={{ padding: 15 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#E3F2FD',
    marginTop: 5,
    fontSize: 14,
  },
  errorBanner: {
    fontSize: 12,
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 15,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },

  // ── Card Styles ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },

  // ── Progress Graph Styles ──
  progressSection: {
    marginTop: 10,
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
    color: '#1976D2', // Matches icon color
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E3F2FD', // Matches icon background
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1976D2', // Solid blue fill
    borderRadius: 3,
  },
});