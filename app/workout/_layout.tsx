import { Stack } from 'expo-router';
import { Colors } from '../../src/constants';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'fade_from_bottom',
        animationDuration: 250,
      }}
    />
  );
}
