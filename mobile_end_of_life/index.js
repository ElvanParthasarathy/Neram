/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { enableScreens, enableFreeze } from 'react-native-screens'; // Optimization
import App from './App';
import { name as appName } from './app.json';

enableScreens(); // Enable native screens for better performance
enableFreeze(true); // Freeze unfocused screens to prevent unnecessary re-renders

AppRegistry.registerComponent(appName, () => App);
