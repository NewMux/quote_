import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <View
      className={`bg-white rounded-3xl p-5 shadow-sm shadow-black/5 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
