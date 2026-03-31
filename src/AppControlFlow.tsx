import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './AppNavigator';
import Toast from './components/Toast';
import { useThemeMode } from './hooks/use-theme';
import { persistor, store } from './store';
import { APP_LAYOUT_COLORS } from './theme/layout-colors';
import { toastRef } from './utils/action';

const AppNavigationRoot: React.FC = () => {
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';

  const navigationTheme = React.useMemo(
    () =>
      isDark
        ? {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: APP_LAYOUT_COLORS.primaryDark,
              background: APP_LAYOUT_COLORS.backgroundDark,
              card: APP_LAYOUT_COLORS.drawerDark,
              text: APP_LAYOUT_COLORS.textDark,
              border: APP_LAYOUT_COLORS.borderDark,
              notification: APP_LAYOUT_COLORS.notificationDark,
            },
          }
        : {
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: APP_LAYOUT_COLORS.primaryLight,
              background: APP_LAYOUT_COLORS.backgroundLight,
              card: APP_LAYOUT_COLORS.drawerLight,
              text: APP_LAYOUT_COLORS.textLight,
              border: APP_LAYOUT_COLORS.borderLight,
              notification: APP_LAYOUT_COLORS.notificationLight,
            },
          },
    [isDark],
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
};

const AppControlFlow: React.FC = () => {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        {persistor ? (
          <PersistGate persistor={persistor}>
            <AppNavigationRoot />
          </PersistGate>
        ) : (
          <AppNavigationRoot />
        )}
        <Toast {...{ ref: toastRef }} />
      </Provider>
    </SafeAreaProvider>
  );
};

export default AppControlFlow;
