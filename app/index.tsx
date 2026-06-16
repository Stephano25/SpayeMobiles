import { useAuth } from '../src/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../src/config';

export default function Index() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  return <Redirect href={isAdmin ? '/(admin)' : '/(user)'} />;
}