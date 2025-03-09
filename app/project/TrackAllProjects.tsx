import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import ButtonPageTabs from '@/components/custom/ButtonPageTabs';
import { Colors } from '@/constants/Colors';
import { CircularProgressBase } from 'react-native-circular-progress-indicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import API_BASE_URL from '@/constants/config/api';

const TrackAllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [projectsCompletionStats, setProjectsCompletionStats] = useState({
    early: 0, // Count of early projects
    late: 0,  // Count of late projects
  });
  const [phasesProgress, setPhasesProgress] = useState(0);
  const [phasesCompletionStats, setPhasesCompletionStats] = useState({
    early: 0, // Count of early phases
    late: 0,  // Count of late phases
  });

  // Fetch all projects and their phases
  useEffect(() => {
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
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        setProjects(data);

        // Calculate overall progress
        const totalProjects = data.length;
        const completedProjects = data.filter((project) => project.completed).length;
        const overallProgressValue = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
        setOverallProgress(overallProgressValue);

        // Calculate projects completion stats (early vs late)
        let earlyProjects = 0;
        let lateProjects = 0;
        data.forEach((project) => {
          if (project.completed) {
            const endDate = new Date(project.end_date);
            const completedAt = new Date(project.completed_at);
            if (completedAt < endDate) {
              earlyProjects++;
            } else {
              lateProjects++;
            }
          }
        });
        setProjectsCompletionStats({
          early: earlyProjects, // Count of early projects
          late: lateProjects,  // Count of late projects
        });

        // Calculate phases progress
        const allPhases = data.flatMap((project) => project.phases || []);
        const totalPhases = allPhases.length;
        const completedPhases = allPhases.filter((phase) => phase.completed).length;
        const phasesProgressValue = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
        setPhasesProgress(phasesProgressValue);

        // Calculate phases completion stats (early vs late)
        let earlyPhases = 0;
        let latePhases = 0;
        allPhases.forEach((phase) => {
          if (phase.completed) {
            const endDate = new Date(phase.end_date);
            const completedAt = new Date(phase.completed_at);
            if (completedAt < endDate) {
              earlyPhases++;
            } else {
              latePhases++;
            }
          }
        });
        setPhasesCompletionStats({
          early: earlyPhases, // Count of early phases
          late: latePhases,  // Count of late phases
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  // Render function for each project item
  const renderProjectItem = ({ item }) => {
    const startDate = new Date(item.start_date);
    const endDate = new Date(item.end_date);
    const completedAt = item.completed ? new Date(item.completed_at) : null;

    // Calculate progress percentage based on phases
    const phases = item.phases || [];
    const totalPhases = phases.length;
    const completedPhases = phases.filter((phase) => phase.completed).length;

    // If all phases are completed but the project is not marked as completed, set progress to 99%
    const progress =
      totalPhases > 0
        ? completedPhases === totalPhases && !item.completed
          ? 99 // 99% if all phases are completed but the project is not marked as completed
          : (completedPhases / totalPhases) * 100 // Otherwise, calculate progress normally
        : 0; // Default to 0 if there are no phases

    return (
      <TouchableOpacity
        onPress={() => {
          // Only navigate to the update page if the project is not completed
          if (!item.completed) {
            router.push({
              pathname: '/project/UpdateProject',
              params: { id: item.id },
            });
          }
        }}
      >
        <View
          style={[
            styles.projectItem,
            item.completed && styles.completedProjectItem, // Apply grayed-out style for completed projects
          ]}
        >
          {/* Left Side: Project Name, Description, and Percentage */}
          <View style={styles.leftContainer}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{item.title}</Text>
            </View>
            <Text style={styles.projectDescription}>{item.description}</Text>
            {completedAt && (
              <Text style={styles.completedDate}>
                Completed: {completedAt.toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Right Side: End Date and Progress Circle */}
          <View style={styles.rightContainer}>
            {/* End Date */}
            <Text style={styles.projectDetails}>
              {endDate.toLocaleDateString()}
            </Text>

            <Text style={styles.projectPercentage}>{progress.toFixed(1)}</Text>

            {/* Progress Circle */}
            <View style={styles.circleWrapper}>
              <CircularProgressBase
                value={progress} // Progress percentage
                radius={30} // Adjust size as needed
                duration={1000}
                activeStrokeColor="rgb(26, 17, 71)" // Custom color for active stroke
                inActiveStrokeColor="rgba(255, 255, 255, 0.3)" // Translucent white for inactive stroke
                inActiveStrokeOpacity={1}
              />
              <Text style={styles.circleText}>
                {progress.toFixed(1)} {/* Percentage inside the circle */}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Main Content */}
      <View style={styles.container}>
        <Text style={styles.title}>Track All Projects</Text>

        {/* Cards Row (30% of height) */}
        <View style={styles.cardsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.progressContainer}
          >
            {/* Projects Completion (Early vs Late) */}
            <View style={styles.progressItem}>
              <View>
                <Text style={styles.progressLabel}>Projects Completed Stats</Text>
                <View style={styles.circleWrapper}>
                  <CircularProgressBase
                    value={
                      projectsCompletionStats.early + projectsCompletionStats.late > 0
                        ? (projectsCompletionStats.early / (projectsCompletionStats.early + projectsCompletionStats.late)) * 100
                        : 0
                    }
                    radius={30}
                    duration={1000}
                    activeStrokeColor="#87CEEB"
                    inActiveStrokeColor="rgba(255, 255, 255, 0.3)"
                    inActiveStrokeOpacity={1}
                  />
                  <Text style={styles.circleText}>
                    {(
                      projectsCompletionStats.early + projectsCompletionStats.late > 0
                        ? (projectsCompletionStats.early / (projectsCompletionStats.early + projectsCompletionStats.late)) * 100
                        : 0
                    ).toFixed(1)}
                  </Text>
                </View>
              </View>

              <View style={[{ flexDirection: 'row' }]}>
                <Text style={[styles.progressLabel, { marginRight: 8 }]}>
                  Early: {projectsCompletionStats.early}
                </Text>
                <Text style={styles.progressLabel}>Late: {projectsCompletionStats.late}</Text>
              </View>
            </View>

            {/* Phases Completion (Early vs Late) */}
            <View style={styles.progressItem}>
              <View>
                <Text style={styles.progressLabel}>Phases Completed Stats</Text>
                <View style={styles.circleWrapper}>
                  <CircularProgressBase
                    value={
                      phasesCompletionStats.early + phasesCompletionStats.late > 0
                        ? (phasesCompletionStats.early / (phasesCompletionStats.early + phasesCompletionStats.late)) * 100
                        : 0
                    }
                    radius={30}
                    duration={1000}
                    activeStrokeColor="#87CEEB"
                    inActiveStrokeColor="rgba(255, 255, 255, 0.3)"
                    inActiveStrokeOpacity={1}
                  />
                  <Text style={styles.circleText}>
                    {(
                      phasesCompletionStats.early + phasesCompletionStats.late > 0
                        ? (phasesCompletionStats.early / (phasesCompletionStats.early + phasesCompletionStats.late)) * 100
                        : 0
                    ).toFixed(1)}
                  </Text>
                </View>
              </View>
              <View style={[{ flexDirection: 'row' }]}>
                <Text style={[styles.progressLabel, { marginRight: 8 }]}>
                  Early: {phasesCompletionStats.early}
                </Text>
                <Text style={styles.progressLabel}>Late: {phasesCompletionStats.late}</Text>
              </View>
            </View>

            {/* Overall Progress */}
            <View style={styles.progressItem}>
              <View>
                <Text style={styles.progressLabel}>Ongoing Project Progress</Text>
                <View style={styles.circleWrapper}>
                  <CircularProgressBase
                    value={overallProgress}
                    radius={30}
                    duration={1000}
                    activeStrokeColor="#87CEEB"
                    inActiveStrokeColor="rgba(255, 255, 255, 0.3)"
                    inActiveStrokeOpacity={1}
                  />
                  <Text style={styles.circleText}>{overallProgress.toFixed(1)}</Text>
                </View>
              </View>
              <View style={[{ flexDirection: 'row' }]}>
                <Text style={[styles.progressLabel, { marginRight: 4 }]}>
                  Completed: {projects.filter((project) => project.completed).length}
                </Text>
                <Text style={styles.progressLabel}>Total: {projects.length}</Text>
              </View>
            </View>

            {/* Phases Progress */}
            <View style={styles.progressItem}>
              <View>
                <Text style={styles.progressLabel}>Ongoing Phases Progress</Text>
                <View style={styles.circleWrapper}>
                  <CircularProgressBase
                    value={phasesProgress}
                    radius={30}
                    duration={1000}
                    activeStrokeColor="#87CEEB"
                    inActiveStrokeColor="rgba(255, 255, 255, 0.3)"
                    inActiveStrokeOpacity={1}
                  />
                  <Text style={styles.circleText}>{phasesProgress.toFixed(1)}</Text>
                </View>
              </View>
              <View style={[{ flexDirection: 'row' }]}>
                <Text style={[styles.progressLabel, { marginRight: 4 }]}>
                  Completed: {projects.flatMap((project) => project.phases || []).filter((phase) => phase.completed).length}
                </Text>
                <Text style={styles.progressLabel}>
                  Total: {projects.flatMap((project) => project.phases || []).length}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Project List Section (70% of height) */}
        <View style={styles.projectListContainer}>
          <Text style={styles.sectionTitle}>Project List</Text>
          <FlatList
            data={projects}
            renderItem={renderProjectItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.projectList}
          />
        </View>
      </View>

      {/* Bottom Tabs */}
      <View style={styles.tabContainer}>
        <ButtonPageTabs />
      </View>
    </SafeAreaView>
  );
};

export default TrackAllProjects;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.light.textPrimary,
  },
  cardsContainer: {
    flex: 0.3, // 30% of the height
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  progressItem: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    margin: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    height: 180,
    width: 130,
  },
  progressLabel: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  circleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  projectListContainer: {
    flex: 0.7, // 70% of the height
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.light.textPrimary,
  },
  projectList: {
    paddingBottom: 20,
  },
  projectItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  completedProjectItem: {
    opacity: 0.6, // Grayed-out style for completed projects
  },
  leftContainer: {
    flex: 1,
    marginRight: 16,
  },
  rightContainer: {
    alignItems: 'center',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.textPrimary,
  },
  projectPercentage: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    position: 'absolute',
    top: 45,
    elevation: 20, // Android: Adds elevation (shadow)
    zIndex: 20, 
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  completedDate: {
    fontSize: 12,
    color: '#888',
  },
  projectDetails: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
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
});