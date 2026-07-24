import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableWithoutFeedback,
    Animated,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ENDPOINTS from "../../api/endpoints";
import apiClient from '../../api/apiClient';
import { getToken } from '../../api/storage/storage';
import { Ionicons } from '@expo/vector-icons';


const BOARD_THEMES = [
    { gradient: ['#4a90e2', '#6c5ce7'], icon: 'book' },
    { gradient: ['#f6a24b', '#ef5da8'], icon: 'flask' },
    { gradient: ['#38d39f', '#2fa8e0'], icon: 'planet' },
    { gradient: ['#ff8a5b', '#ff6b81'], icon: 'color-palette' },
];

// ═══════════════════════════════════════════════════════════════════
//  BOARD CARD — with progress bar inside
// ═══════════════════════════════════════════════════════════════════
function AnimatedBoardCard({ board, theme, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const barWidth = useRef(new Animated.Value(0)).current;

    const progress = board.progress ?? 0;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.spring(barWidth, {
                toValue: progress,
                friction: 8,
                tension: 40,
                useNativeDriver: false,
            }).start();
        }, 300);
        return () => clearTimeout(timer);
    }, [progress]);

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 3 }).start();
    };

    const classNames = Array.isArray(board.classes) ? board.classes.map((c) => c.name) : [];
    const classSummary = classNames.length > 2
        ? `${classNames.slice(0, 2).join(', ')} +${classNames.length - 2} more`
        : classNames.join(', ');

    return (
        <TouchableWithoutFeedback onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={[styles.boardCard, { transform: [{ scale }] }]}>
                <LinearGradient
                    colors={theme.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.boardGradient}
                >
                    {/* Top row: icon + text + chevron */}
                    <View style={styles.boardTopRow}>
                        <View style={styles.boardIconCircle}>
                            <Ionicons name={theme.icon} size={24} color="#FFFFFF" />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.boardName} numberOfLines={1}>
                                {board.boardName}
                            </Text>
                            <Text style={styles.boardSubtext} numberOfLines={1}>
                                {classSummary || 'No classes'}
                            </Text>
                        </View>

                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </View>

                    {/* ── Progress section ── */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.progressLabel}>
                                {board.chaptersDone ?? 0}/{board.totalChapters ?? 0} Classes
                            </Text>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>

                        {/* Track */}
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
                </LinearGradient>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  HOME SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function HomeScreen({ navigation }) {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await apiClient.get(ENDPOINTS.BOARDS_CLASSES, { headers });
            const json = response.data;
            if (json.success && Array.isArray(json.data)) {
                setBoards(json.data);
            } else {
                throw new Error('Unexpected response shape');
            }
        } catch (err) {
            setError('Could not reach server — showing sample data');
        } finally {
            setLoading(false);
        }
    };

    const handleBoardPress = (board) => {
        navigation.navigate('ClassList', {
            boardId: board.boardId,
            boardName: board.boardName,
            classes: board.classes,
        });
    };

    const renderBoard = ({ item, index }) => (
        <AnimatedBoardCard
            board={item}
            theme={BOARD_THEMES[index % BOARD_THEMES.length]}
            onPress={() => handleBoardPress(item)}
        />
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
                <ActivityIndicator size="large" color="#6c5ce7" />
                <Text style={styles.loadingText}>Loading your boards…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.headerRow}>
                <Text style={styles.greeting}>Hey there, superstar! 🌟</Text>
                <Text style={styles.screenTitle}>Pick a board to get started</Text>
            </View>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <FlatList
                data={boards}
                keyExtractor={(item) => String(item.boardId)}
                renderItem={renderBoard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FB',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    headerRow: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9B59F6',
        marginBottom: 2,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1D21',
    },
    errorBanner: {
        fontSize: 12,
        color: '#B45309',
        backgroundColor: '#FEF3C7',
        marginHorizontal: 20,
        marginBottom: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 4,
    },

    // ── Board Card ──
    boardCard: {
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 4,
    },
    boardGradient: {
        padding: 18,
        gap: 14,
    },
    boardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    boardIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    boardName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    boardSubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
        fontWeight: '500',
    },

    // ── Progress inside card ──
    progressSection: {
        marginTop: 2,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
    },
    progressPercent: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '800',
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 3,
    },
});