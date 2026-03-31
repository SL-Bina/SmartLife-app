import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  createTransform,
  persistReducer,
  persistStore,
  type PersistConfig,
} from 'redux-persist';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import authReducer, { forceLogout } from './auth-slice';
import themeReducer from './theme-slice';
import localeReducer from './locale-slice';
import managementFilterReducer from './management-filter-slice';
import globalMtkReducer from './global-mtk-slice';
import quickNavigationReducer from './quick-navigation-slice';
import residentPropertyReducer from './resident-property-slice';
import { mmkvStorage } from './mmkv-storage';
import { configureApiAuth } from '../services/api';

const isTestEnv =
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV === 'test';

const rootReducer = combineReducers({
  auth: authReducer,
  theme: themeReducer,
  locale: localeReducer,
  managementFilter: managementFilterReducer,
  globalMtk: globalMtkReducer,
  quickNavigation: quickNavigationReducer,
  residentProperty: residentPropertyReducer,
});

const authTransform = createTransform(
  (inboundState: any, key) => {
    if (key !== 'auth') {
      return inboundState;
    }

    const { token, user, isResident, isAuthenticated } = inboundState;

    return {
      token,
      user,
      isResident,
      isAuthenticated,
      isInitialized: false,
      isInitializing: false,
      status: 'idle',
      error: null,
    };
  },
  (outboundState: any) => outboundState,
  { whitelist: ['auth'] }
);

const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: [
    'auth',
    'theme',
    'locale',
    'managementFilter',
    'globalMtk',
    'quickNavigation',
    'residentProperty',
  ],
  transforms: [authTransform],
};

const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(
  persistConfig,
  rootReducer
);

const appReducer = (isTestEnv ? rootReducer : persistedReducer) as typeof rootReducer;

export const store = configureStore({
  reducer: appReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

configureApiAuth({
  getToken: () => store.getState().auth.token,
  onUnauthorized: () => {
    const authState = store.getState().auth;
    if (!authState.isAuthenticated && !authState.token) {
      return;
    }

    store.dispatch(forceLogout());
  },
});

export const persistor = isTestEnv ? null : persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
