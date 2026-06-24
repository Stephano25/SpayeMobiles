import React from 'react';
import { View, StyleSheet, StatusBar, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config';
import { NAVIGATION_BAR, TAB_BAR_HEIGHT } from '../config/navigationBar';

interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  scrollable?: boolean;
  bottomPadding?: number;
  withTabBar?: boolean;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  backgroundColor = COLORS.background,
  statusBarStyle = 'light-content',
  scrollable = true,
  bottomPadding,
  withTabBar = true,
}) => {
  const insets = useSafeAreaInsets();
  
  // 🔥 Calcul du padding bottom pour la barre de navigation du téléphone
  const safeBottomPadding = bottomPadding || (
    withTabBar 
      ? TAB_BAR_HEIGHT + (insets.bottom > 0 ? insets.bottom : 0)
      : NAVIGATION_BAR.getBottomPadding()
  );

  const topPadding = insets.top > 0 ? insets.top : NAVIGATION_BAR.getTopPadding();

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
        {/* 🔥 Espace supplémentaire en bas pour la barre de navigation */}
        <View style={{ height: safeBottomPadding }} />
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