// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    // ✅ Gérer les liens profonds pour le callback OAuth
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep Link reçu:', url);
      
      if (url.includes('auth/callback')) {
        // ✅ Extraire le token
        try {
          const parsedUrl = new URL(url);
          const token = parsedUrl.searchParams.get('token');
          
          if (token) {
            console.log('✅ Token extrait du deep link');
            // Rediriger vers la page de callback
            router.push(`/auth/callback?token=${token}`);
          } else {
            console.warn('⚠️ Token non trouvé dans le deep link');
          }
        } catch (error) {
          console.error('❌ Erreur parsing deep link:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: '#0d0820',
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}