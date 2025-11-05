// App.js
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import Home from './screens/Home';
import MovieDetail from './screens/MovieDetail';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import AdminDashboard from './screens/AdminDashboard';
import AdminMovies from './screens/AdminMovies';
import AdminUsers from './screens/AdminUsers';
import EditUserScreen from './screens/EditUserScreen';
import AddMovieScreen from './screens/AddMovieScreen';
import General from './screens/General';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="General"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="General" component={General} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="MovieDetail" component={MovieDetail} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminMovies" component={AdminMovies} />
        <Stack.Screen name="AdminUsers" component={AdminUsers} />
        <Stack.Screen name="EditUser" component={EditUserScreen} />
        <Stack.Screen name="AddMovie" component={AddMovieScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
