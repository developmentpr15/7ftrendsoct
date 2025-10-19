// AI Tagging Panel Component
// Displays AI-generated tags and allows users to edit/merge them

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAITaggingActions } from '../../store/wardrobeStore';
import { COLORS, SIZES, FONTS } from '../../utils/constants';

const { width: screenWidth } = Dimensions.get('window');

const AITaggingPanel = ({ itemId, visible, onClose, onTagsUpdated }) => {
  const [aiFields, setAiFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [slideAnim] = useState(new Animated.Value(screenWidth));
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    getWardrobeAIFields,
    mergeAITags,
    retryAITagging,
    monitorAITaggingProgress,
  } = useAITaggingActions();

  // Load AI fields when component becomes visible
  useEffect(() => {
    if (visible && itemId) {
      loadAIFields();
      animateIn();
    } else if (!visible) {
      animateOut();
    }
  }, [visible, itemId]);

  const animateIn = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.timing(slideAnim, {
      toValue: screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const loadAIFields = async () => {
    try {
      setLoading(true);
      const fields = await getWardrobeAIFields(itemId);
      setAiFields(fields);

      // Monitor progress if still processing
      if (fields?.ai_status === 'processing') {
        setIsProcessing(true);
        monitorAITaggingProgress(itemId, (status) => {
          if (status.status === 'completed' || status.status === 'failed') {
            setIsProcessing(false);
            loadAIFields(); // Reload to get updated data
          }
        });
      }
    } catch (error) {
      console.error('Error loading AI fields:', error);
      Alert.alert('Error', 'Failed to load AI tags');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAI = async () => {
    try {
      setIsProcessing(true);
      const result = await retryAITagging(itemId);

      if (result.success) {
        // Monitor progress
        monitorAITaggingProgress(itemId, (status) => {
          if (status.status === 'completed' || status.status === 'failed') {
            setIsProcessing(false);
            loadAIFields();
          }
        });
      } else {
        setIsProcessing(false);
        Alert.alert('Error', result.error || 'Failed to retry AI tagging');
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to retry AI tagging');
    }
  };

  const handleMergeTags = async () => {
    try {
      setLoading(true);
      const result = await mergeAITags(itemId, true);

      if (result.success) {
        Alert.alert('Success', 'AI tags have been merged with manual tags');
        onTagsUpdated?.();
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to merge tags');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to merge tags');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (category) => {
    if (!newTag.trim()) return;

    const updatedFields = { ...aiFields };
    const tagArray = updatedFields[`ai_${category}`] || [];

    if (!tagArray.includes(newTag.trim())) {
      updatedFields[`ai_${category}`] = [...tagArray, newTag.trim()];
      setAiFields(updatedFields);
      setNewTag('');
    }
  };

  const handleRemoveTag = (category, tagToRemove) => {
    const updatedFields = { ...aiFields };
    const tagArray = updatedFields[`ai_${category}`] || [];
    updatedFields[`ai_${category}`] = tagArray.filter(tag => tag !== tagToRemove);
    setAiFields(updatedFields);
  };

  const getIconName = (icon) => {
    const iconMap = {
      'Palette': 'color-palette',
      'Calendar': 'calendar-outline',
      'Sparkles': 'sparkles',
      'Tag': 'pricetag',
      'Brain': 'pulse'
    };
    return iconMap[icon] || 'help-circle';
  };

  const renderTagSection = (title, category, icon, color) => {
    const tags = aiFields?.[`ai_${category}`] || [];

    return (
      <View style={styles.tagSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name={typeof icon === 'string' ? icon : getIconName(icon)} size={16} color={color} />
          <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        </View>

        <View style={styles.tagContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.tagText, { color }]}>{tag}</Text>
              <TouchableOpacity
                style={styles.removeTagButton}
                onPress={() => handleRemoveTag(category, tag)}
              >
                <Ionicons name="close" size={12} color={color} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addTagContainer}>
            <TextInput
              style={[styles.tagInput, { borderColor: color }]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder={`Add ${title.slice(0, -1)}`}
              placeholderTextColor={COLORS.textSecondary}
              onSubmitEditing={() => handleAddTag(category)}
            />
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: color }]}
              onPress={() => handleAddTag(category)}
            >
              <Ionicons name="add" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderStatusIndicator = () => {
    if (!aiFields) return null;

    const statusConfig = {
      pending: { icon: 'alert-circle', color: COLORS.warning, text: 'AI Processing Pending' },
      processing: { icon: 'refresh', color: COLORS.info, text: 'AI Processing...' },
      completed: { icon: 'checkmark-circle', color: COLORS.success, text: 'AI Processing Complete' },
      failed: { icon: 'close-circle', color: COLORS.error, text: 'AI Processing Failed' },
    };

    const config = statusConfig[aiFields.ai_status] || statusConfig.pending;

    return (
      <View style={[styles.statusIndicator, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon} size={16} color={config.color} style={isProcessing && styles.spinning} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
        {aiFields.ai_confidence && (
          <Text style={styles.confidenceText}>
            Confidence: {Math.round(aiFields.ai_confidence * 100)}%
          </Text>
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="pulse" size={24} color={COLORS.primary} />
            <Text style={styles.headerTitle}>AI Tags</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading AI tags...</Text>
            </View>
          ) : aiFields ? (
            <>
              {/* Status Indicator */}
              {renderStatusIndicator()}

              {/* AI Error Message */}
              {aiFields.ai_error_message && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{aiFields.ai_error_message}</Text>
                </View>
              )}

              {/* AI Category */}
              {aiFields.ai_category && (
                <View style={styles.tagSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="pricetag" size={16} color={COLORS.accent} />
                    <Text style={[styles.sectionTitle, { color: COLORS.accent }]}>
                      AI Category
                    </Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: `${COLORS.accent}20` }]}>
                    <Text style={[styles.categoryText, { color: COLORS.accent }]}>
                      {aiFields.ai_category}
                    </Text>
                  </View>
                </View>
              )}

              {/* AI Style */}
              {aiFields.ai_style && (
                <View style={styles.tagSection}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
                    <Text style={[styles.sectionTitle, { color: COLORS.secondary }]}>
                      AI Style
                    </Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: `${COLORS.secondary}20` }]}>
                    <Text style={[styles.categoryText, { color: COLORS.secondary }]}>
                      {aiFields.ai_style}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tags by Category */}
              {renderTagSection('Colors', 'colors', 'color-palette', COLORS.accent)}
              {renderTagSection('Occasions', 'occasions', 'calendar-outline', COLORS.info)}
              {renderTagSection('Materials', 'materials', 'sparkles', COLORS.secondary)}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {aiFields.ai_status === 'failed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.retryButton]}
                    onPress={handleRetryAI}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name="refresh"
                      size={16}
                      color="#fff"
                      style={isProcessing && styles.spinning}
                    />
                    <Text style={styles.actionButtonText}>
                      {isProcessing ? 'Retrying...' : 'Retry AI'}
                    </Text>
                  </TouchableOpacity>
                )}

                {aiFields.ai_status === 'completed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.mergeButton]}
                    onPress={handleMergeTags}
                    disabled={loading}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {loading ? 'Merging...' : 'Merge to Manual Tags'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="pulse" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No AI tags available</Text>
              <Text style={styles.emptySubtext}>
                AI tags will appear here after processing
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: screenWidth * 0.9,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  panel: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SIZES.xs,
    borderRadius: SIZES.sm,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: SIZES.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  loadingText: {
    marginTop: SIZES.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.md,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  statusText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  confidenceText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: SIZES.md,
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    flex: 1,
  },
  tagSection: {
    marginBottom: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.md,
  },
  categoryText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.sm,
    gap: SIZES.xs,
  },
  tagText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
  },
  removeTagButton: {
    padding: 2,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    minWidth: 120,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: SIZES.sm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    backgroundColor: '#fff',
  },
  addTagButton: {
    padding: SIZES.xs,
    borderRadius: SIZES.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    gap: SIZES.sm,
    marginTop: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    borderRadius: SIZES.md,
    gap: SIZES.sm,
  },
  retryButton: {
    backgroundColor: COLORS.warning,
  },
  mergeButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.sm,
  },
  spinning: {
    // Animation would be handled by parent component
  },
});

export default AITaggingPanel;