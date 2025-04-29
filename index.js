/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { enableFreeze } from 'react-native-screens';
import { LogBox } from 'react-native';

// Enable screen freezing for better performance
enableFreeze();

// Ignore specific warnings that might be causing issues
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
]);

AppRegistry.registerComponent(appName, () => App);
