import React from 'react';
import { View, StyleSheet, StatusBar, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config';

interface SafeScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  scrollable?: boolean;
  bottomPadding?: number;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  backgroundColor = COLORS.background,
  statusBarStyle = 'light-content',
  scrollable = true,
  bottomPadding,
}) => {
  const insets = useSafeAreaInsets();
  
  // Padding bottom minimum pour que le contenu ne soit pas caché
  const safeBottomPadding = bottomPadding || (insets.bottom > 0 ? insets.bottom + 80 : 40);

  const Wrapper = scrollable ? ScrollView : View;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <Wrapper
        style={[styles.content, { backgroundColor }]}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: safeBottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {children}
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
    paddingTop: 0,
  },
});