import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Link } from 'expo-router';

const ButtonPageTabs = () => {
  return (
    <View style={styles.tabWrapper}>
      <Link href="/main/Dashboard" asChild>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="home" size={24} color={Colors.light.primary} />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/project/Projects" asChild>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="briefcase" size={24} color={Colors.light.primary} />
          <Text style={styles.tabText}>Projects</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/project/TrackAllProjects" asChild>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="pulse" size={24} color={Colors.light.primary} />
          <Text style={styles.tabText}>Tracker</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/main/Settings" asChild>
        <TouchableOpacity style={styles.tabButton}>
          <Ionicons name="settings" size={24} color={Colors.light.primary} />
          <Text style={styles.tabText}>Settings</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default ButtonPageTabs;

const styles = StyleSheet.create({
  tabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 0,
    backgroundColor: '#fff',
    position: 'relative',
  },
  tabButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  tabText: {
    marginTop: 5,
    color: Colors.light.textPrimary,
  },
});