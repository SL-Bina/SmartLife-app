import React from 'react';
import { Text, View } from 'react-native';

type PaymentDynamicsChartProps = {
  loading: boolean;
  options: { labels: string[]; title: string };
  series: number[];
  height: number;
  isDark: boolean;
};

export function PaymentDynamicsChart({
  loading,
  options,
  series,
  height,
  isDark,
}: PaymentDynamicsChartProps) {
  const maxValue = Math.max(...series, 1);

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
      <View className="mt-4 flex-row items-end gap-2" style={{ height: height - 80 }}>
        {options.labels.map((label, index) => {
          const value = series[index] ?? 0;
          const barHeight = loading ? 10 : Math.max(10, (value / maxValue) * (height - 110));

          return (
            <View key={label} className="flex-1 items-center">
              <View
                className={isDark ? 'w-full rounded-t-md bg-red-500/80' : 'w-full rounded-t-md bg-red-600'}
                style={{ height: barHeight }}
              />
              <Text className={isDark ? 'mt-2 text-[10px] text-zinc-400' : 'mt-2 text-[10px] text-red-700'}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
