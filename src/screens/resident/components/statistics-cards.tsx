import React from 'react';
import { Text, View } from 'react-native';

type StatisticsCardsProps = {
  loading: boolean;
  isDark: boolean;
};

type StatItem = {
  label: string;
  value: string;
};

const stats: StatItem[] = [
  { label: 'Total Payments', value: '18,420' },
  { label: 'Monthly Growth', value: '+12.4%' },
  { label: 'Open Requests', value: '37' },
];

export function StatisticsCards({ loading, isDark }: StatisticsCardsProps) {
  return (
    <View className="flex-row gap-3">
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
