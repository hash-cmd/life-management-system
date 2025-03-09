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
} from 'react-native';
import React, { useState } from 'react';
import { Colors } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import API_BASE_URL from '@/constants/config/api';

const AddProject = () => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAddPhaseModalVisible, setIsAddPhaseModalVisible] = useState(false);
  const [phaseName, setPhaseName] = useState('');
  const [phaseStartDate, setPhaseStartDate] = useState(new Date());
  const [phaseEndDate, setPhaseEndDate] = useState(new Date());
  const [phaseStartTime, setPhaseStartTime] = useState(new Date());
  const [phaseEndTime, setPhaseEndTime] = useState(new Date());
  const [phaseComment, setPhaseComment] = useState('');
  const [phases, setPhases] = useState([]);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);

  const categories = [
    { label: 'Work', value: 'work' },
    { label: 'Personal', value: 'personal' },
    { label: 'School', value: 'school' },
  ];

  const handlePicker = (type, value) => {
    setShowPicker((prev) => ({ ...prev, [type]: value }));
  };

  const handleSubmit = async () => {

    if (startDate > endDate) {
      Alert.alert('Invalid Date', 'The project start date cannot be greater than the end date.');
      return; // Stop further execution if validation fails
    }

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log('Access Token:', accessToken); // Debugging: Check the token

      if (!accessToken) {
        console.error('Access token not found');
        Alert.alert('Error', 'Please log in again.'); // Show error alert
        return;
      }

      const projectData = {
        title: projectName,
        description: description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        start_time: startTime.toTimeString(),
        end_time: endTime.toTimeString(),
        category: selectedCategory,
        phases: phases.map((phase) => ({
          name: phase.name,
          start_date: phase.startDate.toISOString(),
          end_date: phase.endDate.toISOString(),
          start_time: phase.startTime.toTimeString(),
          end_time: phase.endTime.toTimeString(),
          comment: phase.comment,
          completed: phase.completed, // Include the completed field
        })),
      };

      console.log('Project Data:', projectData); // Debugging: Check the payload

      const response = await axios.post(
        `${API_BASE_URL}/projects/create/`,
        projectData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Project created:', response.data);

      // Show success alert
      Alert.alert('Success', 'Project created successfully!', [{ text: 'OK', onPress: () => router.replace('/project/Projects') }]);

      // Reset all form fields
      setProjectName('');
      setDescription('');
      setStartDate(new Date());
      setEndDate(new Date());
      setStartTime(new Date());
      setEndTime(new Date());
      setSelectedCategory(null);
      setPhases([]);
    } catch (error) {
      if (error.response) {
        console.error('Server responded with an error:', error.response.data);
        if (error.response.status === 500) {
          Alert.alert('Error', 'Server error. Please try again later.'); // Show error alert
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        Alert.alert('Error', 'No response from the server. Please check your connection.'); // Show error alert
      } else {
        console.error('Error:', error.message);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.'); // Show error alert
      }
    }
  };

  const handleAddPhase = () => {
    setIsAddPhaseModalVisible(true);
    setEditingPhaseIndex(null);
  };

  const handleCloseModal = () => {
    setIsAddPhaseModalVisible(false);
    setPhaseName('');
    setPhaseStartDate(new Date());
    setPhaseEndDate(new Date());
    setPhaseStartTime(new Date());
    setPhaseEndTime(new Date());
    setPhaseComment('');
  };

  const handleSavePhase = () => {
    // Validate that the start date is not greater than the end date
    if (phaseStartDate > phaseEndDate) {
      Alert.alert('Invalid Date', 'The start date cannot be greater than the end date.');
      return; // Stop further execution if validation fails
    }

    const newPhase = {
      name: phaseName,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      startTime: phaseStartTime,
      endTime: phaseEndTime,
      comment: phaseComment,
      completed: false, // Add the completed field and set it to false
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

  const handleEditPhase = (index) => {
    const phase = phases[index];
    setPhaseName(phase.name);
    setPhaseStartDate(phase.startDate);
    setPhaseEndDate(phase.endDate);
    setPhaseStartTime(phase.startTime);
    setPhaseEndTime(phase.endTime);
    setPhaseComment(phase.comment);
    setEditingPhaseIndex(index);
    setIsAddPhaseModalVisible(true);
  };

  const handleRemovePhase = (index) => {
    const updatedPhases = phases.filter((_, i) => i !== index);
    setPhases(updatedPhases);
  };

  const { width, height } = Dimensions.get('window');

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { height: height * 0.35 }]}>
        <View style={styles.headerTitleView}>
          <Text style={styles.headerTitle}>Create New Task</Text>
        </View>
        <View style={styles.headerInputView}>
          <Text style={{ marginTop: 16, color: '#fff' }}>Title</Text>
          <TextInput
            style={styles.headerInput}
            placeholder="Provide task title"
            placeholderTextColor="rgb(192, 192, 192)"
            value={projectName}
            onChangeText={setProjectName}
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
                    onPress={() => handlePicker('startDate', true)}
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
                      onChange={(event, selectedDate) => {
                        handlePicker('startDate', false);
                        if (selectedDate) setStartDate(selectedDate);
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => handlePicker('startTime', true)}
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
                      onChange={(event, selectedTime) => {
                        handlePicker('startTime', false);
                        if (selectedTime) setStartTime(selectedTime);
                      }}
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
                    onPress={() => handlePicker('endDate', true)}
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
                      onChange={(event, selectedDate) => {
                        handlePicker('endDate', false);
                        if (selectedDate) setEndDate(selectedDate);
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => handlePicker('endTime', true)}
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
                      onChange={(event, selectedTime) => {
                        handlePicker('endTime', false);
                        if (selectedTime) setEndTime(selectedTime);
                      }}
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
                value={selectedCategory}
                onChange={(item) => setSelectedCategory(item.value)}
              />
            </View>

            {/* Phases Section */}
            <View style={styles.categoryBox}>
              <View style={styles.phasesHeader}>
                <Text style={styles.categoryLabel}>Phases</Text>
                <TouchableOpacity onPress={handleAddPhase}>
                  <Ionicons name="add-circle" size={24} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
              {phases.length === 0 ? (
                <Text style={{ color: 'gray', textAlign: 'center' }}>No phases added yet.</Text>
              ) : (
                phases.map((phase, index) => (
                  <View key={index} style={styles.phaseItem}>
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <View style={styles.phaseActions}>
                      <TouchableOpacity onPress={() => handleEditPhase(index)}>
                        <Ionicons name="pencil" size={20} color={Colors.light.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemovePhase(index)}>
                        <Ionicons name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fixed Button */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>

      {/* Add Phase Modal */}
      <Modal
        visible={isAddPhaseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header with Title and Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPhaseIndex !== null ? 'Edit Phase' : 'Add Phase'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
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
              onPress={() => handlePicker('phaseStartDate', true)}
            >
              <Text>Start Date: {phaseStartDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseStartDate && (
              <DateTimePicker
                value={phaseStartDate}
                mode="date"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  handlePicker('phaseStartDate', false);
                  if (selectedDate) setPhaseStartDate(selectedDate);
                }}
              />
            )}

            {/* Phase End Date */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => handlePicker('phaseEndDate', true)}
            >
              <Text>End Date: {phaseEndDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseEndDate && (
              <DateTimePicker
                value={phaseEndDate}
                mode="date"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  handlePicker('phaseEndDate', false);
                  if (selectedDate) setPhaseEndDate(selectedDate);
                }}
              />
            )}

            {/* Phase Start Time */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => handlePicker('phaseStartTime', true)}
            >
              <Text>Start Time: {phaseStartTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseStartTime && (
              <DateTimePicker
                value={phaseStartTime}
                mode="time"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  handlePicker('phaseStartTime', false);
                  if (selectedTime) setPhaseStartTime(selectedTime);
                }}
              />
            )}

            {/* Phase End Time */}
            <TouchableOpacity
              style={styles.modalInput}
              onPress={() => handlePicker('phaseEndTime', true)}
            >
              <Text>End Time: {phaseEndTime.toLocaleTimeString()}</Text>
            </TouchableOpacity>
            {showPicker.phaseEndTime && (
              <DateTimePicker
                value={phaseEndTime}
                mode="time"
                display={Platform.OS === 'android' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  handlePicker('phaseEndTime', false);
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
              <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal}>
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

export default AddProject;

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
  phaseActions: {
    flexDirection: 'row',
    gap: 10,
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