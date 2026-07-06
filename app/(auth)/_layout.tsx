// app/(auth)/_layout.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './login';
import RegisterScreen from './register';

const Stack = createNativeStackNavigator();

export default function AuthLayout() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}