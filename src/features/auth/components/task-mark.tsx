import { StyleSheet, View } from 'react-native';

import { Check } from '@/components/ui/icons';

export function TaskMark() {
  return (
    <View accessibilityLabel="Task Management logo" style={styles.frame}>
      <View style={[styles.dot, styles.dotOrange]} />
      <View style={[styles.dot, styles.dotNavy]} />
      <View style={[styles.dot, styles.dotPurple]} />
      <View style={[styles.spark, styles.sparkTop]} />
      <View style={[styles.spark, styles.sparkLeft]} />
      <View style={styles.tile}>
        <Check color="#FFFFFF" size={48} strokeWidth={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 138,
    height: 126,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#5C5CF4',
    shadowColor: '#4646C8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
  dotOrange: { left: 13, top: 42, backgroundColor: '#F39132' },
  dotNavy: { right: 9, top: 51, backgroundColor: '#24375B' },
  dotPurple: { right: 20, bottom: 12, backgroundColor: '#6A5CF5' },
  spark: { position: 'absolute', width: 8, height: 8, backgroundColor: '#F5C94B' },
  sparkTop: { right: 22, top: 15, transform: [{ rotate: '45deg' }] },
  sparkLeft: { left: 25, bottom: 20, transform: [{ rotate: '45deg' }] },
});
