/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import './gesture-handler';
import { enableFreeze } from 'react-native-screens';

enableFreeze();
AppRegistry.registerComponent(appName, () => App);
