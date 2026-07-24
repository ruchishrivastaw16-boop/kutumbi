import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * DESIGN TOKENS — same single-hue system as ProfileScreen.
 * No color-coding for good/bad performance; the fill amount and weight
 * of the ink tone itself communicates the score, so the screen stays
 * consistent with the rest of the app.
 */
const COLORS = {
  bg: '#FFFFFF',
  ink: '#16233F',
  slate: '#6B7686',
  mist: '#A9B6CC',
  hairline: '#E7EAF0',
  track: '#F1F3F7',
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
const RADIUS = { sm: 10, md: 14 };

/**
 * MOCK DATA — replace with API data.
 * Hierarchy: board -> classes -> subjects -> chapters -> topics.
 * Every node carries a `score` (0-100). Topics also carry attempted/correct
 * so the final leaf screen can show real numbers, not just a percentage.
 */
const DATA = [
  {
    name: 'CBSE',
    score: 78,
    classes: [
      {
        name: 'Class 10',
        score: 82,
        subjects: [
          {
            name: 'Mathematics',
            score: 75,
            chapters: [
              {
                name: 'Algebra',
                score: 80,
                topics: [
                  { name: 'Linear Equations', score: 85, attempted: 20, correct: 17 },
                  { name: 'Quadratic Equations', score: 74, attempted: 18, correct: 13 },
                ],
              },
              {
                name: 'Trigonometry',
                score: 68,
                topics: [
                  { name: 'Ratios & Identities', score: 70, attempted: 15, correct: 11 },
                  { name: 'Heights & Distances', score: 65, attempted: 12, correct: 8 },
                ],
              },
            ],
          },
          {
            name: 'Science',
            score: 79,
            chapters: [
              {
                name: 'Light — Reflection & Refraction',
                score: 79,
                topics: [
                  { name: 'Mirrors', score: 82, attempted: 14, correct: 11 },
                  { name: 'Lenses', score: 76, attempted: 14, correct: 10 },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'Class 9',
        score: 71,
        subjects: [
          {
            name: 'Mathematics',
            score: 71,
            chapters: [
              {
                name: 'Number Systems',
                score: 71,
                topics: [{ name: 'Real Numbers', score: 71, attempted: 16, correct: 11 }],
              },
            ],
          },
        ],
      },
    ],
  },
];

const LEVEL_KEYS = ['classes', 'subjects', 'chapters', 'topics'];
const LEVEL_LABELS = ['Select board', 'Select class', 'Select subject', 'Select chapter', 'Topic performance'];

export default function PerformanceScreen({ navigation }) {
  // path is an array of selected indices, one per level drilled into.
  const [path, setPath] = useState([]);

  // Resolve the node the user is currently inside, and the list to show.
  let currentList = DATA;
  const crumbs = [];
  for (let i = 0; i < path.length; i++) {
    const node = currentList[path[i]];
    crumbs.push(node.name);
    currentList = i < LEVEL_KEYS.length ? node[LEVEL_KEYS[i]] : null;
  }

  const depth = path.length; // 0=boards, 1=classes, 2=subjects, 3=chapters, 4=topics list, 5=topic detail
  const atTopicDetail = depth === 5;
  const topicDetail = atTopicDetail ? getNode(DATA, path) : null;

  const handleBack = () => {
    if (path.length === 0) {
      navigation.goBack();
    } else {
      setPath(path.slice(0, -1));
    }
  };

  const handleSelect = (index) => setPath([...path, index]);

  const listToRender = atTopicDetail ? [] : currentList;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Performance</Text>
          {crumbs.length > 0 && (
            <Text style={styles.breadcrumb} numberOfLines={1}>
              {crumbs.join('  ›  ')}
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!atTopicDetail && (
          <>
            <Text style={styles.levelLabel}>{LEVEL_LABELS[depth]}</Text>
            <View style={styles.sectionCard}>
              {listToRender.map((item, i) => (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.row, i === listToRender.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.6}
                  onPress={() => handleSelect(i)}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.name}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${item.score}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.rowScore}>{item.score}%</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.mist} style={{ marginLeft: SPACING.sm }} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {atTopicDetail && topicDetail && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>{topicDetail.name}</Text>

            <View style={styles.scoreRing}>
              <Text style={styles.scoreRingValue}>{topicDetail.score}%</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{topicDetail.attempted}</Text>
                <Text style={styles.statLabel}>Attempted</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{topicDetail.correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{topicDetail.attempted - topicDetail.correct}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Walks DATA using a full path (including the final topic index) and
// returns the leaf topic node.
function getNode(data, fullPath) {
  let list = data;
  let node = null;
  for (let i = 0; i < fullPath.length; i++) {
    node = list[fullPath[i]];
    if (i < LEVEL_KEYS.length) list = node[LEVEL_KEYS[i]];
  }
  return node;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  backButton: { marginRight: SPACING.sm, padding: SPACING.xs },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
  breadcrumb: { fontSize: 12, color: COLORS.slate, marginTop: 2 },

  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },

  levelLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.md,
    marginLeft: 2,
  },

  sectionCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  rowText: { flex: 1, marginRight: SPACING.md },
  rowLabel: { fontSize: 15, fontWeight: '600', color: COLORS.ink, marginBottom: SPACING.sm },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.track,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.ink,
  },
  rowScore: { fontSize: 13, fontWeight: '700', color: COLORS.ink, minWidth: 36, textAlign: 'right' },

  // Topic detail
  detailCard: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    padding: SPACING.xxl,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: COLORS.track,
    borderTopColor: COLORS.ink,
    borderRightColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    transform: [{ rotate: '-45deg' }],
  },
  scoreRingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.ink,
    transform: [{ rotate: '45deg' }],
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
  statLabel: { fontSize: 11, color: COLORS.slate, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.hairline },
});