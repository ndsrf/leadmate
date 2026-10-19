import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SIM_PORT = 5173;

/** Where the Vite dev server serves the simulation bundle (see `npm run sim:dev`). */
export function getSimUrl(): string {
  const override = process.env.EXPO_PUBLIC_SIM_URL;
  if (override) return override;
  if (Platform.OS === 'web') {
    return `http://${window.location.hostname}:${SIM_PORT}`;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? 'localhost:8081';
  return `http://${hostUri.split(':')[0]}:${SIM_PORT}`;
}
