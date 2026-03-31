import React from 'react';
import { Text, View } from 'react-native';
import { ChartColumn } from 'lucide-react-native';

type HeaderProps = {
  title: string;
  subtitle: string;
  isDark: boolean;
};

export function Header({ title, subtitle, isDark }: HeaderProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center gap-2">
        <ChartColumn size={22} color={isDark ? '#f87171' : '#b91c1c'} />
        <Text className={isDark ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-red-900'}>
          {title}
        </Text>
      </View>
      <Text className={isDark ? 'mt-2 text-zinc-300' : 'mt-2 text-red-700'}>{subtitle}</Text>
    </View>
  );
}
