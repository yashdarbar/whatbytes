import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';

import type { Task, TaskSection } from '../types';
import { AppText } from '@/components/ui';
import { useAppTheme } from '@/theme';

import { TaskCard } from './task-card';

type TaskSectionListProps = {
  sections: TaskSection[];
  isLoading: boolean;
  hasActiveQuery: boolean;
  disabled?: boolean;
  onDelete: (task: Task) => void;
  onOpen: (task: Task) => void;
  onComplete: (task: Task) => void;
};

export function TaskSectionList({
  sections,
  isLoading,
  hasActiveQuery,
  disabled,
  onDelete,
  onOpen,
  onComplete,
}: TaskSectionListProps) {
  const theme = useAppTheme();

  return (
    <SectionList
      contentContainerStyle={[styles.content, sections.length === 0 && styles.emptyContent]}
      sections={sections}
      keyExtractor={(task) => task.id}
      keyboardShouldPersistTaps="handled"
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.dashboardBackground }]}>
          <AppText variant="label" style={styles.sectionTitle}>
            {section.title}
          </AppText>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <TaskCard
            disabled={disabled}
            task={item}
            onDelete={() => onDelete(item)}
            onOpen={() => onOpen(item)}
            onComplete={() => onComplete(item)}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" />
          ) : (
            <>
              <AppText variant="title">
                {hasActiveQuery ? 'No matching tasks' : 'No tasks yet'}
              </AppText>
              <AppText muted style={styles.emptyCopy}>
                {hasActiveQuery
                  ? 'Try changing your search or filters.'
                  : 'Use the plus button to create your first task.'}
              </AppText>
            </>
          )}
        </View>
      }
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 26 },
  emptyContent: { flexGrow: 1 },
  sectionHeader: { paddingTop: 12, paddingBottom: 7 },
  sectionTitle: { fontSize: 13, lineHeight: 19 },
  row: { marginBottom: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  emptyCopy: { maxWidth: 280, textAlign: 'center' },
});
