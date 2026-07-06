// src/components/SafeScreen.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({ 
  children, 
  backgroundColor = '#fff',
  style 
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      },
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});