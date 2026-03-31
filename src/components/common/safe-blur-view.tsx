import React from 'react';
import { StyleProp, UIManager, View, ViewStyle } from 'react-native';
import { BlurView, type BlurViewProps } from '@react-native-community/blur';

type SafeBlurViewProps = {
  style?: StyleProp<ViewStyle>;
  fallbackColor?: string;
} & Omit<BlurViewProps, 'style'>;

const hasNativeBlurView = (() => {
  try {
    return Boolean(
      UIManager.getViewManagerConfig?.('BlurView') ||
        UIManager.getViewManagerConfig?.('RCTBlurView') ||
        UIManager.getViewManagerConfig?.('RNBlurView'),
    );
  } catch {
    return false;
  }
})();

export default function SafeBlurView({
  style,
  fallbackColor = 'rgba(255,255,255,0.82)',
  ...rest
}: SafeBlurViewProps) {
  if (!hasNativeBlurView) {
    return <View style={[style, { backgroundColor: fallbackColor }]} />;
  }

  return <BlurView style={style} {...rest} />;
}
