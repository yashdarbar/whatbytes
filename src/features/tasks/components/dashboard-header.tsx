import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppText, LayoutGrid, MoreHorizontal, Search, X } from '@/components/ui';
import { useAppTheme, useThemeStore } from '@/theme';

type DashboardHeaderProps = {
  email?: string | null;
  hasActiveFilters: boolean;
  isSigningOut: boolean;
  searchQuery: string;
  onFilterPress: () => void;
  onSearchChange: (value: string) => void;
  onSignOut: () => void;
};

export function DashboardHeader({
  email,
  hasActiveFilters,
  isSigningOut,
  searchQuery,
  onFilterPress,
  onSearchChange,
  onSignOut,
}: DashboardHeaderProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const [menuVisible, setMenuVisible] = useState(false);
  const useCompactToolbar = width < 360;
  const today = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <View
      style={[
        styles.header,
        useCompactToolbar && styles.headerCompact,
        { backgroundColor: theme.colors.header },
      ]}
    >
      <View style={[styles.toolbar, useCompactToolbar && styles.toolbarCompact]}>
        <Pressable
          accessibilityLabel="Open task filters"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onFilterPress}
          style={styles.iconButton}
        >
          <LayoutGrid color="#FFFFFF" size={21} />
          {hasActiveFilters ? <View style={styles.filterBadge} /> : null}
        </Pressable>

        <View style={styles.searchBox}>
          <Search color={theme.colors.placeholder} size={17} />
          <TextInput
            accessibilityLabel="Search tasks"
            onChangeText={onSearchChange}
            placeholder="Search tasks"
            placeholderTextColor={theme.colors.placeholder}
            returnKeyType="search"
            style={[styles.searchInput, { color: '#252735' }]}
            value={searchQuery}
          />
          {searchQuery ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onSearchChange('')}
            >
              <X color={theme.colors.placeholder} size={16} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Open account menu"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setMenuVisible(true)}
          style={styles.iconButton}
        >
          <MoreHorizontal color="#FFFFFF" size={23} />
        </Pressable>
      </View>

      <View>
        <AppText style={[styles.today, { color: theme.colors.headerMuted }]}>
          Today, {today}
        </AppText>
        <AppText style={styles.title}>My tasks</AppText>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        transparent
        visible={menuVisible}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            accessibilityLabel="Close account menu"
            accessibilityRole="button"
            onPress={() => setMenuVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.menu,
              theme.shadow,
              { width: Math.min(220, width - 36), backgroundColor: theme.colors.surface },
            ]}
          >
            {email ? (
              <AppText muted numberOfLines={1} style={styles.email}>
                {email}
              </AppText>
            ) : null}
            <View style={[styles.themeAction, { borderTopColor: theme.colors.border }]}>
              <AppText variant="label">Light mode</AppText>
              <Switch
                accessibilityLabel="Light mode"
                ios_backgroundColor={theme.colors.border}
                onValueChange={(isLight) => setMode(isLight ? 'light' : 'dark')}
                thumbColor={mode === 'light' ? theme.colors.primary : theme.colors.placeholder}
                trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}66` }}
                value={mode === 'light'}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={() => {
                setMenuVisible(false);
                onSignOut();
              }}
              style={styles.menuAction}
            >
              <AppText variant="label" style={{ color: theme.colors.danger }}>
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 18, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  headerCompact: { paddingHorizontal: 14 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toolbarCompact: { gap: 8 },
  iconButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 3,
    width: 7,
    height: 7,
    borderWidth: 1.5,
    borderColor: '#7774ED',
    borderRadius: 4,
    backgroundColor: '#FFB65A',
  },
  searchBox: {
    flex: 1,
    minWidth: 160,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
  },
  today: { fontSize: 12, lineHeight: 18 },
  title: { color: '#FFFFFF', fontSize: 24, lineHeight: 31 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)' },
  menu: {
    position: 'absolute',
    top: 58,
    right: 18,
    width: 220,
    borderRadius: 14,
    paddingVertical: 8,
  },
  email: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 12 },
  themeAction: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  menuAction: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
