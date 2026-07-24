import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { removeToken } from '../../api/storage/storage';

/**
 * DESIGN TOKENS
 * Pure white surface throughout. No accent hue at all — structure comes
 * from spacing, weight, and hairline borders instead of color.
 *
 * Palette:
 *  - #FFFFFF  → background AND card surface (same value, cards separated
 *               by hairline + soft shadow only)
 *  - #16233F  → ink — primary text, avatar, icons
 *  - #6B7686  → slate — secondary text (subtitles)
 *  - #A9B6CC  → mist — chevrons
 *  - #E7EAF0  → hairline — borders/dividers
 */
const COLORS = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  ink: '#16233F',
  slate: '#6B7686',
  mist: '#A9B6CC',
  hairline: '#E7EAF0',
};

const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
const RADIUS = { sm: 10, md: 14, lg: 20 };

export default function ProfileScreen({ navigation }) {
  const user = {
    name: 'Knowe',
  };

  const menuItems = [
    {
      icon: 'download-outline',
      label: 'Downloads',
      subtitle: '12 offline files',
      onPress: () => navigation.navigate('Download'),
    },
    // {
    //   icon: 'bar-chart-outline',
    //   label: 'Performance',
    //   subtitle: 'Track your progress',
    //   onPress: () => navigation.navigate('Performance'),
    // },
  ];

  const getInitials = (name) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await removeToken();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces>
        {/* Profile identity */}
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
        </View>

        {/* Menu */}
        <View style={styles.sectionCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.6}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={19} color={COLORS.ink} />
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={COLORS.mist} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.6}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.ink} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  scrollContent: { paddingBottom: SPACING.xl },

  // Profile identity
  profileBlock: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    marginTop: SPACING.md,
  },

  // Menu card
  sectionCard: {
    marginHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hairline,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: { flex: 1, marginLeft: SPACING.md },
  menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.ink },
  menuSubtitle: { fontSize: 12, color: COLORS.slate, marginTop: 2 },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.hairline,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.ink, marginLeft: SPACING.sm },
});