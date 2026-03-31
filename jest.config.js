module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/jest/styleMock.js',
    '^@gluestack-ui/themed$': '<rootDir>/jest/gluestackThemedMock.js',
    '^react-native-mmkv$': '<rootDir>/jest/reactNativeMmkvMock.js',
    '^react-redux$': '<rootDir>/jest/reactReduxMock.js',
    '^lottie-react-native$': '<rootDir>/jest/lottieReactNativeMock.js',
    '^\\./src/providers/ui-provider$': '<rootDir>/jest/uiProviderMock.js',
    '^react-native-css-interop/jsx-runtime$': '<rootDir>/jest/reactNativeCssInteropJsxRuntimeMock.js',
    '^react-native-css-interop$': '<rootDir>/jest/reactNativeCssInteropMock.js',
    '^react-native-css-interop/.+$': '<rootDir>/jest/reactNativeCssInteropMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@gluestack-ui|@gluestack-style|react-redux|@reduxjs|immer)/)',
  ],
};
