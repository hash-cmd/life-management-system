import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import ButtonPageTabs from '@/components/custom/ButtonPageTabs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import API_BASE_URL from '@/constants/config/api';

const Settings = () => {
  const [user, setUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    profile_picture: '', // This will store the filename
    password: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Store the local image URI
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Access token not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/profile/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data) {
          setUser({
            ...response.data,
            password: '', // Ensure password is initialized
          });

          // Load the profile picture from local storage if it exists
          if (response.data.profile_picture) {
            const localUri = `${FileSystem.documentDirectory}${response.data.profile_picture}`;
            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (fileInfo.exists) {
              setSelectedImage(localUri);
            }
          }
        } else {
          setError('No profile data found.');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to fetch profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setUser((prevUser) => ({
      ...prevUser,
      [field]: value,
    }));
    setErrors({ ...errors, [field]: '' });
  };

  const validateFields = () => {
    let newErrors = {};
    if (!user.first_name) newErrors.first_name = 'First name is required';
    if (!user.last_name) newErrors.last_name = 'Last name is required';
    if (!user.username) newErrors.username = 'Username is required';
    if (!user.email) newErrors.email = 'Email is required';
    if (user.email && !/\S+@\S+\.\S+/.test(user.email)) newErrors.email = 'Invalid email address';

    // Only validate password if it's provided
    if (user.password && user.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop(); // Extract the filename
      const newPath = `${FileSystem.documentDirectory}${filename}`;

      // Save the image to local storage
      await FileSystem.copyAsync({
        from: localUri,
        to: newPath,
      });

      setSelectedImage(newPath); // Store the local URI of the image
    }
  };

  const saveProfile = async () => {
    if (!validateFields()) return;
    setIsLoading(true);

    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      setError('Access token not found. Please log in again.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', user.username);
      formData.append('email', user.email);
      formData.append('first_name', user.first_name);
      formData.append('last_name', user.last_name);

      // Only append password if it's not empty
      if (user.password && user.password.trim()) {
        formData.append('password', user.password);
      }

      // Append only the filename for profile_picture
      if (selectedImage) {
        const filename = selectedImage.split('/').pop(); // Extract the filename
        formData.append('profile_picture', filename);
      }

      // Log FormData for debugging
      for (let [key, value] of formData.entries()) {
        console.log('FormData:', key, value);
      }

      const response = await axios.put(`${API_BASE_URL}/profile/`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        // Update the user state with the new profile data
        setUser((prevUser) => ({
          ...prevUser,
          ...response.data, // Ensure profile_picture is updated
        }));
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderText}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profilePictureContainer}>
          <View style={styles.profilePictureWrapper}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }} // Display the selected image
                style={styles.profilePicture}
              />
            ) : (
              <Ionicons name="person" size={80} color={Colors.light.primary} /> // Fallback to default icon
            )}
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <Ionicons name="camera" size={24} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.inputContainer}>
            <Text style={styles.infoLabel}>First Name</Text>
            <TextInput
              style={styles.infoValue}
              value={user.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.infoLabel}>Last Name</Text>
            <TextInput
              style={styles.infoValue}
              value={user.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.infoLabel}>Username</Text>
            <TextInput
              style={styles.infoValue}
              value={user.username}
              onChangeText={(value) => handleInputChange('username', value)}
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.infoLabel}>Email</Text>
            <TextInput
              style={styles.infoValue}
              value={user.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.infoLabel}>Password</Text>
            <TextInput
              style={styles.infoValue}
              value={user.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={true}
              placeholder="Leave blank to keep current password"
              placeholderTextColor={Colors.light.textSecondary}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={Colors.light.background} /> : <Text style={styles.saveButtonText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.tabContainer}>
        <ButtonPageTabs />
      </View>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  pageHeader: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  pageHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profilePictureContainer: {
    alignItems: 'center',
    paddingVertical: 56,
    backgroundColor: 'rgba(142, 137, 167, 0.35)',
  },
  profilePictureWrapper: {
    position: 'relative',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderColor: Colors.light.primary,
    borderWidth: 2,
    backgroundColor: 'rgb(255, 255, 255)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  profileInfo: {
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  inputContainer: {
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginLeft: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 24,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    padding: 15,
    borderRadius: 56,
    alignItems: 'center',
    marginHorizontal: 40,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    height: 70,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
  },
});