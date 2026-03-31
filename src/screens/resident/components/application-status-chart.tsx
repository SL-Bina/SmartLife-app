import React from 'react';
import { Text, View } from 'react-native';

type ApplicationStatusChartProps = {
  loading: boolean;
  options: { labels: string[]; title: string };
  series: number[];
  height: number;
  windowWidth: number;
  isDark: boolean;
};

const colors = ['#ef4444', '#f97316', '#22c55e'];

export function ApplicationStatusChart({
  loading,
  options,
  series,
  height,
  windowWidth,
  isDark,
}: ApplicationStatusChartProps) {
  const total = series.reduce((sum, value) => sum + value, 0) || 1;
  const compact = windowWidth < 380;

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

      <View className={isDark ? 'mt-4 h-4 flex-row overflow-hidden rounded-full bg-zinc-700' : 'mt-4 h-4 flex-row overflow-hidden rounded-full bg-red-100'}>
        {series.map((value, index) => (
          <View
            key={`${options.labels[index]}-${value}`}
            style={{
              width: `${loading ? 0 : (value / total) * 100}%`,
              backgroundColor: colors[index % colors.length],
            }}
          />
        ))}
      </View>

      <View className="mt-4 gap-2">
        {options.labels.map((label, index) => (
          <View key={label} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <Text className={isDark ? (compact ? 'text-[11px] text-zinc-300' : 'text-xs text-zinc-300') : compact ? 'text-[11px] text-red-700' : 'text-xs text-red-700'}>
                {label}
              </Text>
            </View>
            <Text className={isDark ? 'text-xs text-zinc-300' : 'text-xs text-red-700'}>
              {loading ? '...' : series[index]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
