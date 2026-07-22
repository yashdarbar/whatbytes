import type { ComponentProps, PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { useAppTheme } from '@/theme';

type TextVariant = 'display' | 'title' | 'body' | 'label';

type AppTextProps = PropsWithChildren<
  ComponentProps<typeof Text> & {
    variant?: TextVariant;
    muted?: boolean;
  }
>;

export function AppText({
  children,
  variant = 'body',
  muted = false,
  style,
  ...props
}: AppTextProps) {
  const theme = useAppTheme();

  return (
    <Text
      {...props}
      style={[
        theme.typography[variant],
        { color: muted ? theme.colors.textMuted : theme.colors.text },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
