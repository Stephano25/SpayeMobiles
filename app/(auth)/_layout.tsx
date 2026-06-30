import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from '../../src/services/TranslationService';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StatusBar, Platform } from 'react-native';
import { COLORS } from '../../src/config';

// Import des écrans
import LoginScreen from './login';
import RegisterScreen from './register';
import IPConfigScreen from './ip-config';

const Stack = createNativeStackNavigator();

export default function AuthLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { 
            backgroundColor: colors.background,
            paddingTop: insets.top || (Platform.OS === 'ios' ? 44 : 30),
            paddingBottom: insets.bottom || (Platform.OS === 'ios' ? 34 : 20),
          },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="IPConfig" component={IPConfigScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </View>
  );
}