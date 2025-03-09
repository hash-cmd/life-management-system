import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ButtonPageTabs from '@/components/custom/ButtonPageTabs';
import { Colors } from '@/constants/Colors';
import { Calendar } from 'react-native-calendars';
import { Link, router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import API_BASE_URL from '@/constants/config/api';
import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const categories = ['On-Going', 'Achieved', 'Note'];

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [projects, setProjects] = useState([]);
  const [selectedDateProjects, setSelectedDateProjects] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState({
    labels: ['Early', 'On Time', 'Late'],
    datasets: [
      {
        data: [0, 0, 0],
      },
    ],
  });
  const [rewardPoints, setRewardPoints] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Fetch user data and projects
  const fetchData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserName(user.username);

        if (user.profile_picture) {
          const localUri = `${FileSystem.documentDirectory}${user.profile_picture}`;
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (fileInfo.exists) {
            setProfilePicture(localUri);
          }
        }
      }

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('Access token not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
      updateMarkedDates(data);
      calculateCompletionStats(data);
    } catch (error) {
      console.error('Error fetching data:', error.message || error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch reward points
  const fetchRewardPoints = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('Access token not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/reward/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reward points');
      }

      const data = await response.json();
      setRewardPoints(data.points);
    } catch (error) {
      console.error('Error fetching reward points:', error.message || error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    fetchRewardPoints();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchRewardPoints();
  };

  // Update marked dates based on projects
  const updateMarkedDates = (projects) => {
    const dates = {};
    projects.forEach((project) => {
      if (project.end_date && !project.completed) {
        const date = new Date(project.end_date).toISOString().split('T')[0];
        dates[date] = { selected: true, selectedColor: Colors.light.textPrimary };
      }
    });
    setMarkedDates(dates);
  };

  // Calculate completion stats (early, on time, late)
  const calculateCompletionStats = (projects) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    projects.forEach((project) => {
      if (project.completed_at && project.end_date) {
        const completedDate = new Date(project.completed_at);
        const endDate = new Date(project.end_date);

        if (completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
          if (completedDate < endDate) {
            earlyCount++;
          } else if (completedDate.getTime() === endDate.getTime()) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        }
      }
    });

    const totalCompleted = earlyCount + onTimeCount + lateCount;
    const earlyPercentage = totalCompleted > 0 ? Math.round((earlyCount / totalCompleted) * 100) : 0;
    const onTimePercentage = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 0;
    const latePercentage = totalCompleted > 0 ? Math.round((lateCount / totalCompleted) * 100) : 0;

    setChartData({
      labels: ['Early', 'On Time', 'Late'],
      datasets: [
        {
          data: [earlyPercentage, onTimePercentage, latePercentage],
        },
      ],
    });
  };

  // Handle date selection
  const handleDayPress = (day) => {
    const filteredProjects = projects.filter((project) => {
      const projectDate = new Date(project.end_date).toISOString().split('T')[0];
      return projectDate === day.dateString;
    });

    setSelectedDateProjects(filteredProjects);
    setIsModalVisible(true);
  };

  // Toggle the sliding menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? -width : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        console.error('Tokens not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to logout from the backend');
      }

      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');

      router.replace('/intro/LoginScreen');
    } catch (error) {
      console.error('Error logging out:', error.message || error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sliding Menu */}
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
          <TouchableOpacity onPress={toggleMenu}>
            <Ionicons name="close" size={24} color={Colors.light.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.menuLinks}>
          <TouchableOpacity style={styles.menuLink} onPress={() => router.push('/main/Settings')}>
            <Ionicons name="person" size={24} color={Colors.light.textPrimary} />
            <Text style={styles.menuLinkText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuLink} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color={Colors.light.textPrimary} />
            <Text style={styles.menuLinkText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.navbarRow}>
              <TouchableOpacity onPress={toggleMenu}>
                <Ionicons name="menu" size={32} color={Colors.light.textPrimary} />
              </TouchableOpacity>
              <View style={styles.rewardContainer}>
                <View style={[{ flexDirection: 'row', marginRight: 10 }]}>
                  <Ionicons name="trophy" size={24} color="rgba(255, 215, 0, 1)" />
                  <Text style={[styles.rewardText, { marginLeft: 8 }]}>{rewardPoints}</Text>
                </View>
                <Link href="/main/Settings">
                  {profilePicture ? (
                    <Image source={{ uri: profilePicture }} style={styles.avatar} />
                  ) : (
                    <Avatar.Icon size={48} icon="account" style={styles.avatar} />
                  )}
                </Link>
              </View>
            </View>
            <Text style={styles.greeting}>
              Hello, <Text style={styles.userName}>{userName || 'Guest'}!</Text>
            </Text>
            <Text style={styles.subText}>Have a nice day!</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category, index) => (
                <TouchableOpacity key={index} style={index === 0 ? styles.activeCategory : styles.category}>
                  <Text style={index === 0 ? styles.activeCategoryText : styles.categoryText}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Habit Tracker Chart */}
            <View style={styles.card}>
              <View>
                <Text style={styles.cardHeaderText}>Habit Tracker</Text>
              </View>
              <View style={{ paddingHorizontal: 18 }}>
                <BarChart
                  data={{
                    labels: chartData.labels,
                    datasets: chartData.datasets,
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  chartConfig={{
                    backgroundColor: Colors.light.primary,
                    backgroundGradientFrom: Colors.light.primary,
                    backgroundGradientTo: Colors.light.primary,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </View>
            </View>

            {/* Calendar with marked end dates */}
            <Calendar
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: Colors.light.primary,
                todayTextColor: Colors.light.primary,
                arrowColor: Colors.light.primary,
              }}
              onDayPress={handleDayPress}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.tabContainer}>
        <ButtonPageTabs />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    marginBottom: 70,
  },
  headerContainer: {
    padding: 20,
    marginTop: 30,
  },
  navbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  userName: {
    color: Colors.light.primary,
  },
  subText: {
    fontSize: 18,
    color: Colors.light.textSecondary,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  category: {
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
  },
  activeCategory: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
  },
  categoryText: {
    color: Colors.light.textSecondary,
  },
  activeCategoryText: {
    color: Colors.light.background,
    fontWeight: 'bold',
  },
  tabContainer: {
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 0.6,
    height: '100%',
    backgroundColor: Colors.light.background,
    padding: 20,
    zIndex: 1000,
  },
  menuHeader: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
  },
  menuLinks: {
    marginTop: 20,
  },
  menuLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.textSecondary,
  },
  menuLinkText: {
    fontSize: 18,
    color: Colors.light.textPrimary,
    marginLeft: 10,
  },
  card: {
    backgroundColor: Colors.light.primary,
    height: 280,
    marginBottom: 24,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    color: '#fff',
    flexDirection: 'column',
  },
  cardHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
});

export default Dashboard;