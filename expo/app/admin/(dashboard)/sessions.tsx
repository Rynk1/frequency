import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
  Calendar,
  Clock,
  Radio,
} from 'lucide-react-native';
import { useBackendData } from '@/hooks/useBackendData';

interface SessionForm {
  name: string;
  description: string;
  frequencies: string[];
  duration: number;
  category: string;
  isPremium: boolean;
}

export default function SessionsManagement() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [formData, setFormData] = useState<SessionForm>({
    name: '',
    description: '',
    frequencies: [],
    duration: 20,
    category: 'general',
    isPremium: false,
  });
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    curatedPrograms: allPrograms,
    frequencies,
    addCuratedProgram,
    updateCuratedProgram,
    deleteCuratedProgram,
  } = useBackendData();

  const programs = allPrograms.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (session: any) => {
    setEditingSession(session);
    setFormData({
      name: session.name,
      description: session.description,
      frequencies: session.frequencies,
      duration: session.duration,
      category: session.category,
      isPremium: session.isPremium,
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingSession(null);
    setFormData({
      name: '',
      description: '',
      frequencies: [],
      duration: 20,
      category: 'general',
      isPremium: false,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    if (editingSession) {
      updateCuratedProgram(editingSession.id, formData)
        .then(() => {
          setModalVisible(false);
          Alert.alert('Success', 'Session updated successfully');
        })
        .catch((error) => {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update session');
        })
        .finally(() => setIsSaving(false));
    } else {
      addCuratedProgram(formData)
        .then(() => {
          setModalVisible(false);
          Alert.alert('Success', 'Session created successfully');
        })
        .catch((error) => {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create session');
        })
        .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCuratedProgram(id)
              .then(() => {
                Alert.alert('Success', 'Session deleted successfully');
              })
              .catch((error) => {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete session');
              });
          },
        },
      ]
    );
  };

  const toggleFrequency = (frequencyId: string) => {
    setFormData(prev => ({
      ...prev,
      frequencies: prev.frequencies.includes(frequencyId)
        ? prev.frequencies.filter(f => f !== frequencyId)
        : [...prev.frequencies, frequencyId]
    }));
  };

  const getFrequencyName = (id: string) => {
    const freq = frequencies.find(f => f.id === id);
    return freq ? freq.name : id;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#9CA3AF" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sessions..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <LinearGradient
            colors={['#EC4899', '#DB2777']}
            style={styles.addGradient}
          >
            <Plus color="white" size={20} />
            <Text style={styles.addText}>Add Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {programs.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <View style={styles.sessionMeta}>
                    <Clock color="#9CA3AF" size={14} />
                    <Text style={styles.sessionDuration}>{session.duration} min</Text>
                    <Calendar color="#9CA3AF" size={14} style={styles.metaIcon} />
                    <Text style={styles.sessionDate}>
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {session.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.description} numberOfLines={2}>
                {session.description}
              </Text>
              
              <View style={styles.frequenciesList}>
                {session.frequencies.slice(0, 3).map((freqId: string) => (
                  <View key={freqId} style={styles.frequencyChip}>
                    <Radio color="#8B5CF6" size={12} />
                    <Text style={styles.frequencyChipText}>
                      {getFrequencyName(freqId)}
                    </Text>
                  </View>
                ))}
                {session.frequencies.length > 3 && (
                  <Text style={styles.moreFrequencies}>
                    +{session.frequencies.length - 3} more
                  </Text>
                )}
              </View>
              
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(session)}
                >
                  <Edit2 color="#8B5CF6" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(session.id)}
                >
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSession ? 'Edit Session' : 'Add New Session'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Morning Energy Boost"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter description..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duration.toString()}
                  onChangeText={(text) => setFormData({ ...formData, duration: parseInt(text) || 0 })}
                  placeholder="20"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryOptions}>
                  {['general', 'healing', 'meditation', 'sleep', 'focus', 'manifestation'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        formData.category === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, category: cat })}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          formData.category === cat && styles.categoryOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Premium Content</Text>
                  <Switch
                    value={formData.isPremium}
                    onValueChange={(value) => setFormData({ ...formData, isPremium: value })}
                    trackColor={{ false: '#374151', true: '#EC4899' }}
                    thumbColor={formData.isPremium ? '#fff' : '#9CA3AF'}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Selected Frequencies ({formData.frequencies.length})</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setFrequencyModalVisible(true)}
                >
                  <Text style={styles.selectButtonText}>Select Frequencies</Text>
                </TouchableOpacity>
                <View style={styles.selectedFrequencies}>
                  {formData.frequencies.map((freqId) => (
                    <View key={freqId} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>
                        {getFrequencyName(freqId)}
                      </Text>
                      <TouchableOpacity onPress={() => toggleFrequency(freqId)}>
                        <X color="white" size={14} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  style={styles.saveGradient}
                >
                  <Save color="white" size={18} />
                  <Text style={styles.saveText}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={frequencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFrequencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Frequencies</Text>
              <TouchableOpacity onPress={() => setFrequencyModalVisible(false)}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={frequencies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.frequencyItem,
                    formData.frequencies.includes(item.id) && styles.frequencyItemSelected
                  ]}
                  onPress={() => toggleFrequency(item.id)}
                >
                  <View>
                    <Text style={styles.frequencyItemName}>{item.name}</Text>
                    <Text style={styles.frequencyItemHz}>{item.frequency}</Text>
                  </View>
                  {formData.frequencies.includes(item.id) && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  addText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sessionDuration: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 12,
  },
  metaIcon: {
    marginLeft: 0,
  },
  sessionDate: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  frequenciesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  frequencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  frequencyChipText: {
    color: '#D1D5DB',
    fontSize: 12,
    marginLeft: 4,
  },
  moreFrequencies: {
    color: '#8B5CF6',
    fontSize: 12,
    alignSelf: 'center',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionActive: {
    backgroundColor: '#EC4899',
  },
  categoryOptionText: {
    color: '#9CA3AF',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  categoryOptionTextActive: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedFrequencies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChipText: {
    color: 'white',
    fontSize: 14,
    marginRight: 8,
  },
  frequencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  frequencyItemSelected: {
    backgroundColor: '#374151',
  },
  frequencyItemName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  frequencyItemHz: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});