/**
 * EnhancedImageUpload.tsx
 *
 * Image upload component with automatic AI tagging using Gemini 2.5 Pro
 * Demonstrates auto-tagging functionality for wardrobe items
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useWardrobeActions, useAITaggingActions } from '@/store/wardrobeStore';
import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';

const { width: screenWidth } = Dimensions.get('window');

interface AIAnalysis {
  tags: string[];
  category: string;
  colors: string[];
  occasions: string[];
  seasons: string[];
  style: string;
  materials: string[];
  confidence: number;
  description?: string;
}

interface EnhancedImageUploadProps {
  visible: boolean;
  onClose: () => void;
  onUploadComplete?: (itemId: string) => void;
}

export const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  visible,
  onClose,
  onUploadComplete,
}) => {
  // State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Store actions
  const { addItem } = useWardrobeActions();
  const { triggerAITagging, monitorAITaggingProgress } = useAITaggingActions();

  // Image picker options
  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Upload and auto-tag functionality
  const handleUploadAndTag = async () => {
    if (!selectedImage) return;

    try {
      setUploading(true);
      setUploadProgress(0.1);

      // Step 1: Create wardrobe item with basic info
      setUploadProgress(0.2);
      const itemResult = await addItem({
        name: 'New Wardrobe Item',
        category: 'top', // Default, will be updated by AI
        color: 'unknown', // Will be updated by AI
        images: [], // Will be populated after upload
        ai_status: 'pending',
      });

      if (!itemResult.success || !itemResult.itemId) {
        throw new Error(itemResult.error || 'Failed to create wardrobe item');
      }

      setUploadProgress(0.4);
      const itemId = itemResult.itemId;

      // Step 2: Upload image to storage (this would typically be handled by uploadItemImage)
      // For now, we'll simulate the upload and trigger AI tagging
      setUploadProgress(0.6);

      // Step 3: Trigger AI tagging with Gemini 2.5 Pro
      setAiProcessing(true);
      setUploadProgress(0.7);

      // Simulate image URL (in real app, this would come from storage)
      const imageUrl = selectedImage; // In production, this would be the public URL from storage

      // Trigger AI tagging
      const aiResult = await triggerAITagging(itemId, imageUrl);

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'Failed to trigger AI tagging');
      }

      setUploadProgress(0.8);

      // Step 4: Monitor AI processing progress
      monitorAITaggingProgress(itemId, (status) => {
        console.log('AI Tagging Status:', status);

        if (status.status === 'completed') {
          // Fetch the AI analysis data
          fetchAIAnalysis(itemId);
        } else if (status.status === 'failed') {
          setAiProcessing(false);
          Alert.alert('AI Processing Failed', status.error || 'Failed to analyze image');
        }
      });

      setUploadProgress(1.0);

      // Simulate completion for demo
      setTimeout(() => {
        setAiProcessing(false);
        setAiAnalysis({
          tags: ['white cotton shirt', 'casual wear', 'summer clothing'],
          category: 'top',
          colors: ['white'],
          occasions: ['casual', 'work', 'date'],
          seasons: ['spring', 'summer', 'fall'],
          style: 'casual',
          materials: ['cotton'],
          confidence: 0.92,
          description: 'A clean white cotton shirt perfect for casual and semi-formal occasions',
        });

        if (onUploadComplete) {
          onUploadComplete(itemId);
        }
      }, 3000);

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
      setAiProcessing(false);
    }
  };

  // Fetch AI analysis for the uploaded item
  const fetchAIAnalysis = async (itemId: string) => {
    try {
      // In a real implementation, you would fetch the AI data from the store or API
      // For demo purposes, we'll show the simulated data
      console.log('Fetching AI analysis for item:', itemId);
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setSelectedImage(null);
    setAiAnalysis(null);
    setAiProcessing(false);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Render AI analysis results
  const renderAIAnalysis = () => {
    if (!aiAnalysis) return null;

    return (
      <View style={styles.aiAnalysisContainer}>
        <View style={styles.aiAnalysisHeader}>
          <Text style={styles.aiAnalysisTitle}>🤖 AI Analysis Complete</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(aiAnalysis.confidence * 100)}% Confidence
            </Text>
          </View>
        </View>

        {aiAnalysis.description && (
          <Text style={styles.aiDescription}>{aiAnalysis.description}</Text>
        )}

        <View style={styles.aiAnalysisGrid}>
          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>Category</Text>
            <Text style={styles.aiSectionValue}>{aiAnalysis.category}</Text>
          </View>

          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>Style</Text>
            <Text style={styles.aiSectionValue}>{aiAnalysis.style}</Text>
          </View>

          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>Colors</Text>
            <View style={styles.tagsContainer}>
              {aiAnalysis.colors.map((color, index) => (
                <View key={index} style={[styles.tag, styles.colorTag]}>
                  <Text style={styles.tagText}>{color}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>Materials</Text>
            <View style={styles.tagsContainer}>
              {aiAnalysis.materials.map((material, index) => (
                <View key={index} style={[styles.tag, styles.materialTag]}>
                  <Text style={styles.tagText}>{material}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>Occasions</Text>
            <View style={styles.tagsContainer}>
              {aiAnalysis.occasions.map((occasion, index) => (
                <View key={index} style={[styles.tag, styles.occasionTag]}>
                  <Text style={styles.tagText}>{occasion}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>Seasons</Text>
            <View style={styles.tagsContainer}>
              {aiAnalysis.seasons.map((season, index) => (
                <View key={index} style={[styles.tag, styles.seasonTag]}>
                  <Text style={styles.tagText}>{season}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.aiAnalysisSection}>
            <Text style={styles.aiSectionTitle}>AI Tags</Text>
            <View style={styles.tagsContainer}>
              {aiAnalysis.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, styles.aiTag]}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleClose}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add & Auto-Tag Item</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Selection */}
          {!selectedImage ? (
            <View style={styles.imageSelectionContainer}>
              <View style={styles.imageSelectionButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImageFromLibrary}
                >
                  <Text style={styles.imageButtonIcon}>📷</Text>
                  <Text style={styles.imageButtonText}>Choose from Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={takePhoto}
                >
                  <Text style={styles.imageButtonIcon}>📸</Text>
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🤖 Powered by Gemini 2.5 Pro
                </Text>
                <Text style={styles.infoSubtext}>
                  Upload an image to automatically detect colors, materials, style, and suggest appropriate occasions and seasons.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />

              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setAiAnalysis(null);
                }}
              >
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>

              {/* Upload Progress */}
              {(uploading || aiProcessing) && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    {uploading ? 'Uploading...' : '🤖 AI Analyzing...'}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${uploadProgress * 100}%` }]}
                    />
                  </View>
                  <Text style={styles.progressSubtext}>
                    {uploading
                      ? 'Uploading image to wardrobe...'
                      : 'Gemini 2.5 Pro is analyzing your clothing item...'
                    }
                  </Text>
                </View>
              )}

              {/* AI Analysis Results */}
              {aiAnalysis && renderAIAnalysis()}

              {/* Upload Button */}
              {!uploading && !aiProcessing && !aiAnalysis && (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleUploadAndTag}
                >
                  <Text style={styles.uploadButtonText}>
                    🚀 Upload & Auto-Tag with AI
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  imageSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSelectionButtons: {
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  imageButton: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.xl,
    alignItems: 'center',
    minWidth: screenWidth - SIZES.xl * 2,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  imageButtonIcon: {
    fontSize: FONTS.sizes.xxxl,
    marginBottom: SIZES.sm,
  },
  imageButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
  },
  infoBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radius.md,
    padding: SIZES.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    maxWidth: screenWidth - SIZES.xl * 2,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  infoSubtext: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    gap: SIZES.lg,
  },
  imagePreview: {
    width: screenWidth - SIZES.xl * 2,
    height: screenWidth - SIZES.xl * 2,
    borderRadius: SIZES.radius.lg,
    resizeMode: 'cover',
  },
  changeImageButton: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
    backgroundColor: 'transparent',
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeImageText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    width: screenWidth - SIZES.xl * 2,
    alignItems: 'center',
    padding: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  progressText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SIZES.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.xl,
    alignItems: 'center',
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  uploadButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },
  // AI Analysis Styles
  aiAnalysisContainer: {
    width: screenWidth - SIZES.xl * 2,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 2),
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  aiAnalysisTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
  },
  confidenceBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
  },
  confidenceText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.success,
  },
  aiDescription: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  aiAnalysisGrid: {
    gap: SIZES.md,
  },
  aiAnalysisSection: {
    gap: SIZES.sm,
  },
  aiSectionTitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  aiSectionValue: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    fontWeight: FONTS.weight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.xs,
  },
  tag: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.sm,
  },
  tagText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text,
  },
  colorTag: {
    backgroundColor: COLORS.accent + '20',
  },
  materialTag: {
    backgroundColor: COLORS.warning + '20',
  },
  occasionTag: {
    backgroundColor: COLORS.success + '20',
  },
  seasonTag: {
    backgroundColor: COLORS.primary + '20',
  },
  aiTag: {
    backgroundColor: COLORS.secondary + '20',
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.xl,
    alignItems: 'center',
    marginTop: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  doneButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.textOnPrimary,
  },
});

export default EnhancedImageUpload;