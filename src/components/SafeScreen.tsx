import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config';

interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  backgroundColor = COLORS.background,
  statusBarStyle = 'light-content',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top || (Platform.OS === 'ios' ? 44 : 30),
          paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 20),
        },
      ]}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});