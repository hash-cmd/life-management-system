import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { Link, router } from 'expo-router';
import ButtonPageTabs from '@/components/custom/ButtonPageTabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import API_BASE_URL from '@/constants/config/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const slideAnimation = useState(new Animated.Value(0))[0];
  const opacityAnimation = useState(new Animated.Value(0))[0];

  // Request permissions for notifications
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('You need to enable notifications to receive reminders.');
      }
    })();
  }, []);

  const fetchProjects = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('API Response:', data);
      setProjects(data);
      setLoading(false);

      // Schedule notifications for projects and phases
      scheduleNotifications(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const toggleProjectCompletion = async (projectId) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/complete/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const updatedProject = await response.json();
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId ? updatedProject : project
        )
      );
    } catch (error) {
      console.error('Error toggling project completion:', error);
      setError(error.message);
    }
  };

  const scheduleNotifications = (projects) => {
    projects.forEach((project) => {
      // Skip if project is completed
      if (!project.completed) {
        // Schedule notifications for project start and end
        scheduleNotification(project.start_date, project.start_time, `Project Start: ${project.title}`, true); // 15 minutes before
        scheduleNotification(project.start_date, project.start_time, `Project Started: ${project.title}`, false); // At event time

        scheduleNotification(project.end_date, project.end_time, `Project Deadline: ${project.title}`, true); // 15 minutes before
        scheduleNotification(project.end_date, project.end_time, `Project Deadline Reached: ${project.title}`, false); // At event time

        // Schedule notifications for phases start and end
        project.phases.forEach((phase) => {
          // Skip if phase is completed
          if (!phase.completed) {
            scheduleNotification(phase.start_date, phase.start_time, `Phase Start: ${phase.title}`, true); // 15 minutes before
            scheduleNotification(phase.start_date, phase.start_time, `Phase Started: ${phase.title}`, false); // At event time

            scheduleNotification(phase.end_date, phase.end_time, `Phase Deadline: ${phase.title}`, true); // 15 minutes before
            scheduleNotification(phase.end_date, phase.end_time, `Phase Deadline Reached: ${phase.title}`, false); // At event time
          }
        });
      }
    });
  };

  const navigateToUpdateScreen = (projectId) => {
    router.push({
      pathname: '/project/UpdateProject',
      params: { id: projectId },
    });
  };

  const calculateCompletionPercentage = (phases, isProjectCompleted) => {
    if (!phases || phases.length === 0) return 0;

    const completedPhases = phases.filter((phase) => phase.completed).length;
    const totalPhases = phases.length;

    const percentage = Math.round((completedPhases / totalPhases) * 100);

    if (completedPhases === totalPhases && !isProjectCompleted) {
      return 99;
    }

    if (isProjectCompleted) {
      return 100;
    }

    return percentage;
  };

  // Schedule a notification
  const scheduleNotification = async (date, time, title, isReminder) => {
    if (!date || !time) return; // Skip if date or time is missing

    const [year, month, day] = date.split('-');
    const [hours, minutes] = time.split(':');

    // Create a Date object for the event time
    const eventDate = new Date(year, month - 1, day, hours, minutes);

    // Calculate the notification time
    const notificationDate = isReminder
      ? new Date(eventDate.getTime() - 15 * 60 * 1000) // 15 minutes before
      : eventDate; // At event time

    // Check if the notification date is in the future
    if (notificationDate.getTime() > Date.now()) {
      // Use the correct trigger format
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: title,
          sound: true,
        },
        trigger: {
          type: 'date',
          timestamp: notificationDate.getTime(), // Use timestamp in milliseconds
        },
      });

      console.log(`Scheduled notification for: ${notificationDate}`);
    } else {
      console.log(`Skipping notification for past event: ${title}`);
    }
  };

  // Fetch projects and schedule notifications when the component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects based on the active tab and search query
  const filteredProjects = projects.filter((project) => {
    const matchesTab =
      activeTab === 'ongoing' ? !project.completed : project.completed;

    const matchesSearch = project.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const ProjectItem = React.memo(({ item, onPress, onToggleCompletion }) => {
    const formatDate = (dateString) => {
      if (!dateString) return { monthDay: 'No date', year: '' };
  
      const date = new Date(dateString);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
  
      return { monthDay: `${month} ${day}`, year: `${year}` };
    };
  
    const { monthDay: endMonthDay, year: endYear } = formatDate(item.end_date);
    const completionPercentage = calculateCompletionPercentage(item.phases, item.completed);
  
    return (
      <TouchableOpacity
        onPress={() => {
          if (!item.completed) {
            onPress(item.id); // Only allow navigation if the project is not completed
          }
        }}
        accessibilityLabel={`Project ${item.title}`}
        accessibilityRole="button"
      >
        <View style={[
          styles.projectItem,
          item.completed && styles.completedProjectItem, // Apply grayed-out style for completed projects
        ]}>
          {/* Project Header */}
          <View style={styles.projectHeader}>
            <Text style={styles.projectName}>{item.title}</Text>
            <Text style={styles.projectDetails}>
              {endMonthDay}, {endYear}
            </Text>
          </View>
  
          {/* Project Description */}
          <Text style={styles.projectDescription}>{item.description || 'No description'}</Text>
  
          {/* Completion Status */}
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              {item.completed ? 'Completed' : 'In Progress'}
            </Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => onToggleCompletion(item.id)}
            >
              <Ionicons
                name={item.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={24}
                color={item.completed ? 'green' : '#ccc'}
              />
            </TouchableOpacity>
          </View>
  
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  const renderNoProjects = () => (
    <View style={styles.noProjectsContainer}>
      <Image
        source={require('@/assets/images/no-task.png')}
        style={styles.noProjectsImage}
        resizeMode="contain"
      />
      <Text style={styles.noProjectsText}>No projects found</Text>
    </View>
  );

  // Handle FAB click to expand/collapse
  const handleFabClick = () => {
    setIsFabExpanded(!isFabExpanded);
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: isFabExpanded ? 0 : 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnimation, {
        toValue: isFabExpanded ? 0 : 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const slideUpStyle = {
    transform: [
      {
        translateY: slideAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100], // Adjust this value to control the slide-up distance
        }),
      },
    ],
    opacity: opacityAnimation,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header and Search */}
      <View style={styles.headerContainer}>
          {isSearchVisible ? (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search projects..."
                placeholderTextColor="#ccc"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity
                onPress={() => {
                  setIsSearchVisible(false);
                  setSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerRow}>
              <View style={[{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}]}>
                <Ionicons name="calendar" size={24} color="#fff"/><Text style={[styles.headerText, {marginLeft: 12}]}>Projects</Text>
                </View>
              
              <TouchableOpacity onPress={() => setIsSearchVisible(true)}>
                <Ionicons name="search" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      <View style={styles.contentContainer}>
        

        {/* Project List */}
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : error ? (
          <Text style={styles.errorText}>Error: {error}</Text>
        ) : filteredProjects.length === 0 ? (
          renderNoProjects()
        ) : (
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ProjectItem
                item={item}
                onPress={navigateToUpdateScreen}
                onToggleCompletion={toggleProjectCompletion}
              />
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleFabClick}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Slide-Up Tabs with Icons */}
      <Animated.View style={[styles.slideUpTabs, slideUpStyle]}>
         <Link href="/project/AddProject" asChild>
          <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                handleFabClick();
              }}
            >
              <Ionicons name="calendar" size={24} color="#fff" />
            </TouchableOpacity>
        </Link>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            setActiveTab('ongoing');
            handleFabClick();
          }}
        >
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            setActiveTab('completed');
            handleFabClick();
          }}
        >
          <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Fixed Bottom Tabs */}
      <View style={styles.fixedTabContainer}>
        <ButtonPageTabs />
      </View>
    </SafeAreaView>
  );
};

export default Projects;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Colors.light.primary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    color: '#000',
  },
  projectItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedProjectItem: {
    opacity: 0.6, // Grayed-out style for completed projects
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
    flex: 1,
  },
  projectDetails: {
    fontSize: 12,
    color: '#888',
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  completionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#555',
  },
  toggleButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 90,
  },
  noProjectsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProjectsImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  noProjectsText: {
    fontSize: 24,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: 108,
    right: 40,
    backgroundColor: Colors.light.primary,
    borderRadius: 40,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  slideUpTabs: {
    position: 'absolute',
    bottom: 56,
    right: 40,
    borderRadius: 28,
    padding: 8,
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: Colors.light.primary,
  },
  fixedTabContainer: {
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});