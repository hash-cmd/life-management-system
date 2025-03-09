import { Stack } from 'expo-router';
import React from 'react';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Projects" />
      <Stack.Screen name='AddProject'  />
      <Stack.Screen name='UpdateProject'  />
      <Stack.Screen name='TrackAllProjects'  />
    </Stack>
  );
}
