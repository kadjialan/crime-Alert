import { Platform } from 'react-native';

// Use your machine's local IP when testing on a physical device
// Use localhost for emulator/simulator
const API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const SOCKET_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

export { API_URL, SOCKET_URL };
