import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './app-text';
import { useAppTheme } from '@/theme';

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
};

export function Button({ label, labelStyle, disabled, style, ...props }: ButtonProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...props}
      style={(state) => [
        styles.button,
        {
          backgroundColor: state.pressed ? theme.colors.primaryPressed : theme.colors.primary,
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.5 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <AppText variant="label" style={[{ color: theme.colors.onPrimary }, labelStyle]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
