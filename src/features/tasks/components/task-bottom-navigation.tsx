import { Pressable, StyleSheet, View } from 'react-native';

import type { TaskViewMode } from '../types';
import { CalendarDays, ListTodo, Plus } from '@/components/ui';
import { useAppTheme } from '@/theme';

type TaskBottomNavigationProps = {
  value: TaskViewMode;
  onChange: (value: TaskViewMode) => void;
  onCreate: () => void;
};

export function TaskBottomNavigation({ value, onChange, onCreate }: TaskBottomNavigationProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.bar,
        theme.shadow,
        { backgroundColor: theme.colors.navigation, borderTopColor: theme.colors.border },
      ]}
    >
      <Pressable
        accessibilityLabel="Task list"
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'list' }}
        onPress={() => onChange('list')}
        style={styles.tab}
      >
        <ListTodo
          color={value === 'list' ? theme.colors.primary : theme.colors.placeholder}
          size={25}
        />
      </Pressable>

      <View style={styles.fabSpace} />

      <Pressable
        accessibilityLabel="Task calendar"
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'calendar' }}
        onPress={() => onChange('calendar')}
        style={styles.tab}
      >
        <CalendarDays
          color={value === 'calendar' ? theme.colors.primary : theme.colors.placeholder}
          size={24}
        />
      </Pressable>

      <Pressable
        accessibilityLabel="Create task"
        accessibilityRole="button"
        onPress={onCreate}
        style={({ pressed }) => [
          styles.fab,
          theme.shadow,
          {
            backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary,
          },
        ]}
      >
        <Plus color="#FFFFFF" size={27} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  fabSpace: { width: 70 },
  fab: {
    position: 'absolute',
    top: -27,
    left: '50%',
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    transform: [{ translateX: -29 }],
  },
});
