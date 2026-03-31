const React = require('react');
const { View, TextInput, Text, Pressable, ActivityIndicator } = require('react-native');

const passthrough = Component => ({ children, ...props }) =>
  React.createElement(Component, props, children);

module.exports = {
  Box: passthrough(View),
  Center: passthrough(View),
  VStack: passthrough(View),
  Heading: passthrough(Text),
  Text: passthrough(Text),
  Input: passthrough(View),
  InputField: ({ children, ...props }) => React.createElement(TextInput, props, children),
  Button: ({ children, ...props }) => React.createElement(Pressable, props, children),
  ButtonText: passthrough(Text),
  ButtonSpinner: ({ ...props }) => React.createElement(ActivityIndicator, props),
  GluestackUIProvider: ({ children }) => children,
};
