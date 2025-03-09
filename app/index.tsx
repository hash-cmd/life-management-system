import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Link } from 'expo-router';

const Index = () => {
  const { width } = Dimensions.get('window');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/icon.png')} // Update the path to your image
              style={styles.image}
              resizeMode="contain"
            />
            {/* Add the bold and big text here */}
            <Text style={styles.title}>Life Management System</Text>
          </View>
          {/* <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
            <Text style={styles.subHeader}>
              Your all-in-one solution for seamless life management and productivity.
            </Text>
          </Animated.View> */}

          <Link href="/intro/LoginScreen" style={[styles.button, { width: width < 768 ? 320 : '50%' }]} asChild>
            <TouchableOpacity >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </Link>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Index;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    paddingVertical: 32,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center', // Center image and text vertically
    alignItems: 'center', // Center image and text horizontally
  },
  image: {
    width: 360, // Set a specific width
    height: 110, // Set a specific height
  },
  title: {
    fontSize: 20, // Big font size
    fontWeight: 'bold', // Bold text
    color: Colors.light.textPrimary, // Use your primary text color
    textAlign: 'center', // Center the text horizontally
    flexWrap: 'wrap',// Set a maximum width to prevent text from stretching too far
  },
  content: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  subHeader: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 20,
    borderRadius: 48,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});