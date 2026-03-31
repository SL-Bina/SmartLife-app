const React = require('react');
const { View } = require('react-native');

const LottieViewMock = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref })
);

module.exports = LottieViewMock;
