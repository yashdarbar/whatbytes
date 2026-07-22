import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamilies } from '@/theme';

type AuthFooterProps = {
  prompt: string;
  action: string;
  disabled?: boolean;
  onPress: () => void;
};

export function AuthFooter({ prompt, action, disabled = false, onPress }: AuthFooterProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.prompt}>{prompt} </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ disabled }}
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
      >
        <Text style={styles.action}>{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  prompt: { color: '#A1A7B2', fontFamily: fontFamilies.regular, fontSize: 13 },
  action: { color: '#5C5CF4', fontFamily: fontFamilies.semibold, fontSize: 13 },
});
