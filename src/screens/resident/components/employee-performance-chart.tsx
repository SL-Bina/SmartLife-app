import React from 'react';
import { Text, View } from 'react-native';

type EmployeePerformanceChartProps = {
  loading: boolean;
  options: { labels: string[]; title: string };
  series: number[];
  height: number;
  isDark: boolean;
};

export function EmployeePerformanceChart({
  loading,
  options,
  series,
  height,
  isDark,
}: EmployeePerformanceChartProps) {
  return (
    <View
      className={
        isDark
          ? 'rounded-2xl border border-zinc-700 bg-zinc-900 p-4'
          : 'rounded-2xl border border-red-200 bg-white p-4'
      }
      style={{ minHeight: height }}
    >
      <Text className={isDark ? 'text-base font-bold text-zinc-100' : 'text-base font-bold text-red-900'}>
        {options.title}
      </Text>
      <View className="mt-4 gap-3">
        {options.labels.map((label, index) => {
          const value = loading ? 0 : series[index] ?? 0;

          return (
            <View key={label}>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-red-700'}>{label}</Text>
                <Text className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-red-700'}>{value}%</Text>
              </View>
              <View className={isDark ? 'h-2 rounded-full bg-zinc-700' : 'h-2 rounded-full bg-red-100'}>
                <View
                  className={isDark ? 'h-2 rounded-full bg-red-500' : 'h-2 rounded-full bg-red-600'}
                  style={{ width: `${value}%` }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
