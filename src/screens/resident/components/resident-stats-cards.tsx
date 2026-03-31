import React from 'react';
import { Text, View } from 'react-native';

type ResidentStatsCardsProps = {
  loading: boolean;
  isDark: boolean;
};

const stats = [
  { label: 'Residents Online', value: '128' },
  { label: 'New Registrations', value: '14' },
  { label: 'Resolved Today', value: '22' },
];

export function ResidentStatsCards({ loading, isDark }: ResidentStatsCardsProps) {
  return (
    <View className="mt-6 flex-row gap-3">
      {stats.map(item => (
        <View
          key={item.label}
          className={
            isDark
              ? 'flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 p-4'
              : 'flex-1 rounded-2xl border border-red-200 bg-white p-4'
          }
        >
          <Text className={isDark ? 'text-xs text-zinc-400' : 'text-xs text-red-700'}>{item.label}</Text>
          <Text className={isDark ? 'mt-2 text-xl font-bold text-white' : 'mt-2 text-xl font-bold text-red-900'}>
            {loading ? '...' : item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
