import React from 'react';
import { StatusBar } from 'expo-status-bar';
import WatchlistScreen from './app/(tabs)/index';

export default function App() {
  return (
    <>
      <WatchlistScreen />
      <StatusBar style="auto" />
    </>
  );
}
