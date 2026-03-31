const store = new Map();

class MMKV {
  constructor() {}

  set(key, value) {
    store.set(key, value);
  }

  getString(key) {
    const value = store.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  delete(key) {
    store.delete(key);
  }
}

module.exports = { MMKV };
