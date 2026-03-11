// expo-router ルートレイアウト
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { COLORS } from '../src/constants';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.surface },
            headerTintColor: COLORS.text,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'サクヨテ',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: '設定',
              presentation: 'card',
              headerShown: false,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
