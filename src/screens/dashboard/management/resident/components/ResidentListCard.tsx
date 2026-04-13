import React from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { EntityItem } from '../types';
import { asText, getResidentName, getResidentSecondary, statusToLabel, typeToLabel } from '../utils';

type ResidentListCardProps = {
  item: EntityItem;
  isDark: boolean;
  cardWidth: number;
  onPress: (item: EntityItem) => void;
};

type ResidentStatus = 'active' | 'inactive';

export function ResidentListCard({ item, isDark, cardWidth, onPress }: ResidentListCardProps) {
  const statusRaw = asText(item.status).trim().toLowerCase();
  const status: ResidentStatus = statusRaw === 'inactive' || statusRaw === '0' ? 'inactive' : 'active';

  const secondary = getResidentSecondary(item);
  const residentType = typeToLabel(item.type);

  const accent = status === 'active' ? '#22c55e' : '#f97316';

  const scale = React.useRef(new Animated.Value(1)).current;
  const fade = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <Animated.View
      style={[
        localStyles.card,
        {
          width: cardWidth,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          opacity: fade,
          transform: [
            { scale },
            {
              translateY: fade.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[localStyles.topLine, { backgroundColor: accent }]} />

      <Pressable
        onPress={() => onPress(item)}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
          }).start()
        }
        style={localStyles.inner}
      >
        <View style={localStyles.header}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[localStyles.title, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
              {getResidentName(item)}
            </Text>

            <Text numberOfLines={1} style={[localStyles.subtitle, { color: isDark ? '#94a3b8' : '#475569' }]}>
              {secondary}
            </Text>
          </View>

          <View
            style={[
              localStyles.status,
              {
                backgroundColor: status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)',
              },
            ]}
          >
            <View style={[localStyles.dot, { backgroundColor: status === 'active' ? '#22c55e' : '#f97316' }]} />
            <Text style={[localStyles.statusText, { color: status === 'active' ? '#22c55e' : '#f97316' }]}>
              {statusToLabel(status)}
            </Text>
          </View>
        </View>

        <View style={[localStyles.metaBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}>
          <Text style={localStyles.metaText}>Nov: {residentType}</Text>
          <Text numberOfLines={1} style={localStyles.metaText}>Telefon: {asText(item.phone) || '-'}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    minHeight: 150,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    overflow: 'hidden',
  },
  topLine: {
    height: 4,
    width: '100%',
  },
  inner: {
    padding: 13,
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaBox: {
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
});
