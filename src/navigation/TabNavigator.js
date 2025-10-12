import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Image, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Camera from 'expo-camera';
import { COLORS, SIZES, FONTS, SHADOWS, CATEGORIES, APP_INFO } from '../utils/constants';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { signOut } from '../utils/auth';
import ConnectionStatus from '../components/ConnectionStatus';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WardrobeStack = createNativeStackNavigator();
const CompetitionStack = createNativeStackNavigator();
const ARStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Enhanced Home Screen with Actionable Feed
const HomeScreen = () => {
  const { posts, toggleLike, addComment } = useAppStore();
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handleLike = (postId) => {
    toggleLike(postId);
  };

  const handleComment = (postId) => {
    setSelectedPost(postId);
    setCommentModalVisible(true);
  };

  const submitComment = () => {
    if (commentText.trim() && selectedPost) {
      addComment(selectedPost, commentText);
      setCommentText('');
      setCommentModalVisible(false);
      setSelectedPost(null);
    }
  };

  const handleCreatePost = () => {
    setCreatePostVisible(true);
  };

  const submitPost = () => {
    if (newPostText.trim()) {
      // This would normally save to backend
      Alert.alert('Success', 'Post created successfully!');
      setNewPostText('');
      setSelectedImage(null);
      setCreatePostVisible(false);
    }
  };

  const handlePostOptions = (postId) => {
    Alert.alert(
      'Post Options',
      'What would you like to do with this post?',
      [
        { text: 'Share', onPress: () => Alert.alert('Share', 'Share functionality coming soon!') },
        { text: 'Report', onPress: () => Alert.alert('Report', 'Report functionality coming soon!') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderPost = (post) => (
    <View key={post.id} style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <Text style={styles.postAvatar}>{post.avatar}</Text>
          <View>
            <Text style={styles.postUsername}>{post.username}</Text>
            <Text style={styles.postTimestamp}>{post.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handlePostOptions(post.id)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <Image source={{ uri: post.image }} style={styles.postImage} />

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
          <Ionicons
            name={post.isLiked ? "heart" : "heart-outline"}
            size={24}
            color={post.isLiked ? COLORS.like : COLORS.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(post.id)}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
          <Ionicons name="bookmark-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Post Stats */}
      <View style={styles.postStats}>
        <Text style={styles.likesCount}>{post.likes} likes</Text>
        <Text style={styles.commentsCount}>{post.comments} comments</Text>
      </View>

      {/* Post Description */}
      <View style={styles.postDescription}>
        <Text style={styles.postUsernameText}>{post.username}</Text>
        <Text style={styles.postCaption}>{post.outfit}</Text>
        <View style={styles.postTags}>
          {post.items.map((item, index) => (
            <Text key={index} style={styles.postTag}>#{item.replace(/\s+/g, '')}</Text>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7F</Text>
            <Text style={styles.logoSubtext}>trends</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Fashion Feed</Text>
            <Text style={styles.subtitle}>Discover & Get Inspired</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trending Section */}
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['#Minimalist', '#StreetStyle', '#Vintage', '#BusinessCasual', '#SummerVibes'].map((tag, index) => (
              <TouchableOpacity key={index} style={styles.trendingTag}>
                <Text style={styles.trendingTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Posts Feed */}
        <View style={styles.feedContainer}>
          {posts.map(renderPost)}
        </View>
      </ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModal}>
            <View style={styles.commentHeader}>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.commentTitle}>Add Comment</Text>
              <TouchableOpacity onPress={submitComment}>
                <Text style={styles.commentPostButton}>Post</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              autoFocus
            />
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={handleCreatePost}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal
        visible={createPostVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreatePostVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createPostModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreatePostVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={submitPost}>
                <Text style={styles.postButton}>Post</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.createPostContent}>
              <TextInput
                style={styles.postTextInput}
                placeholder="Share your fashion thoughts..."
                placeholderTextColor="#999999"
                value={newPostText}
                onChangeText={setNewPostText}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.addImageButton}>
                <Ionicons name="image-outline" size={24} color="#666666" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Enhanced Wardrobe Screen with Actions
const WardrobeScreen = () => {
  const {
    wardrobeItems,
    addWardrobeItem,
    removeWardrobeItem,
    updateWardrobeItem,
    getWardrobeStats,
    getFavoriteItems,
    getOutfitSuggestions,
    pickImage,
    setSelectedCategory
  } = useAppStore();
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [outfitSuggestionsVisible, setOutfitSuggestionsVisible] = useState(false);
  const [selectedCategory, setSelectedCategoryLocal] = useState(null);

  const stats = getWardrobeStats();
  const favoriteItems = getFavoriteItems();
  const outfitSuggestions = getOutfitSuggestions();

  const handleAddItem = async () => {
    const result = await pickImage();
    if (result && !result.canceled) {
      setAddItemModalVisible(true);
      setSelectedCategoryLocal(null);
    }
  };

  const handleSubmitItem = (name, category, color, brand) => {
    addWardrobeItem({
      name,
      category,
      color,
      brand,
      image: 'https://picsum.photos/seed/' + Date.now() + '/200/200',
      isFavorite: false,
      dateAdded: new Date().toISOString(),
    });
    setAddItemModalVisible(false);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category.id);
    setSelectedCategoryLocal(category.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7F</Text>
            <Text style={styles.logoSubtext}>trends</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>My Wardrobe</Text>
            <Text style={styles.subtitle}>Manage Your Style</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Ionicons name="add" size={24} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Object.keys(stats.byCategory).length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteItems.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => setOutfitSuggestionsVisible(true)}
          >
            <Ionicons name="shirt-outline" size={24} color={COLORS.accent} />
            <Text style={styles.quickActionText}>Get Outfit Ideas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleAddItem}>
            <Ionicons name="camera-outline" size={24} color={COLORS.accent} />
            <Text style={styles.quickActionText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryItem, selectedCategory === category.id && styles.categoryItemSelected]}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>
                  {stats.byCategory[category.id] || 0} items
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Items */}
        {wardrobeItems.length > 0 && (
          <View style={styles.recentItemsContainer}>
            <Text style={styles.sectionTitle}>Recent Items</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {wardrobeItems.slice(-5).map((item) => (
                <View key={item.id} style={styles.recentItem}>
                  <Image source={{ uri: item.image }} style={styles.recentItemImage} />
                  <Text style={styles.recentItemName} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => updateWardrobeItem(item.id, { isFavorite: !item.isFavorite })}
                  >
                    <Ionicons
                      name={item.isFavorite ? "heart" : "heart-outline"}
                      size={16}
                      color={item.isFavorite ? COLORS.like : COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={addItemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addItemModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddItemModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <View style={{ width: 24 }} />
            </View>

            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => console.log('Add photo')}
            >
              <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Item name"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Brand"
                placeholderTextColor={COLORS.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Color"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => handleSubmitItem('New Item', 'top', 'Blue', 'Brand')}
            >
              <Text style={styles.submitButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Outfit Suggestions Modal */}
      <Modal
        visible={outfitSuggestionsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOutfitSuggestionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.outfitModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setOutfitSuggestionsVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Outfit Suggestions</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.outfitSuggestionsList}>
              {outfitSuggestions.map((outfit) => (
                <View key={outfit.id} style={styles.outfitSuggestion}>
                  <Text style={styles.outfitName}>{outfit.name}</Text>
                  <Text style={styles.outfitOccasion}>{outfit.occasion}</Text>
                  <View style={styles.outfitItems}>
                    {outfit.items.map((item, index) => (
                      <View key={index} style={styles.outfitItem}>
                        <Image source={{ uri: item.image }} style={styles.outfitItemImage} />
                        <Text style={styles.outfitItemName}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.tryOutfitButton}>
                    <Text style={styles.tryOutfitButtonText}>Try This Outfit</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Enhanced AR Screen with Real Photo Capture
const ARScreen = () => {
  const { captureARPhoto, arPhotos, deleteARPhoto } = useAppStore();
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const cameraRef = React.useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        const arPhoto = {
          uri: photo.uri,
          timestamp: new Date().toISOString(),
          cameraType: cameraType === Camera.Constants.Type.front ? 'front' : 'back',
          outfitItems: ['Virtual Item 1', 'Virtual Item 2'],
        };

        captureARPhoto(arPhoto);
        setIsCameraActive(false);

        Alert.alert(
          'Photo Captured!',
          'Your AR try-on photo has been saved to your gallery.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleGalleryItemPress = (photo) => {
    Alert.alert(
      'AR Photo',
      `Captured on ${new Date(photo.timestamp).toLocaleDateString()}`,
      [
        { text: 'Delete', style: 'destructive', onPress: () => handleDeletePhoto(photo.id) },
        { text: 'Share', onPress: () => handleSharePhoto(photo) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDeletePhoto = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteARPhoto(photoId) }
      ]
    );
  };

  const handleSharePhoto = (photo) => {
    Alert.alert('Share Photo', 'Share functionality coming soon!');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AR Try-On</Text>
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color={COLORS.error} />
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera access in your device settings to use AR Try-On
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7F</Text>
            <Text style={styles.logoSubtext}>trends</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>AR Try-On</Text>
            <Text style={styles.subtitle}>Virtual Fashion Experience</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={() => setCameraType(
              cameraType === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            )}
            >
              <Ionicons name="camera-reverse" size={20} color={COLORS.surface} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => setShowGallery(true)}
            >
              <Ionicons name="images" size={20} color={COLORS.surface} />
              <Text style={styles.galleryButtonText}>{arPhotos.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isCameraActive ? (
        <Camera.Camera ref={cameraRef} style={styles.camera} type={cameraType}>
          <View style={styles.cameraOverlay}>
            <View style={styles.arFrame}>
              <View style={[styles.arCorner, { top: -2, left: -2 }]} />
              <View style={[styles.arCorner, { top: -2, right: -2 }]} />
              <View style={[styles.arCorner, { bottom: -2, left: -2 }]} />
              <View style={[styles.arCorner, { bottom: -2, right: -2 }]} />
            </View>
            <Text style={styles.arText}>Position clothing item here</Text>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitCameraButton}
              onPress={() => setIsCameraActive(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </Camera.Camera>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.cameraText}>Camera Ready</Text>
          <Text style={styles.cameraSubtext}>
            Point camera at yourself to try on clothes virtually
          </Text>
          <TouchableOpacity
            style={styles.startCameraButton}
            onPress={() => setIsCameraActive(true)}
          >
            <Ionicons name="camera" size={20} color={COLORS.surface} />
            <Text style={styles.startCameraButtonText}>Start Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* AR Photos Gallery Modal */}
      <Modal
        visible={showGallery}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGallery(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.galleryModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>My AR Photos</Text>
              <TouchableOpacity onPress={() => setShowGallery(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>

            {arPhotos.length === 0 ? (
              <View style={styles.emptyGallery}>
                <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyGalleryText}>No AR photos yet</Text>
                <Text style={styles.emptyGallerySubtext}>
                  Take photos to see them here
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.galleryList}>
                {arPhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.galleryItem}
                    onPress={() => handleGalleryItemPress(photo)}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.galleryImage} />
                    <Text style={styles.galleryDate}>
                      {new Date(photo.timestamp).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Enhanced Competition Screen with Actions
const CompetitionScreen = () => {
  const { challenges, joinChallenge } = useAppStore();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [createChallengeVisible, setCreateChallengeVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Simulating admin access

  // Admin form states
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDescription, setChallengeDescription] = useState('');
  const [challengeIcon, setChallengeIcon] = useState('🎯');
  const [challengeDeadline, setChallengeDeadline] = useState('7 days');

  const handleJoinChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setParticipationModalVisible(true);
  };

  const confirmParticipation = () => {
    if (selectedChallenge) {
      joinChallenge(selectedChallenge.id);
      setParticipationModalVisible(false);

      Alert.alert(
        'Challenge Joined!',
        `You've successfully joined the "${selectedChallenge.title}" challenge.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleCreateChallenge = () => {
    if (isAdmin) {
      setCreateChallengeVisible(true);
    } else {
      Alert.alert('Admin Only', 'Only administrators can create challenges.');
    }
  };

  const submitChallenge = () => {
    if (!challengeTitle.trim() || !challengeDescription.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // In a real app, this would save to backend
    Alert.alert(
      'Challenge Created!',
      `"${challengeTitle}" has been successfully created and is now live!`,
      [{ text: 'OK' }]
    );

    // Reset form
    setChallengeTitle('');
    setChallengeDescription('');
    setChallengeIcon('🎯');
    setChallengeDeadline('7 days');
    setCreateChallengeVisible(false);
  };

  const renderChallenge = (challenge) => (
    <View key={challenge.id} style={styles.challengeContainer}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeIconContainer}>
          <Text style={styles.challengeIcon}>{challenge.icon}</Text>
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.challengeStats}>
        <View style={styles.challengeStat}>
          <Ionicons name="people" size={16} color={COLORS.accent} />
          <Text style={styles.challengeStatText}>{challenge.participants} participants</Text>
        </View>
        <View style={[styles.challengeStat, challenge.isActive ? styles.activeChallenge : styles.inactiveChallenge]}>
          <Ionicons
            name={challenge.isActive ? "time" : "checkmark-circle"}
            size={16}
            color={challenge.isActive ? COLORS.warning : COLORS.success}
          />
          <Text style={styles.challengeStatText}>{challenge.deadline}</Text>
        </View>
      </View>

      <View style={styles.challengeFooter}>
        <TouchableOpacity style={styles.challengeButton}>
          <Text style={styles.challengeButtonText}>View Details</Text>
        </TouchableOpacity>
        {challenge.isActive && (
          <TouchableOpacity
            style={[styles.challengeButton, styles.joinButton]}
            onPress={() => handleJoinChallenge(challenge)}
          >
            <Text style={styles.joinButtonText}>Join Challenge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7F</Text>
            <Text style={styles.logoSubtext}>trends</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Style Challenges</Text>
            <Text style={styles.subtitle}>Compete & Express Yourself</Text>
          </View>
          <TouchableOpacity style={styles.leaderboardButton}>
            <Ionicons name="trophy" size={20} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Active Challenges Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          {challenges.filter(c => c.isActive).map(renderChallenge)}
        </View>

        {/* Past Challenges Section */}
        {challenges.some(c => !c.isActive) && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Past Challenges</Text>
            {challenges.filter(c => !c.isActive).map(renderChallenge)}
          </View>
        )}

        {/* Create Challenge Section */}
        <View style={styles.createChallengeContainer}>
          <Text style={styles.createChallengeTitle}>Create Your Own Challenge</Text>
          <Text style={styles.createChallengeSubtext}>
            Start a trend and challenge others!
          </Text>
          <TouchableOpacity style={styles.createChallengeButton} onPress={handleCreateChallenge}>
            <Ionicons name="add-circle" size={24} color={COLORS.surface} />
            <Text style={styles.createChallengeButtonText}>
              {isAdmin ? 'Create Challenge' : 'Admin Only'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Participation Modal */}
      <Modal
        visible={participationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setParticipationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.participationModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setParticipationModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Join Challenge</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.participationContent}>
              <View style={styles.challengePreview}>
                <Text style={styles.challengePreviewIcon}>{selectedChallenge?.icon}</Text>
                <Text style={styles.challengePreviewTitle}>{selectedChallenge?.title}</Text>
                <Text style={styles.challengePreviewDesc}>{selectedChallenge?.description}</Text>
              </View>

              <View style={styles.participationInfo}>
                <Text style={styles.participationTitle}>
                  Ready to join "{selectedChallenge?.title}"?
                </Text>
                <Text style={styles.participationSubtext}>
                  You'll compete with {selectedChallenge?.participants} other fashion enthusiasts
                </Text>
              </View>

              <View style={styles.participationActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setParticipationModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmParticipation}
                >
                  <Text style={styles.confirmButtonText}>Join Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Challenge Modal (Admin Only) */}
      <Modal
        visible={createChallengeVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateChallengeVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createChallengeModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateChallengeVisible(false)}>
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create New Challenge</Text>
              <TouchableOpacity onPress={submitChallenge}>
                <Text style={styles.postButton}>Create</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.createChallengeContent}>
              <Text style={styles.inputLabel}>Challenge Title</Text>
              <TextInput
                style={styles.challengeInput}
                placeholder="Enter challenge title..."
                placeholderTextColor="#999999"
                value={challengeTitle}
                onChangeText={setChallengeTitle}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.challengeInput}
                placeholder="Describe your challenge..."
                placeholderTextColor="#999999"
                value={challengeDescription}
                onChangeText={setChallengeDescription}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Challenge Icon</Text>
              <View style={styles.iconSelector}>
                {['🎯', '🏆', '👗', '👔', '👠', '💼', '🎨', '🌟'].map((icon, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.iconOption,
                      challengeIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setChallengeIcon(icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Duration</Text>
              <TextInput
                style={styles.challengeInput}
                placeholder="e.g., 7 days"
                placeholderTextColor="#999999"
                value={challengeDeadline}
                onChangeText={setChallengeDeadline}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Enhanced Profile Screen
const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const { error } = await signOut();
              if (!error) {
                logout();
              } else {
                Alert.alert('Logout Failed', 'Please try again later');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Logout Failed', 'Please try again later');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleMenuItemPress = (item) => {
    const actions = {
      wardrobe: () => {
        Alert.alert('My Wardrobe', 'Open your wardrobe to manage your clothing items and create outfits.');
      },
      favorites: () => {
        Alert.alert('My Favorites', 'View and manage your favorite fashion items and saved looks.');
      },
      outfits: () => {
        Alert.alert('Outfit History', 'See your past outfit combinations and get inspired.');
      },
      challenges: () => {
        Alert.alert('Style Challenges', 'View active challenges and join fashion competitions.');
      },
      settings: () => {
        Alert.alert('Settings', 'Customize your app preferences and account settings.');
      },
      help: () => {
        Alert.alert(
          'Help & Feedback',
          'Need assistance? Contact our support team or check the FAQ section.',
          [
            { text: 'View FAQ' },
            { text: 'Contact Support' },
            { text: 'Cancel' }
          ]
        );
      },
      about: () => {
        Alert.alert(
          'About 7Ftrends',
          `Version: ${APP_INFO.version}\n\nYour digital fashion companion for discovering trends, managing your wardrobe, and expressing your unique style.\n\nCreated with ❤️ for fashion enthusiasts everywhere.`,
          [{ text: 'OK' }]
        );
      }
    };

    const action = actions[item.id];
    if (action) {
      action();
    }
  };

  const menuItems = [
    { id: 'wardrobe', title: 'My Wardrobe', icon: 'shirt-outline', color: COLORS.accent },
    { id: 'favorites', title: 'My Favorites', icon: 'heart-outline', color: COLORS.like },
    { id: 'outfits', title: 'Outfit History', icon: 'calendar-outline', color: COLORS.comment },
    { id: 'challenges', title: 'Style Challenges', icon: 'trophy-outline', color: COLORS.warning },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', color: COLORS.textSecondary },
    { id: 'help', title: 'Help & Feedback', icon: 'help-circle-outline', color: COLORS.textSecondary },
    { id: 'about', title: 'About', icon: 'information-circle-outline', color: COLORS.textSecondary },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7F</Text>
            <Text style={styles.logoSubtext}>trends</Text>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email || 'user@example.com'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Connection Status */}
        <ConnectionStatus showDetails={true} />

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.appInfoContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{APP_INFO.logo}</Text>
            <Text style={styles.appName}>{APP_INFO.name}</Text>
            <Text style={styles.appVersion}>Version {APP_INFO.version}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.surface} />
          <Text style={styles.logoutButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Stack Navigators
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
  </HomeStack.Navigator>
);

const WardrobeStackNavigator = () => (
  <WardrobeStack.Navigator screenOptions={{ headerShown: false }}>
    <WardrobeStack.Screen name="WardrobeScreen" component={WardrobeScreen} />
  </WardrobeStack.Navigator>
);

const ARStackNavigator = () => (
  <ARStack.Navigator screenOptions={{ headerShown: false }}>
    <ARStack.Screen name="ARScreen" component={ARScreen} />
  </ARStack.Navigator>
);

const CompetitionStackNavigator = () => (
  <CompetitionStack.Navigator screenOptions={{ headerShown: false }}>
    <CompetitionStack.Screen name="CompetitionScreen" component={CompetitionScreen} />
  </CompetitionStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Wardrobe') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'AR') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Competition') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'Feed' }} />
      <Tab.Screen name="Wardrobe" component={WardrobeStackNavigator} options={{ title: 'Wardrobe' }} />
      <Tab.Screen name="AR" component={ARStackNavigator} options={{ title: 'Try On' }} />
      <Tab.Screen name="Competition" component={CompetitionStackNavigator} options={{ title: 'Challenges' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 45,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    marginRight: 15,
  },
  logoText: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#ffffff',
    fontWeight: '900',
    lineHeight: 20,
  },
  logoSubtext: {
    fontSize: 8,
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -2,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontWeight: '400',
  },
  // Profile specific styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  menuContainer: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    borderRadius: 12,
    paddingVertical: SIZES.sm,
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  appInfoContainer: {
    alignItems: 'center',
    padding: SIZES.lg,
    marginTop: SIZES.sm,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    marginBottom: SIZES.sm,
  },
  appName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    margin: SIZES.md,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.lg,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  placeholder: {
    backgroundColor: COLORS.surface,
    margin: SIZES.md,
    padding: SIZES.lg,
    borderRadius: 12,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  placeholderTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  categoriesContainer: {
    padding: SIZES.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.md,
    borderRadius: 8,
    marginBottom: SIZES.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.primary,
    margin: SIZES.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.surface,
    marginTop: SIZES.md,
  },
  cameraSubtext: {
    fontSize: 14,
    color: COLORS.surface,
    textAlign: 'center',
    marginTop: SIZES.sm,
    marginHorizontal: SIZES.lg,
  },
  // AR Camera Styles
  flipCameraButton: {
    backgroundColor: COLORS.accent,
    padding: SIZES.sm,
    borderRadius: 20,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  arFrame: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    height: '30%',
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 8,
  },
  arCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.accent,
  },
  arText: {
    position: 'absolute',
    top: '63%',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SIZES.sm,
  },
  captureButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  permissionText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  startCameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    marginTop: SIZES.lg,
    ...SHADOWS.md,
  },
  startCameraButtonText: {
    color: COLORS.surface,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },

  // Post styles for Home feed
  postContainer: {
    backgroundColor: '#ffffff',
    marginBottom: SIZES.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    fontSize: 32,
    marginRight: SIZES.md,
  },
  postUsername: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    fontWeight: '600',
  },
  postTimestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.background,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    paddingTop: SIZES.sm,
  },
  actionButton: {
    marginRight: SIZES.lg,
  },
  postStats: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  likesCount: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginRight: SIZES.lg,
  },
  commentsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  postDescription: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  postUsernameText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginRight: SIZES.sm,
  },
  postCaption: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.sm,
  },
  postTag: {
    fontSize: 12,
    color: COLORS.accent,
    marginRight: SIZES.sm,
    marginBottom: SIZES.xs,
  },

  // Trending section styles
  trendingSection: {
    backgroundColor: '#ffffff',
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  trendingTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: SIZES.md + 4,
    paddingVertical: SIZES.sm + 2,
    borderRadius: 20,
    marginRight: SIZES.sm,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  trendingTagText: {
    fontSize: 12,
    color: '#495057',
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },
  feedContainer: {
    paddingHorizontal: SIZES.md,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    borderRadius: 12,
    padding: SIZES.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  commentTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  commentPostButton: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SIZES.md,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Wardrobe specific styles
  addButton: {
    backgroundColor: '#FF6B6B',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: SIZES.md,
    marginBottom: SIZES.lg,
  },
  quickActionButton: {
    backgroundColor: '#ffffff',
    padding: SIZES.md,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SIZES.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontFamily: FONTS.medium,
    marginTop: SIZES.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryItemSelected: {
    backgroundColor: `${COLORS.accent}20`,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  recentItemsContainer: {
    margin: SIZES.md,
  },
  recentItem: {
    backgroundColor: COLORS.surface,
    padding: SIZES.sm,
    borderRadius: 8,
    marginRight: SIZES.sm,
    alignItems: 'center',
    width: 100,
    ...SHADOWS.sm,
  },
  recentItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  recentItemName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.sm,
  },
  favoriteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 2,
    ...SHADOWS.xs,
  },

  // Add Item Modal styles
  addItemModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: SIZES.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  addPhotoButton: {
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  addPhotoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },
  formContainer: {
    marginBottom: SIZES.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SIZES.md,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SIZES.md,
    backgroundColor: COLORS.background,
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  submitButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },

  // Outfit Suggestions Modal styles
  outfitModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: SIZES.md,
  },
  outfitSuggestionsList: {
    maxHeight: 400,
  },
  outfitSuggestion: {
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderRadius: 8,
    marginBottom: SIZES.md,
  },
  outfitName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  outfitOccasion: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SIZES.md,
  },
  outfitItems: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  outfitItem: {
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  outfitItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.surface,
  },
  outfitItemName: {
    fontSize: 10,
    color: COLORS.text,
    textAlign: 'center',
    width: 50,
  },
  tryOutfitButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SIZES.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  tryOutfitButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },

  // AR Screen additional styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: 20,
    marginLeft: SIZES.sm,
  },
  galleryButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },
  exitCameraButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: SIZES.sm,
  },
  galleryModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    height: '80%',
    borderRadius: 12,
    padding: SIZES.md,
  },
  doneButton: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGalleryText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  emptyGallerySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  galleryList: {
    flex: 1,
  },
  galleryItem: {
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  galleryImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  galleryDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },

  // Competition Screen styles
  leaderboardButton: {
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  sectionContainer: {
    marginBottom: SIZES.lg,
  },
  challengeContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  challengeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  challengeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  challengeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  activeChallenge: {
    color: COLORS.warning,
  },
  inactiveChallenge: {
    color: COLORS.success,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeButton: {
    flex: 1,
    paddingVertical: SIZES.sm,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginRight: SIZES.sm,
  },
  challengeButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  createChallengeContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SIZES.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  createChallengeTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  createChallengeSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.md,
  },
  createChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  createChallengeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.sm,
  },

  // Participation Modal styles
  participationModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: SIZES.md,
  },
  participationContent: {
    alignItems: 'center',
  },
  challengePreview: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  challengePreviewIcon: {
    fontSize: 48,
    marginBottom: SIZES.sm,
  },
  challengePreviewTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  challengePreviewDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  participationInfo: {
    marginBottom: SIZES.lg,
  },
  participationTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  participationSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  participationActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginRight: SIZES.sm,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    marginLeft: SIZES.sm,
    ...SHADOWS.sm,
  },
  confirmButtonText: {
    fontSize: 16,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },

  // Floating Action Button
  floatingActionButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },

  // Create Post Modal
  createPostModal: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
  },
  postButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontFamily: FONTS.medium,
    fontWeight: '600',
  },
  createPostContent: {
    marginTop: 20,
  },
  postTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#fafafa',
  },
  addImageText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Admin Challenge Creation Modal
  createChallengeModal: {
    backgroundColor: '#ffffff',
    width: '90%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
  },
  createChallengeContent: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  challengeInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  iconOptionSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  iconText: {
    fontSize: 24,
  },
});

export default TabNavigator;