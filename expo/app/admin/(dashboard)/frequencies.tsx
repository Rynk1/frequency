import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
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
} from 'lucide-react-native';
import { useBackendData } from '@/hooks/useBackendData';
import { FrequencyCategory, ContentStatus, CanonicalFrequency } from '@/types/content';

interface FrequencyForm {
  id: string;
  name: string;
  hz: number;
  frequency: string;
  description: string;
  category: FrequencyCategory;
  benefits: string[];
  color: string;
  gradient: [string, string];
  isPremium: boolean;
  status: ContentStatus;
  intentTags: string[];
  timeOfDayTags: string[];
  tags: string[];
  scientificBasis?: string;
  usageGuidelines?: string;
  background?: string;
  purpose?: string;
  usageInstructions?: {
    duration?: string;
    frequency?: string;
    bestTime?: string;
    environment?: string;
    preparation?: string;
  };
  disclaimer?: string;
}

export default function FrequenciesManagement() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState<CanonicalFrequency | null>(null);
  const [formData, setFormData] = useState<FrequencyForm>({
    id: '',
    name: '',
    hz: 0,
    frequency: '',
    category: FrequencyCategory.SOLFEGGIO,
    description: '',
    benefits: [],
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#6C63FF'],
    isPremium: false,
    status: ContentStatus.PUBLISHED,
    intentTags: ['healing'],
    timeOfDayTags: ['morning'],
    tags: [],
    scientificBasis: '',
    usageGuidelines: '',
    background: '',
    purpose: '',
    usageInstructions: {
      duration: '',
      frequency: '',
      bestTime: '',
      environment: '',
      preparation: '',
    },
    disclaimer: '',
  });
  const [newBenefit, setNewBenefit] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newIntentTag, setNewIntentTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { frequencies: allFrequencies, addFrequency, updateFrequency, deleteFrequency } = useBackendData();

  const frequencies = allFrequencies.filter((frequency) =>
    frequency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    frequency.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    frequency.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    frequency.hz.toString().includes(searchQuery.trim())
  );

  const handleEdit = (frequency: CanonicalFrequency) => {
    setEditingFrequency(frequency);
    setFormData({
      id: frequency.id,
      name: frequency.name,
      hz: frequency.hz,
      frequency: frequency.frequency,
      category: frequency.category,
      description: frequency.description,
      benefits: frequency.benefits || [],
      color: frequency.color || '#8B5CF6',
      gradient: frequency.gradient || ['#8B5CF6', '#6C63FF'],
      isPremium: frequency.isPremium || false,
      status: frequency.status || ContentStatus.PUBLISHED,
      intentTags: frequency.intentTags || [],
      timeOfDayTags: frequency.timeOfDayTags || ['morning'],
      tags: frequency.tags || [],
      scientificBasis: frequency.scientificBasis || '',
      usageGuidelines: frequency.usageInstructions?.duration || '',
      background: frequency.background || '',
      purpose: frequency.purpose || '',
      usageInstructions: frequency.usageInstructions || {
        duration: '',
        frequency: '',
        bestTime: '',
        environment: '',
        preparation: '',
      },
      disclaimer: frequency.disclaimer || '',
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingFrequency(null);
    setFormData({
      id: '',
      name: '',
      hz: 0,
      frequency: '',
      category: FrequencyCategory.SOLFEGGIO,
      description: '',
      benefits: [],
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#6C63FF'],
      isPremium: false,
      status: ContentStatus.PUBLISHED,
      intentTags: ['healing'],
      timeOfDayTags: ['morning'],
      tags: [],
      scientificBasis: '',
      usageGuidelines: '',
      background: '',
      purpose: '',
      usageInstructions: {
        duration: '',
        frequency: '',
        bestTime: '',
        environment: '',
        preparation: '',
      },
      disclaimer: '',
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const frequencyData = {
      name: formData.name.trim(),
      hz: formData.hz,
      frequency: formData.frequency.trim() || `${formData.hz} Hz`,
      description: formData.description.trim(),
      category: formData.category,
      benefits: formData.benefits,
      color: formData.color,
      gradient: formData.gradient,
      isPremium: formData.isPremium,
      status: formData.status,
      intentTags: formData.intentTags,
      timeOfDayTags: formData.timeOfDayTags,
      tags: formData.tags,
      scientificBasis: formData.scientificBasis,
      usageGuidelines: formData.usageGuidelines,
      background: formData.background,
      purpose: formData.purpose,
      usageInstructions: formData.usageInstructions,
      disclaimer: formData.disclaimer,
    };

    setIsSaving(true);
    if (editingFrequency) {
      updateFrequency(editingFrequency.id, frequencyData)
        .then(() => {
          setModalVisible(false);
          Alert.alert('Success', 'Frequency updated successfully');
        })
        .catch((error) => {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update frequency');
        })
        .finally(() => setIsSaving(false));
    } else {
      addFrequency(frequencyData)
        .then(() => {
          setModalVisible(false);
          Alert.alert('Success', 'Frequency created successfully');
        })
        .catch((error) => {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create frequency');
        })
        .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this frequency?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFrequency(id)
              .then(() => {
                Alert.alert('Success', 'Frequency deleted successfully');
              })
              .catch((error) => {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete frequency');
              });
          },
        },
      ]
    );
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const addIntentTag = () => {
    if (newIntentTag.trim()) {
      setFormData({
        ...formData,
        intentTags: [...formData.intentTags, newIntentTag.trim()],
      });
      setNewIntentTag('');
    }
  };

  const removeIntentTag = (index: number) => {
    setFormData({
      ...formData,
      intentTags: formData.intentTags.filter((_, i) => i !== index),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#9CA3AF" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search frequencies..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.addGradient}
          >
            <Plus color="white" size={20} />
            <Text style={styles.addText}>Add Frequency</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {frequencies.map((freq) => (
          <View key={freq.id} style={styles.frequencyCard}>
            <View style={[styles.colorIndicator, { backgroundColor: freq.color || '#8B5CF6' }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.frequencyName}>{freq.name}</Text>
                  <Text style={styles.frequencyValue}>{freq.frequency}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{freq.category}</Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {freq.description}
              </Text>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(freq)}
                >
                  <Edit2 color="#8B5CF6" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(freq.id)}
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
                {editingFrequency ? 'Edit Frequency' : 'Add New Frequency'}
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
                  placeholder="e.g., Love Frequency"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Frequency (Hz) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.hz.toString()}
                  onChangeText={(text) => {
                    const hz = parseFloat(text) || 0;
                    setFormData({
                      ...formData,
                      hz,
                      frequency: `${hz} Hz`
                    });
                  }}
                  placeholder="e.g., 528"
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryOptions}>
                  {Object.values(FrequencyCategory).map((cat) => (
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
                <Text style={styles.label}>Status</Text>
                <View style={styles.categoryOptions}>
                  {Object.values(ContentStatus).map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.categoryOption,
                        formData.status === st && styles.categoryOptionActive,
                      ]}
                      onPress={() => setFormData({ ...formData, status: st })}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          formData.status === st && styles.categoryOptionTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                <Text style={styles.label}>Intent Tags (Recommendation Engine)</Text>
                <View style={styles.listInput}>
                  <TextInput
                    style={styles.listInputField}
                    value={newIntentTag}
                    onChangeText={setNewIntentTag}
                    placeholder="Add intent tag e.g., focus, sleep, healing..."
                    placeholderTextColor="#6B7280"
                    onSubmitEditing={addIntentTag}
                  />
                  <TouchableOpacity onPress={addIntentTag} style={styles.listAddButton}>
                    <Plus color="white" size={16} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {formData.intentTags.map((tag, index) => (
                    <View key={`intent-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeIntentTag(index)}>
                        <X color="white" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Benefits</Text>
                <View style={styles.listInput}>
                  <TextInput
                    style={styles.listInputField}
                    value={newBenefit}
                    onChangeText={setNewBenefit}
                    placeholder="Add a benefit..."
                    placeholderTextColor="#6B7280"
                    onSubmitEditing={addBenefit}
                  />
                  <TouchableOpacity onPress={addBenefit} style={styles.listAddButton}>
                    <Plus color="white" size={16} />
                  </TouchableOpacity>
                </View>
                {formData.benefits.map((benefit, index) => (
                  <View key={`benefit-${index}`} style={styles.listItem}>
                    <Text style={styles.listItemText}>{benefit}</Text>
                    <TouchableOpacity onPress={() => removeBenefit(index)}>
                      <X color="#EF4444" size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tags</Text>
                <View style={styles.listInput}>
                  <TextInput
                    style={styles.listInputField}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag..."
                    placeholderTextColor="#6B7280"
                    onSubmitEditing={addTag}
                  />
                  <TouchableOpacity onPress={addTag} style={styles.listAddButton}>
                    <Plus color="white" size={16} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {formData.tags.map((tag, index) => (
                    <View key={`tag-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(index)}>
                        <X color="white" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Premium Content</Text>
                  <Switch
                    value={formData.isPremium}
                    onValueChange={(value) => setFormData({ ...formData, isPremium: value })}
                    trackColor={{ false: '#374151', true: '#8B5CF6' }}
                    thumbColor={formData.isPremium ? '#fff' : '#9CA3AF'}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Scientific Basis</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.scientificBasis}
                  onChangeText={(text) => setFormData({ ...formData, scientificBasis: text })}
                  placeholder="Enter scientific research and basis..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Background & History</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.background}
                  onChangeText={(text) => setFormData({ ...formData, background: text })}
                  placeholder="Enter historical background and context..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Purpose & Mechanism</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.purpose}
                  onChangeText={(text) => setFormData({ ...formData, purpose: text })}
                  placeholder="Explain how this frequency works and its purpose..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Usage Instructions</Text>

                <Text style={[styles.label, { fontSize: 12, marginTop: 8, marginBottom: 4 }]}>Duration</Text>
                <TextInput
                  style={styles.input}
                  value={formData.usageInstructions?.duration || ''}
                  onChangeText={(text) => setFormData({
                    ...formData,
                    usageInstructions: { ...formData.usageInstructions, duration: text }
                  })}
                  placeholder="e.g., 20-30 minutes per session"
                  placeholderTextColor="#6B7280"
                />

                <Text style={[styles.label, { fontSize: 12, marginTop: 8, marginBottom: 4 }]}>Frequency of Use</Text>
                <TextInput
                  style={styles.input}
                  value={formData.usageInstructions?.frequency || ''}
                  onChangeText={(text) => setFormData({
                    ...formData,
                    usageInstructions: { ...formData.usageInstructions, frequency: text }
                  })}
                  placeholder="e.g., Daily for healing, 3-4 times weekly for maintenance"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Disclaimer</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.disclaimer}
                  onChangeText={(text) => setFormData({ ...formData, disclaimer: text })}
                  placeholder="Enter important safety information and disclaimers..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Primary Color Token</Text>
                <TextInput
                  style={styles.input}
                  value={formData.color}
                  onChangeText={(text) => setFormData({ ...formData, color: text, gradient: [text, formData.gradient?.[1] || '#6C63FF'] })}
                  placeholder="e.g., #8B5CF6"
                  placeholderTextColor="#6B7280"
                />
                <View style={[styles.colorPreview, { backgroundColor: formData.color }]} />
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
                  colors={['#8B5CF6', '#7C3AED']}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, height: 44, marginLeft: 8, color: 'white', fontSize: 16 },
  addButton: { borderRadius: 12, overflow: 'hidden' },
  addGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  addText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  list: { flex: 1, padding: 16 },
  frequencyCard: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  colorIndicator: { width: 4 },
  cardContent: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  frequencyName: { color: 'white', fontSize: 18, fontWeight: '600' },
  frequencyValue: { color: '#8B5CF6', fontSize: 14, marginTop: 2 },
  categoryBadge: { backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryText: { color: '#D1D5DB', fontSize: 12, textTransform: 'capitalize' },
  description: { color: '#9CA3AF', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionButton: { padding: 8, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxWidth: 500, maxHeight: '80%', backgroundColor: '#1F2937', borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#374151' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '600' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  label: { color: '#D1D5DB', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: 'white', fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#374151', marginRight: 8, marginBottom: 8 },
  categoryOptionActive: { backgroundColor: '#8B5CF6' },
  categoryOptionText: { color: '#9CA3AF', fontSize: 14, textTransform: 'capitalize' },
  categoryOptionTextActive: { color: 'white' },
  listInput: { flexDirection: 'row', marginBottom: 8 },
  listInputField: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: 'white', fontSize: 14 },
  listAddButton: { backgroundColor: '#8B5CF6', borderRadius: 8, padding: 10, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', borderRadius: 8, padding: 12, marginBottom: 4 },
  listItemText: { color: '#D1D5DB', fontSize: 14 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginRight: 8, marginBottom: 8 },
  tagText: { color: 'white', fontSize: 12, marginRight: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  colorPreview: { height: 40, borderRadius: 8, marginTop: 8 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#374151' },
  cancelButton: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },
  saveButton: { borderRadius: 12, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  saveText: { color: 'white', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
