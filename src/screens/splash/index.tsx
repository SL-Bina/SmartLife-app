import React from 'react';
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

const LOGO = require('../../../public/Site_Logo/color_big.png');

export default function Splash() {
  const { width, height } = useWindowDimensions();

  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    progress.setValue(0);

    const animation = Animated.sequence([
      Animated.delay(650),
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progress]);

  const maxSize = Math.hypot(width, height) * 2;
  const startDiameter = 94;
  const midDiameter = 220;
  const startScale = startDiameter / maxSize;
  const midScale = midDiameter / maxSize;

  const spreadScale = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [startScale, midScale, 1.14],
  });

  const spreadOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.95, 0.92, 1],
  });

  const logoScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <Animated.View
        style={[
          styles.expandingContainer,
          {
            width: maxSize,
            height: maxSize,
            borderRadius: maxSize / 2,
            backgroundColor: '#ef4444',
            opacity: spreadOpacity,
            transform: [{ scale: spreadScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoAnchor,
          {
            top: '50%',
            transform: [
              { translateX: -67 },
              { translateY: -67 },
              { scale: logoScale },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.logoSurface,
            {
              backgroundColor: '#ffffff',
              borderColor: 'rgba(15, 23, 42, 0.08)',
              shadowColor: '#334155',
            },
          ]}
        >
          <Image
            source={LOGO}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  expandingContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  logoAnchor: {
    position: 'absolute',
    left: '50%',
  },
  logoSurface: {
    width: 134,
    height: 134,
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 9,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
});