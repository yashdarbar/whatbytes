import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type SocialProvider = {
  name: string;
  backgroundColor: string;
  icon: IoniconName;
};

const providers: SocialProvider[] = [
  { name: 'Facebook', backgroundColor: '#315A9B', icon: 'logo-facebook' },
  { name: 'Google', backgroundColor: '#E84136', icon: 'logo-google' },
  { name: 'Apple', backgroundColor: '#050505', icon: 'logo-apple' },
];

type SocialAuthButtonsProps = {
  onPress: (provider: string) => void;
};

export function SocialAuthButtons({ onPress }: SocialAuthButtonsProps) {
  return (
    <View style={styles.row}>
      {providers.map((provider) => (
        <Pressable
          accessibilityLabel={`Continue with ${provider.name}`}
          accessibilityRole="button"
          key={provider.name}
          onPress={() => onPress(provider.name)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: provider.backgroundColor, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <Ionicons color="#FFFFFF" name={provider.icon} size={24} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 22 },
  button: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    shadowColor: '#15213A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
});
