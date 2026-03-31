type SyncStorageLike = {
  set: (key: string, value: string) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
};

type PersistStorageLike = {
  setItem: (key: string, value: string) => Promise<unknown>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
};

const memoryFallback = new Map<string, string>();
let hasLoggedStorageFallback = false;

const logStorageFallbackOnce = (message: string) => {
  if (hasLoggedStorageFallback) {
    return;
  }

  hasLoggedStorageFallback = true;
  console.warn(message);
};

const createMemoryStorage = (): PersistStorageLike => ({
  setItem: (key: string, value: string) => {
    memoryFallback.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => Promise.resolve(memoryFallback.get(key) ?? null),
  removeItem: (key: string) => {
    memoryFallback.delete(key);
    return Promise.resolve();
  },
});

const createAsyncStorageFallback = (): PersistStorageLike | null => {
  try {
    const asyncStorageModule = require('@react-native-async-storage/async-storage');
    const asyncStorage = (asyncStorageModule?.default ?? asyncStorageModule) as PersistStorageLike;

    if (
      typeof asyncStorage?.setItem === 'function' &&
      typeof asyncStorage?.getItem === 'function' &&
      typeof asyncStorage?.removeItem === 'function'
    ) {
      return asyncStorage;
    }

    return null;
  } catch {
    return null;
  }
};

const createStorage = (): PersistStorageLike => {
  try {
    const { MMKV } = require('react-native-mmkv') as {
      MMKV: new (config?: { id?: string }) => SyncStorageLike;
    };

    const mmkv = new MMKV({ id: 'smartlife-storage' });

    return {
      setItem: (key: string, value: string) => {
        mmkv.set(key, value);
        return Promise.resolve(true);
      },
      getItem: (key: string) => Promise.resolve(mmkv.getString(key) ?? null),
      removeItem: (key: string) => {
        mmkv.delete(key);
        return Promise.resolve();
      },
    };
  } catch (error) {
    const asyncStorageFallback = createAsyncStorageFallback();

    if (asyncStorageFallback) {
      logStorageFallbackOnce(
        '[storage] MMKV unavailable in this debug mode. Using AsyncStorage fallback.',
      );
      return asyncStorageFallback;
    }

    // Last resort fallback for environments where no native storage backend is available.
    logStorageFallbackOnce(
      '[storage] MMKV/AsyncStorage unavailable. Using in-memory fallback for this session.',
    );

    return createMemoryStorage();
  }
};

export const mmkvStorage = createStorage();
