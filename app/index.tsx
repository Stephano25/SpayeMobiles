// app/index.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/config/colors';
import { detectBackendIP } from '../src/config/api';

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    const init = async () => {
      try {
        await detectBackendIP();
      } catch (error) {
        console.error('❌ Erreur détection:', error);
      }

      if (!isLoading) {
        if (user) {
          const isAdmin = user.role === 'admin' || user.role === 'super_admin';
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: isAdmin ? 'Admin' : 'User' }],
            })
          );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            })
          );
        }
      }
    };

    init();
  }, [isLoading, user, navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
      <ActivityIndicator size="large" color={COLORS.white} />
    </View>
  );
}