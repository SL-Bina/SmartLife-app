const mockState = {
  auth: {
    token: null,
    user: null,
    isResident: false,
    isAuthenticated: false,
    status: 'idle',
    error: null,
  },
};

function Provider(props) {
  return props.children;
}

function useDispatch() {
  return () => Promise.resolve();
}

function useSelector(selector) {
  return selector(mockState);
}

module.exports = {
  Provider,
  useDispatch,
  useSelector,
};
