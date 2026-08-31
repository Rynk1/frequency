import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
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
  Tag,
} from 'lucide-react-native';
import { useBackendData } from '@/hooks/useBackendData';

interface ArticleForm {
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  author: string;
  readTime: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  keyPoints: string[];
  practicalTips: string[];
  scientificBasis: string;
  historicalContext: string;
}

export default function LearningManagement() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [formData, setFormData] = useState<ArticleForm>({
    title: '',
    content: '',
    category: 'basics',
    tags: [],
    isPremium: false,
    author: 'Admin',
    scientificBasis: '',
    historicalContext: '',
    difficulty: 'Beginner',
    readTime: 5,
    keyPoints: [],
    practicalTips: [],
  });
  const [newTag, setNewTag] = useState('');
  const [newKeyPoint, setNewKeyPoint] = useState('');
  const [newPracticalTip, setNewPracticalTip] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { articles: allArticles, addArticle, updateArticle, deleteArticle } = useBackendData();

  const articles = allArticles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags,
      isPremium: article.isPremium,
      author: article.author,
      scientificBasis: article.scientificBasis || '',
      historicalContext: article.historicalContext || '',
      difficulty: article.difficulty || 'Beginner',
      readTime: article.readTime || 5,
      keyPoints: article.keyPoints || [],
      practicalTips: article.practicalTips || [],
    });
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      content: '',
      category: 'basics',
      tags: [],
      isPremium: false,
      author: 'Admin',
      scientificBasis: '',
      historicalContext: '',
      difficulty: 'Beginner',
      readTime: 5,
      keyPoints: [],
      practicalTips: [],
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    if (editingArticle) {
      updateArticle(editingArticle.id, formData)
        .then(() => {
          setModalVisible(false);
          Alert.alert('Success', 'Article updated successfully');
        })
        .catch((error) => {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update article');
        })
        .finally(() => setIsSaving(false));
    } else {
      addArticle(formData)
        .then(() => {
          setModalVisible(false);
          Alert.alert('Success', 'Article created successfully');
        })
        .catch((error) => {
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create article');
        })
        .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this article?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteArticle(id)
              .then(() => {
                Alert.alert('Success', 'Article deleted successfully');
              })
              .catch((error) => {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete article');
              });
          },
        },
      ]
    );
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

  const addKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setFormData({
        ...formData,
        // @ts-ignore
        keyPoints: [...(formData.keyPoints || []), newKeyPoint.trim()],
      });
      setNewKeyPoint('');
    }
  };

  const removeKeyPoint = (index: number) => {
    setFormData({
      ...formData,
      // @ts-ignore
      keyPoints: (formData.keyPoints || []).filter((_, i) => i !== index),
    });
  };

  const addPracticalTip = () => {
    if (newPracticalTip.trim()) {
      setFormData({
        ...formData,
        // @ts-ignore
        practicalTips: [...(formData.practicalTips || []), newPracticalTip.trim()],
      });
      setNewPracticalTip('');
    }
  };

  const removePracticalTip = (index: number) => {
    setFormData({
      ...formData,
      // @ts-ignore
      practicalTips: (formData.practicalTips || []).filter((_, i) => i !== index),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search color="#9CA3AF" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.addGradient}
          >
            <Plus color="white" size={20} />
            <Text style={styles.addText}>Add Article</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {articles.map((article) => (
          <View key={article.id} style={styles.articleCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.articleInfo}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleAuthor}>By {article.author}</Text>
                    <Text style={styles.articleDate}>
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {article.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.content} numberOfLines={3}>
                {article.content}
              </Text>
              
              <View style={styles.tagsList}>
                {article.tags.map((tag: string, index: number) => (
                  <View key={`${article.id}-tag-${index}`} style={styles.tagChip}>
                    <Tag color="#8B5CF6" size={12} />
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(article)}
                >
                  <Edit2 color="#8B5CF6" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(article.id)}
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
                {editingArticle ? 'Edit Article' : 'Add New Article'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter article title..."
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Content *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
                  placeholder="Enter article content..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={10}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryOptions}>
                  {['basics', 'science', 'healing', 'meditation', 'advanced'].map((cat) => (
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
                    <View key={`form-tag-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(index)}>
                        <X color="white" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Author</Text>
                <TextInput
                  style={styles.input}
                  value={formData.author}
                  onChangeText={(text) => setFormData({ ...formData, author: text })}
                  placeholder="Author name..."
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Read Time (min)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.readTime?.toString()}
                    onChangeText={(text) => setFormData({ ...formData, readTime: parseInt(text) || 0 })}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Difficulty</Text>
                  <View style={styles.difficultyContainer}>
                    {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                      <TouchableOpacity
                        key={diff}
                        style={[
                          styles.difficultyOption,
                          // @ts-ignore
                          formData.difficulty === diff && styles.difficultyOptionActive
                        ]}
                        // @ts-ignore
                        onPress={() => setFormData({ ...formData, difficulty: diff })}
                      >
                        <Text style={[
                          styles.difficultyText,
                          // @ts-ignore
                          formData.difficulty === diff && styles.difficultyTextActive
                        ]}>{diff}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Scientific Basis</Text>
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  // @ts-ignore
                  value={formData.scientificBasis}
                  // @ts-ignore
                  onChangeText={(text) => setFormData({ ...formData, scientificBasis: text })}
                  placeholder="Scientific research backing this..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Historical Context</Text>
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  // @ts-ignore
                  value={formData.historicalContext}
                  // @ts-ignore
                  onChangeText={(text) => setFormData({ ...formData, historicalContext: text })}
                  placeholder="Historical background..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Key Points</Text>
                <View style={styles.listInput}>
                  <TextInput
                    style={styles.listInputField}
                    value={newKeyPoint}
                    onChangeText={setNewKeyPoint}
                    placeholder="Add a key point..."
                    placeholderTextColor="#6B7280"
                    onSubmitEditing={addKeyPoint}
                  />
                  <TouchableOpacity onPress={addKeyPoint} style={styles.listAddButton}>
                    <Plus color="white" size={16} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {/* @ts-ignore */}
                  {formData.keyPoints?.map((point, index) => (
                    <View key={`kp-${index}`} style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>{point}</Text>
                      <TouchableOpacity onPress={() => removeKeyPoint(index)}>
                        <X color="white" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Practical Tips</Text>
                <View style={styles.listInput}>
                  <TextInput
                    style={styles.listInputField}
                    value={newPracticalTip}
                    onChangeText={setNewPracticalTip}
                    placeholder="Add a practical tip..."
                    placeholderTextColor="#6B7280"
                    onSubmitEditing={addPracticalTip}
                  />
                  <TouchableOpacity onPress={addPracticalTip} style={styles.listAddButton}>
                    <Plus color="white" size={16} />
                  </TouchableOpacity>
                </View>
                <View style={styles.tagsContainer}>
                  {/* @ts-ignore */}
                  {formData.practicalTips?.map((tip, index) => (
                    <View key={`tip-${index}`} style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>{tip}</Text>
                      <TouchableOpacity onPress={() => removePracticalTip(index)}>
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
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor={formData.isPremium ? '#fff' : '#9CA3AF'}
                  />
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
                  colors={['#3B82F6', '#2563EB']}
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
  articleCard: {
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
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleAuthor: {
    color: '#9CA3AF',
    fontSize: 12,
    marginRight: 12,
  },
  articleDate: {
    color: '#9CA3AF',
    fontSize: 12,
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
  content: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagChipText: {
    color: '#D1D5DB',
    fontSize: 12,
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
    minHeight: 200,
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
    backgroundColor: '#3B82F6',
  },
  categoryOptionText: {
    color: '#9CA3AF',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  categoryOptionTextActive: {
    color: 'white',
  },
  listInput: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listInputField: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: 'white',
    fontSize: 14,
  },
  listAddButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    marginRight: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textAreaSmall: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  difficultyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  difficultyOption: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#374151',
    marginBottom: 4,
  },
  difficultyOptionActive: {
    backgroundColor: '#3B82F6',
  },
  difficultyText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  difficultyTextActive: {
    color: 'white',
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