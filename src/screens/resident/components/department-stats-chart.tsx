import React from 'react';
import { Text, View } from 'react-native';

import type { DepartmentStat } from '../../../data/dashboard-data';

type DepartmentStatsChartProps = {
  loading: boolean;
  departmentStats: DepartmentStat[];
  isDark: boolean;
};

export function DepartmentStatsChart({
  loading,
  departmentStats,
  isDark,
}: DepartmentStatsChartProps) {
  return (
    <View
      className={
        isDark
          ? 'rounded-2xl border border-zinc-700 bg-zinc-900 p-4'
          : 'rounded-2xl border border-red-200 bg-white p-4'
      }
    >
      <Text className={isDark ? 'text-base font-bold text-zinc-100' : 'text-base font-bold text-red-900'}>
        Department Stats
      </Text>

      <View className="mt-4 gap-3">
        {departmentStats.map(item => {
          const percent = Math.round((item.completed / item.total) * 100);

          return (
            <View key={item.id}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-red-700'}>{item.name}</Text>
                <Text className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-red-700'}>
                  {loading ? '...' : `${item.completed}/${item.total}`}
                </Text>
              </View>
              <View className={isDark ? 'h-2 rounded-full bg-zinc-700' : 'h-2 rounded-full bg-red-100'}>
                <View
                  className={isDark ? 'h-2 rounded-full bg-red-500' : 'h-2 rounded-full bg-red-600'}
                  style={{ width: `${loading ? 0 : percent}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
