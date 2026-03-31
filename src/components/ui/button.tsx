import React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../../lib/utils';

const buttonVariants = cva(
  'items-center justify-center rounded-xl active:opacity-90',
  {
    variants: {
      variant: {
        default: 'bg-slate-900',
        secondary: 'bg-slate-200',
        outline: 'border border-slate-300 bg-transparent',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      default: 'text-white',
      secondary: 'text-slate-900',
      outline: 'text-slate-900',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    textClassName?: string;
    children: React.ReactNode;
  };

export function Button({
  className,
  textClassName,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <Text className={cn(buttonTextVariants({ variant }), textClassName)}>
        {children}
      </Text>
    </Pressable>
  );
}
