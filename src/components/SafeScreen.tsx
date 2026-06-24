import React from 'react';
import { View, StyleSheet, StatusBar, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config';

interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  scrollable?: boolean;
  withTabBar?: boolean;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  backgroundColor = COLORS.background,
  statusBarStyle = 'light-content',
  scrollable = true,
  withTabBar = false,
}) => {
  const insets = useSafeAreaInsets();
  
  // 🔥 Sans tab bar, padding bottom réduit
  const safeBottomPadding = insets.bottom > 0 ? insets.bottom + 20 : 20;
  const topPadding = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 30);

  const Wrapper = scrollable ? ScrollView : View;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <Wrapper
        style={[styles.content, { backgroundColor }]}
        contentContainerStyle={[
          styles.contentContainer,
          { 
            paddingBottom: safeBottomPadding,
            paddingTop: topPadding,
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {children}
      </Wrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 0,
  },
});