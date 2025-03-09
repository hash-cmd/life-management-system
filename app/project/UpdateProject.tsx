import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import API_BASE_URL from '@/constants/config/api';

const UpdateProject = () => {
  const { id } = useLocalSearchParams(); // Get the project ID from the route
  console.log('Project ID from route:', id); // Debugging: Log the ID

  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null); // Dropdown value
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [phases, setPhases] = useState([]);
  const [completed, setCompleted] = useState(false); // Completed status for the overall project

  // State for date/time pickers
  const [showPicker, setShowPicker] = useState({
    startDate: false,
    endDate: false,
    startTime: false,
    endTime: false,
    phaseStartDate: false,
    phaseEndDate: false,
    phaseStartTime: false,
    phaseEndTime: false,
  });

  // State for phase editing
  const [isAddPhaseModalVisible, setIsAddPhaseModalVisible] = useState(false);
  const [phaseName, setPhaseName] = useState('');
  const [phaseStartDate, setPhaseStartDate] = useState(new Date());
  const [phaseEndDate, setPhaseEndDate] = useState(new Date());
  const [phaseStartTime, setPhaseStartTime] = useState(new Date());
  const [phaseEndTime, setPhaseEndTime] = useState(new Date());
  const [phaseComment, setPhaseComment] = useState('');
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);

  // Categories for the dropdown
  const categories = [
    { label: 'Work', value: 'work' },
    { label: 'Personal', value: 'personal' },
    { label: 'School', value: 'school' },
  ];

  // Fetch project details when the screen loads
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) {
          throw new Error('Access token not found');
        }

        const response = await fetch(`${API_BASE_URL}/projects/${id}/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        console.log('Project Details:', data); // Debugging: Log the project details

        // Handle array response (temporary workaround)
        const project = Array.isArray(data) ? data[0] : data;

        // Populate the form fields with the fetched data
        setTitle(project.title);
        setDescription(project.description);
        setCategory(project.category);
        setStartDate(new Date(project.start_date));
        setEndDate(new Date(project.end_date));

        // Parse start_time and end_time correctly
        const parseTime = (timeString) => {
          const [hours, minutes, seconds] = timeString.split(':');
          const date = new Date();
          date.setHours(parseInt(hours, 10));
          date.setMinutes(parseInt(minutes, 10));
          date.setSeconds(parseInt(seconds, 10));
          return date;
        };

        setStartTime(parseTime(project.start_time));
        setEndTime(parseTime(project.end_time));

        setPhases(project.phases || []); // Ensure phases is an array
        setCompleted(project.completed || false); // Set completed status

        // Log the state after updating
        console.log('Title:', project.title);
        console.log('Description:', project.description);
        console.log('Category:', project.category);
        console.log('Start Date:', project.start_date);
        console.log('End Date:', project.end_date);
        console.log('Start Time:', project.start_time);
        console.log('End Time:', project.end_time);
        console.log('Phases:', project.phases);
        console.log('Completed:', project.completed);
      } catch (error) {
        console.error('Error fetching project:', error);
        Alert.alert('Error', 'Failed to fetch project details');
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]); // Fetch project details only when the ID changes

  // Handle the "Update" button press
  const handleUpdate = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Access token not found');
      }

      // Check if all phases are completed
      const allPhasesCompleted = phases.every((phase) => phase.completed);

      // Prepare the data to be sent to the backend
      const updateData = {
        title,
        description,
        category,
        start_date: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        end_date: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        start_time: startTime.toTimeString().split(' ')[0], // Format as HH:MM:SS
        end_time: endTime.toTimeString().split(' ')[0], // Format as HH:MM:SS
        phases,
        completed, // Include the completed status
        completed_at: completed && allPhasesCompleted ? new Date().toISOString() : null, // Set completed_at if both project and phases are completed
      };

      const response = await fetch(`${API_BASE_URL}/projects/update/${id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      Alert.alert('Success', 'Project updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to the projects screen
            router.push('/project/Projects');
          },
        },
      ]);
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    }
  };

  // Toggle completed status for a phase
  const togglePhaseCompleted = (index) => {
    const updatedPhases = [...phases];
    updatedPhases[index].completed = !updatedPhases[index].completed;
    setPhases(updatedPhases);
  };

  // Handle date/time picker changes
  const handlePickerChange = (type, event, selectedDate) => {
    setShowPicker((prev) => ({ ...prev, [type]: false })); // Hide the picker
    if (selectedDate) {
      switch (type) {
        case 'startDate':
          setStartDate(selectedDate);
          break;
        case 'endDate':
          setEndDate(selectedDate);
          break;
        case 'startTime':
          setStartTime(selectedDate);
          break;
        case 'endTime':
          setEndTime(selectedDate);
          break;
        default:
          break;
      }
    }
  };

  // Handle editing a phase
  const handleEditPhase = (index) => {
    const phase = phases[index];
    if (!phase) {
      console.error('Phase not found at index:', index);
      return;
    }

    console.log('Editing Phase:', phase);
    console.log('Editing Index:', index);

    // Set the phase data in the modal state
    setPhaseName(phase.name || '');
    setPhaseStartDate(phase.startDate ? new Date(phase.startDate) : new Date());
    setPhaseEndDate(phase.endDate ? new Date(phase.endDate) : new Date());
    setPhaseStartTime(phase.startTime ? new Date(phase.startTime) : new Date());
    setPhaseEndTime(phase.endTime ? new Date(phase.endTime) : new Date());
    setPhaseComment(phase.comment || '');

    // Set the editing index and show the modal
    setEditingPhaseIndex(index);
    setIsAddPhaseModalVisible(true);

    console.log('Modal Visible:', isAddPhaseModalVisible);
  };

  // Handle saving a phase
  const handleSavePhase = () => {
    if (phaseStartDate > phaseEndDate) {
      Alert.alert('Invalid Date', 'The start date cannot be greater than the end date.');
      return;
    }

    const newPhase = {
      name: phaseName,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      startTime: phaseStartTime,
      endTime: phaseEndTime,
      comment: phaseComment,
      completed: false, // Default to false
    };

    if (editingPhaseIndex !== null) {
      // Update existing phase
      const updatedPhases = [...phases];
      updatedPhases[editingPhaseIndex] = newPhase;
      setPhases(updatedPhases);
    } else {
      // Add new phase
      setPhases([...phases, newPhase]);
    }

    // Reset phase fields
    setPhaseName('');
    setPhaseStartDate(new Date());
    setPhaseEndDate(new Date());
    setPhaseStartTime(new Date());
    setPhaseEndTime(new Date());
    setPhaseComment('');

    // Close the modal
    setIsAddPhaseModalVisible(false);
  };

  // Handle overall project completion toggle
  const handleProjectCompletionToggle = (value) => {
    setCompleted(value);

    // If the project is marked as completed, mark all phases as completed
    if (value) {
      const updatedPhases = phases.map((phase) => ({
        ...phase,
        completed: true,
      }));
      setPhases(updatedPhases);
    }
  };

  const { width, height } = Dimensions.get('window');

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { height: height * 0.35 }]}>
        <View style={styles.headerTitleView}>
          <Text style={styles.headerTitle}>Update Project</Text>
          <Switch
            value={completed}
            onValueChange={handleProjectCompletionToggle}
            trackColor={{ false: '#767577', true: Colors.light.primary }}
            thumbColor={completed ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        <View style={styles.headerInputView}>
          <Text style={{ marginTop: 16, color: '#fff' }}>Title</Text>
          <TextInput
            style={styles.headerInput}
            placeholder="Provide task title"
            placeholderTextColor="rgb(192, 192, 192)"
            value={title}
            onChangeText={setTitle}
          />
        </View>
        <View style={styles.headerInputView}>
          <Text style={{ marginTop: 16, color: '#fff' }}>Description</Text>
          <TextInput
            style={styles.headerInput}
            placeholder="Provide the task description"
            placeholderTextColor="rgb(192, 192, 192)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <View style={[styles.scrollContainer, { height: height * 0.55 }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            {/* Start Date & Time */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.dateLabel}>Start Date & Time</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => setShowPicker((prev) => ({ ...prev, startDate: true }))}
                    style={[styles.dateButtonWithShadow, { flex: 1, marginRight: 5 }]}
                  >
                    <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                    <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                  {showPicker.startDate && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display={Platform.OS === 'android' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => handlePickerChange('startDate', event, selectedDate)}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPicker((prev) => ({ ...prev, startTime: true }))}
                    style={[styles.dateButtonWithShadow, { flex: 1, marginLeft: 5 }]}
                  >
                    <Text style={styles.dateText}>{startTime.toLocaleTimeString()}</Text>
                    <Ionicons name="time" size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                  {showPicker.startTime && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display={Platform.OS === 'android' ? 'spinner' : 'default'}
                      onChange={(event, selectedTime) => handlePickerChange('startTime', event, selectedTime)}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* End Date & Time */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.dateLabel}>End Date & Time</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={() => setShowPicker((prev) => ({ ...prev, endDate: true }))}
                    style={[styles.dateButtonWithShadow, { flex: 1, marginRight: 5 }]}
                  >
                    <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                    <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                  {showPicker.endDate && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display={Platform.OS === 'android' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => handlePickerChange('endDate', event, selectedDate)}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPicker((prev) => ({ ...prev, endTime: true }))}
                    style={[styles.dateButtonWithShadow, { flex: 1, marginLeft: 5 }]}
                  >
                    <Text style={styles.dateText}>{endTime.toLocaleTimeString()}</Text>
                    <Ionicons name="time" size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                  {showPicker.endTime && (
                    <DateTimePicker
                      value={endTime}
                      mode="time"
                      display={Platform.OS === 'android' ? 'spinner' : 'default'}
                      onChange={(event, selectedTime) => handlePickerChange('endTime', event, selectedTime)}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Category Dropdown */}
            <View style={styles.categoryBox}>
              <Text style={styles.categoryLabel}>Select Category</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                iconStyle={styles.iconStyle}
                data={categories}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select category"
                value={category}
                onChange={(item) => setCategory(item.value)}
              />
            </View>

            {/* Phases Section */}
            <View style={styles.categoryBox}>
              <View style={styles.phasesHeader}>
                <Text style={styles.categoryLabel}>Phases</Text>
                <TouchableOpacity onPress={() => setIsAddPhaseModalVisible(true)}>
                  <Ionicons name="add-circle" size={24} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
              {phases.length === 0 ? (
                <Text style={{ color: 'gray', textAlign: 'center' }}>No phases added yet.</Text>
              ) : (
                phases.map((phase, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.phaseItem}
                    onPress={() => handleEditPhase(index)}
                  >
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <Switch
                      value={phase.completed || false}
                      onValueChange={() => togglePhaseCompleted(index)}
                      trackColor={{ false: '#767577', true: Colors.light.primary }}
                      thumbColor={phase.completed ? '#f5dd4b' : '#f4f3f4'}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fixed Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
          <Text style={styles.submitButtonText}>Update Project</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Phase Modal */}
      <Modal
        visible={isAddPhaseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddPhaseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header with Title and Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPhaseIndex !== null ? 'Edit Phase' : 'Add Phase'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddPhaseModalVisible(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Phase Name */}
            <TextInput
              style={styles.modalInput}
              placeholder="Phase Name"
              placeholderTextColor="gray"
              value={phaseName}
              onChangeText={setPhaseName}
            />

            {/* Phase Start Date */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowPicker((prev) => ({ ...prev, phaseStartDate: true }))}
            >
              <Text>Start Date: {phaseStartDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseStartDate && (
              <DateTimePicker
                value={phaseStartDate}
                mode="date"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowPicker((prev) => ({ ...prev, phaseStartDate: false }));
                  if (selectedDate) setPhaseStartDate(selectedDate);
                }}
              />
            )}

            {/* Phase End Date */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowPicker((prev) => ({ ...prev, phaseEndDate: true }))}
            >
              <Text>End Date: {phaseEndDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseEndDate && (
              <DateTimePicker
                value={phaseEndDate}
                mode="date"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowPicker((prev) => ({ ...prev, phaseEndDate: false }));
                  if (selectedDate) setPhaseEndDate(selectedDate);
                }}
              />
            )}

            {/* Phase Start Time */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowPicker((prev) => ({ ...prev, phaseStartTime: true }))}
            >
              <Text>Start Time: {phaseStartTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseStartTime && (
              <DateTimePicker
                value={phaseStartTime}
                mode="time"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowPicker((prev) => ({ ...prev, phaseStartTime: false }));
                  if (selectedTime) setPhaseStartTime(selectedTime);
                }}
              />
            )}

            {/* Phase End Time */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => setShowPicker((prev) => ({ ...prev, phaseEndTime: true }))}
            >
              <Text>End Time: {phaseEndTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseEndTime && (
              <DateTimePicker
                value={phaseEndTime}
                mode="time"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowPicker((prev) => ({ ...prev, phaseEndTime: false }));
                  if (selectedTime) setPhaseEndTime(selectedTime);
                }}
              />
            )}

            {/* Phase Comment */}
            <TextInput
              style={styles.modalInput}
              placeholder="Comment"
              placeholderTextColor="gray"
              value={phaseComment}
              onChangeText={setPhaseComment}
              multiline
            />

            {/* Modal Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setIsAddPhaseModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSavePhase}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UpdateProject;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  header: {
    backgroundColor: Colors.light.primary,
    padding: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  headerTitleView: {
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInputView: {
    width: '100%',
  },
  headerInput: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    color: '#fff',
    borderColor: 'rgb(192, 192, 192)',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  scrollContent: {
    padding: 40,
    paddingBottom: 100,
  },
  contentContainer: {
    backgroundColor: '#f9f9f9',
  },
  dateButtonWithShadow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  dateLabel: {
    color: 'rgb(129, 129, 129)',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  dateText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
  },
  categoryBox: {
    marginTop: 20,
  },
  categoryLabel: {
    color: 'rgb(129, 129, 129)',
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderBottomWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: 16,
    color: 'gray',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  phasesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  phaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalInput: {
    borderBottomWidth: 1,
    borderColor: 'gray',
    marginBottom: 16,
    paddingVertical: 8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});