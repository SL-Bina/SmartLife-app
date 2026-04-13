import React from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EntityItem } from '../types';
import { asText, getPropertyName, getPropertySecondary, statusToLabel } from '../utils';

type PropertyListCardProps = {
  item: EntityItem;
  isDark: boolean;
  cardWidth: number;
  onPress: (item: EntityItem) => void;
};

type PropertyStatus = 'active' | 'inactive';

export function PropertyListCard({ item, isDark, cardWidth, onPress }: PropertyListCardProps) {
  const statusRaw = asText(item.status).trim().toLowerCase();
  const status: PropertyStatus = statusRaw === 'inactive' || statusRaw === '0' ? 'inactive' : 'active';

  const apartmentNumber = asText(item.apartment_number).trim() || '-';
  const area = asText(item.area).trim() || '-';
  const secondary = getPropertySecondary(item);

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
        styles.card,
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
      <View style={[styles.topLine, { backgroundColor: accent }]} />

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
        style={styles.inner}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.title, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
              {getPropertyName(item)}
            </Text>

            <Text numberOfLines={1} style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#475569' }]}>
              {secondary}
            </Text>
          </View>

          <View
            style={[
              styles.status,
              {
                backgroundColor:
                  status === 'active'
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(249,115,22,0.15)',
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: status === 'active' ? '#22c55e' : '#f97316' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: status === 'active' ? '#22c55e' : '#f97316' },
              ]}
            >
              {statusToLabel(status)}
            </Text>
          </View>
        </View>

        <View style={[styles.contactBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}>
          <Text style={styles.contactText}>Menzil no: {apartmentNumber}</Text>
          <Text numberOfLines={1} style={styles.contactText}>Sahe: {area} m2</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    height: 150,
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
  contactBox: {
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
});
