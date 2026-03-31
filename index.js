/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

LogBox.ignoreLogs([
	'InteractionManager has been deprecated',
]);

const originalWarn = console.warn;
console.warn = (...args) => {
	if (typeof args[0] === 'string' && args[0].includes('InteractionManager has been deprecated')) {
		return;
	}

	originalWarn(...args);
};

AppRegistry.registerComponent(appName, () => App);
