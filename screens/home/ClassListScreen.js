import React, { useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableWithoutFeedback,
    Animated,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const HEADER_GRADIENT = ['#4a90e2', '#6c5ce7'];

const CLASS_THEMES = [
    { color: '#4a90e2', bg: '#E9F1FD', icon: 'school' },
    { color: '#ef5da8', bg: '#FDEAF3', icon: 'ribbon' },
    { color: '#f6a24b', bg: '#FEF3E7', icon: 'trophy' },
    { color: '#38d39f', bg: '#E6FBF3', icon: 'star' },
    { color: '#6c5ce7', bg: '#EFEBFD', icon: 'rocket' },
    { color: '#ff6b81', bg: '#FFEBEE', icon: 'sparkles' },
];

function AnimatedClassCard({ classItem, index, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const barWidth = useRef(new Animated.Value(0)).current;
    const theme = CLASS_THEMES[index % CLASS_THEMES.length];

    const progress = classItem.progress ?? 0;

    // Animate bar on mount
    React.useEffect(() => {
        const timer = setTimeout(() => {
            Animated.spring(barWidth, {
                toValue: progress,
                friction: 8,
                tension: 40,
                useNativeDriver: false,
            }).start();
        }, index * 100 + 200);
        return () => clearTimeout(timer);
    }, [progress]);

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 3 }).start();
    };

    return (
        <TouchableWithoutFeedback onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={[styles.classCard, { transform: [{ scale }] }]}>
                {/* Top row */}
                <View style={styles.classTopRow}>
                    <View style={[styles.classIconCircle, { backgroundColor: theme.bg }]}>
                        <Ionicons name={theme.icon} size={22} color={theme.color} />
                    </View>
                    <Text style={styles.classCardText} numberOfLines={1}>
                        {classItem.name}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#C4C7CE" />
                </View>

                {/* Progress row */}
                <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressLabel}>
                            {classItem.chaptersDone ?? 0}/{classItem.totalChapters ?? 0} Subjects
                        </Text>
                        <Text style={[styles.progressPercent, { color: theme.color }]}>
                            {progress}%
                        </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.bg }]}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                {
                                    width: barWidth.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%'],
                                    }),
                                    backgroundColor: theme.color,
                                },
                            ]}
                        />
                    </View>
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

export default function ClassListScreen({ route, navigation }) {
    const { boardId, boardName, classes } = route.params;
    const insets = useSafeAreaInsets();

    const handleClassPress = (classItem) => {
        navigation.navigate('SubjectList', {
            boardId,
            boardName,
            classId: classItem.id,
            className: classItem.name,
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent={true} />

            <LinearGradient
                colors={HEADER_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerBar, { paddingTop: insets.top + 14 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {boardName}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {classes.length} {classes.length === 1 ? 'class' : 'classes'} available
                    </Text>
                </View>
            </LinearGradient>

            <SafeAreaView style={styles.listWrapper} edges={['bottom', 'left', 'right']}>
                <FlatList
                    data={classes}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item, index }) => (
                        <AnimatedClassCard
                            classItem={item}
                            index={index}
                            onPress={() => handleClassPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4a90e2',
    },
    listWrapper: {
        flex: 1,
        backgroundColor: '#F5F7FB',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 18,
        gap: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 24,
    },

    // ── Class Card ──
    classCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    classTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    classIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    classCardText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#2A2D34',
    },

    // ── Progress inside card ──
    progressSection: {
        marginTop: 14,
        marginLeft: 56, // align under the class name (icon 42 + gap 14)
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 7,
    },
    progressLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '800',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});