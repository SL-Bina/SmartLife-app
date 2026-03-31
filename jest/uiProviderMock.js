const React = require('react');

function MockUIProvider(props) {
  return React.createElement(React.Fragment, null, props.children);
}

module.exports = MockUIProvider;
