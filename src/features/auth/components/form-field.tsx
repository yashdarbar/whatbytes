import type { ComponentProps } from 'react';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Eye, EyeOff } from '@/components/ui/icons';
import { fontFamilies } from '@/theme';

type FormFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  error?: string;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, secureTextEntry = false, style, ...props },
  ref,
) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const canToggleVisibility = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          autoCapitalize="none"
          placeholderTextColor="#9BA3B2"
          secureTextEntry={canToggleVisibility && !isPasswordVisible}
          style={[styles.input, style]}
          {...props}
        />
        {canToggleVisibility ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setIsPasswordVisible((visible) => !visible)}
            style={styles.visibilityButton}
          >
            {isPasswordVisible ? (
              <EyeOff color="#929AA9" size={20} strokeWidth={2} />
            ) : (
              <Eye color="#929AA9" size={20} strokeWidth={2} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  label: {
    color: '#9BA3B2',
    fontFamily: fontFamilies.semibold,
    fontSize: 11,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
  },
  inputShell: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
  },
  inputShellError: { borderColor: '#D6535D' },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 16,
    color: '#24324A',
    fontFamily: fontFamilies.regular,
    fontSize: 15,
  },
  visibilityButton: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#C53D4A',
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});
