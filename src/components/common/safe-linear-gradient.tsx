import React from 'react';
import { UIManager, View } from 'react-native';
import LinearGradient, {
  type LinearGradientProps,
} from 'react-native-linear-gradient';

const hasNativeLinearGradient = (() => {
  try {
    return Boolean(UIManager.getViewManagerConfig?.('BVLinearGradient'));
  } catch {
    return false;
  }
})();

export default function SafeLinearGradient({
  colors,
  children,
  style,
  ...rest
}: LinearGradientProps) {
  if (!hasNativeLinearGradient) {
    return (
      <View style={[style, { backgroundColor: colors?.[0] ?? 'transparent' }]}>
        {children}
      </View>
    );
  }

  return (
    <LinearGradient colors={colors} style={style} {...rest}>
      {children}
    </LinearGradient>
  );
}