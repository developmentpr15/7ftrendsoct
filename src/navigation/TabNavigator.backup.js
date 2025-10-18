import React, { useState, useEffect, useLayoutEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Image, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  useFonts,
  Pacifico_400Regular,
} from '@expo-google-fonts/pacifico';
import { COLORS, SIZES, FONTS, SHADOWS, CATEGORIES, APP_INFO } from '../utils/constants';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { signOut } from '../utils/auth';
import ConnectionStatus from '../components';

// Countries data with flags
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
];

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WardrobeStack = createNativeStackNavigator();
const CompetitionStack = createNativeStackNavigator();
const ARStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Enhanced Home Screen with Actionable Feed
const HomeScreen = () => {
  const { posts, toggleLike, addComment } = useAppStore();
  const { user } = useAuthStore();
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // New states for country and hashtag filtering
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to US
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Search functionality states
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Message functionality states
  const [messageVisible, setMessageVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState([
    {
      id: 1,
      username: 'fashionista',
      avatar: '👗',
      lastMessage: 'Love your outfit!',
      time: '2m ago',
      unread: 2,
      messages: [
        { id: 1, text: 'Hey! Great style!', sender: 'fashionista', time: '10m ago' },
        { id: 2, text: 'Thank you so much!', sender: 'me', time: '8m ago' },
        { id: 3, text: 'Love your outfit!', sender: 'fashionista', time: '2m ago' },
      ]
    },
    {
      id: 2,
      username: 'styleguru',
      avatar: '👔',
      lastMessage: 'Where did you get that?',
      time: '15m ago',
      unread: 1,
      messages: [
        { id: 1, text: 'That outfit is amazing!', sender: 'styleguru', time: '20m ago' },
        { id: 2, text: 'Thanks! I picked it up last week', sender: 'me', time: '18m ago' },
        { id: 3, text: 'Where did you get that?', sender: 'styleguru', time: '15m ago' },
      ]
    },
    {
      id: 3,
      username: 'trendsetter',
      avatar: '👠',
      lastMessage: 'Thanks for the follow!',
      time: '1h ago',
      unread: 0,
      messages: [
        { id: 1, text: 'Just followed you!', sender: 'me', time: '1h ago' },
        { id: 2, text: 'Thanks for the follow!', sender: 'trendsetter', time: '1h ago' },
      ]
    },
    {
      id: 4,
      username: 'modelpro',
      avatar: '👗',
      lastMessage: 'Let\'s collaborate!',
      time: '2h ago',
      unread: 0,
      messages: [
        { id: 1, text: 'Hi there!', sender: 'modelpro', time: '2h ago' },
        { id: 2, text: 'Hello!', sender: 'me', time: '2h ago' },
        { id: 3, text: 'Let\'s collaborate!', sender: 'modelpro', time: '2h ago' },
      ]
    },
  ]);

  // Notification functionality states
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'like', message: 'fashionista liked your post', time: '2m ago', read: false },
    { id: 2, type: 'comment', message: 'styleguru commented: "Great outfit!"', time: '15m ago', read: false },
    { id: 3, type: 'follow', message: 'trendsetter started following you', time: '1h ago', read: true },
    { id: 4, type: 'challenge', message: 'New challenge "Summer Styles" is live!', time: '2h ago', read: true },
  ]);

  // Ensure state is properly initialized
  useLayoutEffect(() => {
    console.log('HomeScreen component mounted with selectedHashtag:', selectedHashtag);
  }, []);

  useEffect(() => {
    console.log('selectedHashtag changed to:', selectedHashtag);
  }, [selectedHashtag]);

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
    if (newPostText.trim() || selectedImage) {
      // Create new post object
      const newPost = {
        id: Date.now().toString(),
        username: user?.user_metadata?.username || user?.email?.split('@')[0] || 'User',
        avatar: '👤',
        image: selectedImage || 'https://picsum.photos/seed/' + Date.now() + '/400/400',
        outfit: newPostText.trim() || 'New outfit post!',
        items: newPostText.match(/#\w+/g) || [],
        likes: 0,
        comments: 0,
        isLiked: false,
        timestamp: 'Just now',
      };

      // Add to posts (this would normally be saved to backend)
      posts.unshift(newPost);

      Alert.alert('Success', 'Post created successfully!');
      setNewPostText('');
      setSelectedImage(null);
      setCreatePostVisible(false);
    } else {
      Alert.alert('Error', 'Please add a caption or image to create a post.');
    }
  };

  const handleAddImageToPost = () => {
    Alert.alert(
      'Add Photo',
      'Choose photo source:',
      [
        { text: 'Camera', onPress: () => Alert.alert('Camera', 'Camera functionality coming soon!') },
        { text: 'Gallery', onPress: () => {
          // Simulate picking an image
          setSelectedImage('https://picsum.photos/seed/' + Date.now() + '/400/400');
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
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

  const handleHashtagPress = (hashtag) => {
    try {
      setSelectedHashtag(hashtag);
    } catch (error) {
      console.error('Error in handleHashtagPress:', error);
      Alert.alert('Error', 'Failed to apply filter. Please try again.');
    }
  };

  const handleBackToAllPosts = () => {
    try {
      console.log('Back button pressed - clearing hashtag filter');

      // Use functional state update to avoid any potential stale state issues
      setSelectedHashtag((currentHashtag) => {
        console.log('Clearing hashtag filter from:', currentHashtag);
        return null;
      });

      console.log('Hashtag filter cleared successfully');
    } catch (error) {
      console.error('Error in handleBackToAllPosts:', error);
      Alert.alert('Error', 'Failed to clear filter. Please try again.');
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
  };

  // Search functionality handlers
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filtered = posts.filter(post =>
      post.username.toLowerCase().includes(query.toLowerCase()) ||
      post.outfit.toLowerCase().includes(query.toLowerCase()) ||
      post.items.some(item => item.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  const handleSearchIconPress = () => {
    setSearchVisible(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleMessageIconPress = () => {
    setMessageVisible(true);
  };

  const handleNotificationIconPress = () => {
    setNotificationVisible(true);
    // Mark all notifications as read
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  // Messaging functionality handlers
  const handleChatPress = (conversation) => {
    setSelectedChat(conversation);
    setChatVisible(true);
    setMessageVisible(false);
    // Mark messages as read
    setConversations(prev => prev.map(conv =>
      conv.id === conversation.id ? { ...conv, unread: 0 } : conv
    ));
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      const newMessage = {
        id: Date.now().toString(),
        text: messageText.trim(),
        sender: 'me',
        time: 'Just now',
      };

      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedChat.id) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: messageText.trim(),
            time: 'Just now',
          };
        }
        return conv;
      }));

      setSelectedChat(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: messageText.trim(),
        time: 'Just now',
      }));

      setMessageText('');
    }
  };

  const handleBackToMessages = () => {
    setChatVisible(false);
    setSelectedChat(null);
    setMessageText('');
    setMessageVisible(true);
  };

  const getFilteredPosts = () => {
    try {
      console.log('Getting filtered posts, selectedHashtag:', selectedHashtag);

      if (!selectedHashtag) {
        console.log('No hashtag selected, returning all posts:', posts?.length || 0);
        return posts || [];
      }

      if (!Array.isArray(posts)) {
        console.log('Posts is not an array, returning empty array');
        return [];
      }

      const filtered = posts.filter(post => {
        try {
          if (!post || !post.items) return false;

          return post.items.some(item =>
            item && `#${item.replace(/\s+/g, '')}` === selectedHashtag
          ) || (
            post.outfit &&
            post.outfit.toLowerCase().includes(selectedHashtag.substring(1).toLowerCase())
          );
        } catch (postError) {
          console.error('Error filtering individual post:', postError);
          return false;
        }
      });

      console.log('Filtered posts count:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('Error in getFilteredPosts:', error);
      return posts || [];
    }
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
            <TouchableOpacity
              key={index}
              onPress={() => handleHashtagPress(`#${item.replace(/\s+/g, '')}`)}
            >
              <Text style={styles.postTag}>#{item.replace(/\s+/g, '')}</Text>
            </TouchableOpacity>
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
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconButton} onPress={handleSearchIconPress}>
              <Ionicons name="search" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} onPress={handleMessageIconPress}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationIconPress}>
              <Ionicons name="notifications" size={20} color="#666666" />
              {notifications.some(n => !n.read) && <View style={styles.notificationDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountrySelector(true)}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Instagram-style Stories - Hidden when hashtag is selected */}
      {!selectedHashtag && (
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={[styles.storyItem, styles.firstStoryItem]}>
              <View style={styles.storyAdd}>
                <Ionicons name="add" size={24} color="#666666" />
              </View>
              <Text style={styles.storyAddText}>Your Story</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.storyCircle}>
                <Image source={{ uri: 'https://picsum.photos/seed/story1/100/100' }} style={styles.storyImage} />
              </View>
              <Text style={styles.storyUsername}>fashionista</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.storyCircle}>
                <Image source={{ uri: 'https://picsum.photos/seed/story2/100/100' }} style={styles.storyImage} />
              </View>
              <Text style={styles.storyUsername}>styleguru</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.storyCircle}>
                <Image source={{ uri: 'https://picsum.photos/seed/story3/100/100' }} style={styles.storyImage} />
              </View>
              <Text style={styles.storyUsername}>trendsetter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.storyCircle}>
                <Image source={{ uri: 'https://picsum.photos/seed/story4/100/100' }} style={styles.storyImage} />
              </View>
              <Text style={styles.storyUsername}>modelpro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.storyItem}>
              <View style={styles.storyCircle}>
                <Image source={{ uri: 'https://picsum.photos/seed/story5/100/100' }} style={styles.storyImage} />
              </View>
              <Text style={styles.storyUsername}>vintage</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trending Section */}
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          {selectedHashtag && (
            <View style={styles.selectedHashtagContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToAllPosts}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={16} color="#666666" />
              </TouchableOpacity>
              <Text style={styles.selectedHashtagText}>🔥 {selectedHashtag}</Text>
              <Text style={styles.showingResultsText}>Showing filtered results</Text>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['#Minimalist', '#StreetStyle', '#Vintage', '#BusinessCasual', '#SummerVibes'].map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingTag}
                onPress={() => handleHashtagPress(tag)}
              >
                <Text style={styles.trendingTagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Posts Feed */}
        <View style={styles.feedContainer}>
          {getFilteredPosts().map(renderPost)}
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Search</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search users, posts, or hashtags..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}>
                    <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView style={styles.searchResultsContainer}>
              {searchQuery.trim() === '' ? (
                <View style={styles.searchSuggestions}>
                  <Text style={styles.searchSuggestionsTitle}>Trending Searches</Text>
                  {['#SummerFashion', '#StreetStyle', '#Minimalist', '#VintageVibes', '#BusinessCasual'].map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchSuggestionItem}
                      onPress={() => handleSearch(suggestion)}
                    >
                      <Ionicons name="trending-up" size={16} color={COLORS.accent} />
                      <Text style={styles.searchSuggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : searchResults.length > 0 ? (
                <View>
                  <Text style={styles.searchResultsTitle}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </Text>
                  {searchResults.map((post) => (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.searchResultItem}
                      onPress={() => {
                        setSearchVisible(false);
                        // Navigate to post or show post details
                      }}
                    >
                      <Image source={{ uri: post.image }} style={styles.searchResultImage} />
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultUsername}>{post.username}</Text>
                        <Text style={styles.searchResultCaption} numberOfLines={2}>{post.outfit}</Text>
                        <Text style={styles.searchResultStats}>{post.likes} likes • {post.comments} comments</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : searchQuery.trim() !== '' ? (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsSubtext}>Try searching for something else</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Message Modal */}
      <Modal
        visible={messageVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMessageVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.messageModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setMessageVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Messages</Text>
              <TouchableOpacity>
                <Ionicons name="create" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messageList}>
              {conversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.messageItem}
                  onPress={() => handleChatPress(conversation)}
                >
                  <View style={styles.messageAvatar}>
                    <Text style={styles.messageAvatarText}>{conversation.avatar}</Text>
                  </View>
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageUsername}>{conversation.username}</Text>
                      <Text style={styles.messageTime}>{conversation.time}</Text>
                    </View>
                    <Text style={styles.messageText} numberOfLines={1}>{conversation.lastMessage}</Text>
                  </View>
                  {conversation.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conversation.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModal}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={handleBackToMessages}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.chatHeaderInfo}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>{selectedChat?.avatar}</Text>
                </View>
                <View>
                  <Text style={styles.chatUsername}>{selectedChat?.username}</Text>
                  <Text style={styles.chatStatus}>Active now</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView style={styles.chatMessagesContainer} showsVerticalScrollIndicator={false}>
              {selectedChat?.messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.chatMessage,
                    message.sender === 'me' ? styles.myMessage : styles.otherMessage
                  ]}
                >
                  <View style={[
                    styles.messageBubble,
                    message.sender === 'me' ? styles.myBubble : styles.otherBubble
                  ]}>
                    <Text style={[
                      styles.messageBubbleText,
                      message.sender === 'me' ? styles.myBubbleText : styles.otherBubbleText
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.chatInputContainer}>
              <TouchableOpacity style={styles.chatAttachButton}>
                <Ionicons name="add" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.chatInputWrapper}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.chatSendButton,
                  messageText.trim() ? styles.chatSendButtonActive : styles.chatSendButtonInactive
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={messageText.trim() ? COLORS.surface : COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <Modal
        visible={notificationVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setNotificationVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotifications([])}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationList}>
              {notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.notificationItemUnread
                  ]}
                >
                  <View style={styles.notificationIconContainer}>
                    <Ionicons
                      name={
                        notification.type === 'like' ? 'heart' :
                        notification.type === 'comment' ? 'chatbubble' :
                        notification.type === 'follow' ? 'person-add' : 'trophy'
                      }
                      size={20}
                      color={
                        notification.type === 'like' ? COLORS.like :
                        notification.type === 'comment' ? COLORS.comment :
                        notification.type === 'follow' ? COLORS.accent : COLORS.warning
                      }
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                  {!notification.read && <View style={styles.notificationDot} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImageToPost}>
                <Ionicons name="image-outline" size={24} color="#666666" />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>

              {selectedImage && (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Selector Modal */}
      <Modal
        visible={showCountrySelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountrySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countryModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCountrySelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Country</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryItem,
                    selectedCountry.code === country.code && styles.countryItemSelected
                  ]}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.countryFlagLarge}>{country.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>{country.name}</Text>
                    <Text style={styles.countryCode}>{country.code}</Text>
                  </View>
                  {selectedCountry.code === country.code && (
                    <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Wardrobe page header actions removed */}
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
  const { captureARPhoto, arPhotos, deleteARPhoto, wardrobeItems } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('front');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showWardrobeSelector, setShowWardrobeSelector] = useState(false);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState({});
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const cameraRef = React.useRef(null);

  // Define wardrobe categories
  const WARDROBE_CATEGORIES = [
    { id: 'top', name: 'Tops', icon: '👔', emoji: '👔' },
    { id: 'bottom', name: 'Bottoms', icon: '👖', emoji: '👖' },
    { id: 'shoes', name: 'Shoes', icon: '👟', emoji: '👟' },
    { id: 'accessories', name: 'Accessories', icon: '⌚', emoji: '⌚' },
    { id: 'outerwear', name: 'Outerwear', icon: '🧥', emoji: '🧥' },
    { id: 'hats', name: 'Hats', icon: '👒', emoji: '👒' }
  ];

  // Sample wardrobe items if user doesn't have items
  const sampleWardrobeItems = [
    { id: 'sample1', name: 'White T-Shirt', category: 'top', image: 'https://picsum.photos/seed/tshirt1/100/120' },
    { id: 'sample2', name: 'Blue Jeans', category: 'bottom', image: 'https://picsum.photos/seed/jeans1/100/120' },
    { id: 'sample3', name: 'Black Sneakers', category: 'shoes', image: 'https://picsum.photos/seed/shoes1/100/120' },
    { id: 'sample4', name: 'Leather Jacket', category: 'outerwear', image: 'https://picsum.photos/seed/jacket1/100/120' },
    { id: 'sample5', name: 'Baseball Cap', category: 'hats', image: 'https://picsum.photos/seed/cap1/100/120' },
    { id: 'sample6', name: 'Gold Watch', category: 'accessories', image: 'https://picsum.photos/seed/watch1/100/120' },
    { id: 'sample7', name: 'Black Shirt', category: 'top', image: 'https://picsum.photos/seed/shirt1/100/120' },
    { id: 'sample8', name: 'Khaki Pants', category: 'bottom', image: 'https://picsum.photos/seed/pants1/100/120' },
    { id: 'sample9', name: 'Brown Boots', category: 'shoes', image: 'https://picsum.photos/seed/boots1/100/120' },
  ];

  const availableItems = wardrobeItems.length > 0 ? wardrobeItems : sampleWardrobeItems;

  if (!permission) {
    // Camera permissions are still loading
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

  if (!permission.granted) {
    // Camera permissions are not granted yet
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
          <TouchableOpacity style={styles.startCameraButton} onPress={requestPermission}>
            <Text style={styles.startCameraButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Handle outfit item selection (max 1 per category)
  const handleItemSelect = (item) => {
    setSelectedOutfitItems(prev => {
      const isCurrentlySelected = prev[item.category]?.id === item.id;
      if (isCurrentlySelected) {
        // Deselect the item
        const newSelection = { ...prev };
        delete newSelection[item.category];
        return newSelection;
      } else {
        // Select the new item (replacing any previous selection in this category)
        return {
          ...prev,
          [item.category]: item
        };
      }
    });
  };

  // Generate avatar from selected outfit items
  const generateAvatar = () => {
    const selectedCount = Object.keys(selectedOutfitItems).length;
    if (selectedCount === 0) {
      Alert.alert('No Selection', 'Please select at least one item to create your avatar.');
      return;
    }

    setShowAvatarPreview(true);
  };

  // Start camera with selected outfit
  const startCameraWithOutfit = () => {
    const selectedCount = Object.keys(selectedOutfitItems).length;
    if (selectedCount === 0) {
      Alert.alert('No Selection', 'Please select at least one item to try on.');
      return;
    }

    setShowWardrobeSelector(false);
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        // Include selected outfit items in the AR photo
        const selectedItems = Object.values(selectedOutfitItems);
        const arPhoto = {
          uri: photo.uri,
          timestamp: new Date().toISOString(),
          cameraType: facing,
          outfitItems: selectedItems.map(item => item.name),
          selectedOutfit: selectedOutfitItems,
        };

        captureARPhoto(arPhoto);
        setIsCameraActive(false);

        Alert.alert(
          'Photo Captured!',
          `Your AR try-on photo with ${selectedItems.length} items has been saved to your gallery.`,
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

  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="search" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#666666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={20} color="#666666" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.flipCameraButton}
              onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
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
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
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
        </CameraView>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={64} color={COLORS.textSecondary} />
          <Text style={styles.cameraText}>Camera Ready</Text>
          <Text style={styles.cameraSubtext}>
            Select wardrobe items to try on clothes virtually
          </Text>
          <View style={styles.arButtonContainer}>
            <TouchableOpacity
              style={[styles.startCameraButton, styles.wardrobeButton]}
              onPress={() => setShowWardrobeSelector(true)}
            >
              <Ionicons name="shirt-outline" size={20} color={COLORS.surface} />
              <Text style={styles.startCameraButtonText}>Select Wardrobe</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startCameraButton}
              onPress={() => setIsCameraActive(true)}
            >
              <Ionicons name="camera" size={20} color={COLORS.surface} />
              <Text style={styles.startCameraButtonText}>Start Camera</Text>
            </TouchableOpacity>
          </View>
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

      {/* Wardrobe Selector Modal */}
      <Modal
        visible={showWardrobeSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWardrobeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wardrobeSelectorModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowWardrobeSelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Wardrobe Items</Text>
              <TouchableOpacity onPress={generateAvatar}>
                <Text style={styles.createAvatarButton}>Create Avatar</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Items Summary */}
            <View style={styles.selectedItemsSummary}>
              <Text style={styles.selectedItemsText}>
                {Object.keys(selectedOutfitItems).length} items selected
              </Text>
              <Text style={styles.selectedCategoriesText}>
                {Object.keys(selectedOutfitItems).join(', ')}
              </Text>
            </View>

            {/* Categories and Items */}
            <ScrollView style={styles.wardrobeCategoriesList}>
              {WARDROBE_CATEGORIES.map((category) => {
                const categoryItems = availableItems.filter(item => item.category === category.id);
                const selectedItem = selectedOutfitItems[category.id];

                return (
                  <View key={category.id} style={styles.wardrobeCategorySection}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={styles.categoryTitle}>{category.name}</Text>
                      {selectedItem && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
                        </View>
                      )}
                    </View>

                    {categoryItems.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryItemsScroll}
                      >
                        {categoryItems.map((item) => {
                          const isSelected = selectedItem?.id === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={[
                                styles.wardrobeItem,
                                isSelected && styles.wardrobeItemSelected
                              ]}
                              onPress={() => handleItemSelect(item)}
                            >
                              <Image source={{ uri: item.image }} style={styles.wardrobeItemImage} />
                              <Text style={styles.wardrobeItemName} numberOfLines={1}>
                                {item.name}
                              </Text>
                              {isSelected && (
                                <View style={styles.itemSelectedBadge}>
                                  <Ionicons name="checkmark" size={12} color={COLORS.surface} />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <Text style={styles.noItemsText}>No items in this category</Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.wardrobeActions}>
              <TouchableOpacity
                style={[styles.wardrobeActionButton, styles.cancelButton]}
                onPress={() => {
                  setSelectedOutfitItems({});
                  setShowWardrobeSelector(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Clear Selection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.wardrobeActionButton, styles.tryOnButton]}
                onPress={startCameraWithOutfit}
              >
                <Ionicons name="camera" size={16} color={COLORS.surface} />
                <Text style={styles.tryOnButtonText}>Try On</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Preview Modal */}
      <Modal
        visible={showAvatarPreview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAvatarPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarPreviewModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAvatarPreview(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Your Style Avatar</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Avatar Display */}
            <View style={styles.avatarDisplay}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
              <Text style={styles.avatarTitle}>Style Profile Created!</Text>
              <Text style={styles.avatarSubtitle}>
                Based on your selected {Object.keys(selectedOutfitItems).length} items
              </Text>
            </View>

            {/* Selected Items Display */}
            <View style={styles.avatarItemsDisplay}>
              <Text style={styles.avatarItemsTitle}>Selected Items:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.values(selectedOutfitItems).map((item) => (
                  <View key={item.id} style={styles.avatarItem}>
                    <Image source={{ uri: item.image }} style={styles.avatarItemImage} />
                    <Text style={styles.avatarItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Avatar Actions */}
            <View style={styles.avatarActions}>
              <TouchableOpacity
                style={[styles.avatarActionButton, styles.backToSelectionButton]}
                onPress={() => setShowAvatarPreview(false)}
              >
                <Text style={styles.backToSelectionButtonText}>Back to Selection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.avatarActionButton, styles.startCameraButton]}
                onPress={() => {
                  setShowAvatarPreview(false);
                  setShowWardrobeSelector(false);
                  setIsCameraActive(true);
                }}
              >
                <Ionicons name="camera" size={16} color={COLORS.surface} />
                <Text style={styles.startCameraButtonText}>Start AR Camera</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={styles.logoText}>7ftrends</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Competition page header actions removed */}
          </View>
          <TouchableOpacity style={styles.leaderboardButton}>
            <Ionicons name="trophy" size={20} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Active Challenges Section */}
        <View style={[styles.sectionContainer, styles.sectionWithPadding]}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          {challenges.filter(c => c.isActive).map(renderChallenge)}
        </View>

        {/* Past Challenges Section */}
        {challenges.some(c => !c.isActive) && (
          <View style={[styles.sectionContainer, styles.sectionWithPadding]}>
            <Text style={styles.sectionTitle}>Past Challenges</Text>
            {challenges.filter(c => !c.isActive).map(renderChallenge)}
          </View>
        )}

        {/* Create Challenge Section */}
        <View style={[styles.createChallengeContainer, styles.sectionWithPadding]}>
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
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('Fashion enthusiast | Style explorer | Trendsetter 🌟');
  const [tempBio, setTempBio] = useState(bioText);

  const handleEditBio = () => {
    setIsEditingBio(true);
    setTempBio(bioText);
  };

  const handleSaveBio = () => {
    if (tempBio.trim()) {
      setBioText(tempBio.trim());
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully!');
    }
  };

  const handleCancelBio = () => {
    setTempBio(bioText);
    setIsEditingBio(false);
  };

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
        Alert.alert(
          'My Wardrobe',
          'Manage your clothing items, create outfits, and get style suggestions.',
          [
            { text: 'View Wardrobe', onPress: () => Alert.alert('Navigation', 'Navigating to Wardrobe...') },
            { text: 'Add Item', onPress: () => Alert.alert('Add Item', 'Opening add item dialog...') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      },
      favorites: () => {
        Alert.alert(
          'My Favorites',
          'View your saved fashion items, liked posts, and inspiration collection.',
          [
            { text: 'View Favorites', onPress: () => Alert.alert('Navigation', 'Opening favorites...') },
            { text: 'Create Collection', onPress: () => Alert.alert('New Collection', 'Creating new collection...') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      },
      outfits: () => {
        Alert.alert(
          'Outfit History',
          'Browse your past outfit combinations and get outfit recommendations.',
          [
            { text: 'View History', onPress: () => Alert.alert('History', 'Loading outfit history...') },
            { text: 'Get Recommendations', onPress: () => Alert.alert('AI Stylist', 'Generating outfit ideas...') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      },
      challenges: () => {
        Alert.alert(
          'Style Challenges',
          'Join fashion challenges, compete with others, and win prizes!',
          [
            { text: 'Active Challenges', onPress: () => Alert.alert('Navigation', 'Opening challenges...') },
            { text: 'My Participations', onPress: () => Alert.alert('My Challenges', 'Loading your challenge history...') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      },
      settings: () => {
        Alert.alert(
          'Settings',
          'Customize your app experience and manage your preferences.',
          [
            { text: 'Account Settings', onPress: () => Alert.alert('Account', 'Opening account settings...') },
            { text: 'Privacy Settings', onPress: () => Alert.alert('Privacy', 'Loading privacy options...') },
            { text: 'Notifications', onPress: () => Alert.alert('Notifications', 'Opening notification settings...') },
            { text: 'Appearance', onPress: () => Alert.alert('Appearance', 'Customizing app theme...') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      },
      help: () => {
        Alert.alert(
          'Help & Support',
          'How can we help you today?',
          [
            { text: 'FAQ', onPress: () => Alert.alert('FAQ', 'Loading frequently asked questions...') },
            { text: 'Contact Support', onPress: () => Alert.alert('Support', 'Opening support chat...') },
            { text: 'Report a Bug', onPress: () => Alert.alert('Bug Report', 'Opening bug report form...') },
            { text: 'Feature Request', onPress: () => Alert.alert('Feedback', 'Opening feedback form...') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      },
      about: () => {
        Alert.alert(
          'About 7Ftrends',
          `Version: ${APP_INFO.version}\n\nYour digital fashion companion for discovering trends, managing your wardrobe, and expressing your unique style.\n\nCreated with ❤️ for fashion enthusiasts everywhere.\n\n© 2024 7Ftrends. All rights reserved.`,
          [
            { text: 'Terms of Service', onPress: () => Alert.alert('Terms', 'Loading terms of service...') },
            { text: 'Privacy Policy', onPress: () => Alert.alert('Privacy', 'Loading privacy policy...') },
            { text: 'OK' }
          ]
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
            <Text style={styles.logoText}>7ftrends</Text>
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
              <TouchableOpacity onPress={handleEditBio} style={styles.bioContainer}>
                {isEditingBio ? (
                  <View style={styles.bioEditContainer}>
                    <TextInput
                      style={styles.bioInput}
                      value={tempBio}
                      onChangeText={setTempBio}
                      multiline
                      autoFocus
                      maxLength={150}
                      placeholder="Tell us about yourself..."
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <View style={styles.bioEditActions}>
                      <TouchableOpacity onPress={handleCancelBio} style={styles.bioCancelBtn}>
                        <Text style={styles.bioCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSaveBio} style={styles.bioSaveBtn}>
                        <Text style={styles.bioSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.bioDisplayContainer}>
                    <Text style={styles.bioText}>{bioText}</Text>
                    <Ionicons name="create-outline" size={14} color={COLORS.textSecondary} style={styles.bioEditIcon} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.statsContainer, styles.sectionWithPadding]}>
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

        <View style={[styles.menuContainer, styles.sectionWithPadding]}>
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

        <View style={[styles.appInfoContainer, styles.sectionWithPadding]}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>{APP_INFO.logo}</Text>
            <Text style={styles.appName}>{APP_INFO.name}</Text>
            <Text style={styles.appVersion}>Version {APP_INFO.version}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled, styles.sectionWithPadding]}
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

const TabNavigatorComponent = () => {
  let [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

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

const TabNavigator = () => {
  return <TabNavigatorComponent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 30,
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
    paddingHorizontal: 8,
    paddingVertical: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    marginRight: 15,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Pacifico_400Regular',
    color: '#FDE047',
    fontWeight: '400',
    letterSpacing: 0.6,
  },
  countrySelector: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  countryFlag: {
    fontSize: 18,
  },
  // Hashtag header styles
  hashtagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  hashtagTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    fontWeight: '600',
  },
  spacer: {
    width: 28,
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
  // Bio styles
  bioContainer: {
    marginTop: 4,
  },
  bioDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    flex: 1,
    marginRight: 8,
  },
  bioEditIcon: {
    marginLeft: 4,
  },
  bioEditContainer: {
    flex: 1,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  bioEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bioCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  bioCancelBtnText: {
    fontSize: 14,
    color: COLORS.text,
  },
  bioSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.accent,
  },
  bioSaveBtnText: {
    fontSize: 14,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
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
  // Section padding style
  sectionWithPadding: {
    paddingLeft: SIZES.lg,
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
    fontSize: 20,
    fontFamily: 'Pacifico_400Regular',
    color: COLORS.text,
    marginBottom: 6,
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
  // Selected hashtag container styles
  selectedHashtagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedHashtagText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  showingResultsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  // Stories styles
  storiesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    paddingLeft: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  firstStoryItem: {
    marginLeft: 0,
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    backgroundColor: '#f8f8f8',
    marginBottom: 4,
    overflow: 'hidden',
    shadowColor: '#b873f3',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderColor: '#b873f3',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  storyAdd: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#b873f3',
    borderStyle: 'dashed',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#b873f3',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  storyAddText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  storyUsername: {
    fontSize: 11,
    color: '#333333',
    textAlign: 'center',
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

  // Header Actions styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
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
    paddingRight: SIZES.lg,
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
  selectedImageContainer: {
    marginTop: 16,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
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

  // Country Selector Modal styles
  countryModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: SIZES.md,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countryItemSelected: {
    backgroundColor: `${COLORS.accent}15`,
  },
  countryFlagLarge: {
    fontSize: 28,
    marginRight: SIZES.md,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  countryCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Search Modal Styles
  searchModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    height: '80%',
    borderRadius: 16,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchSuggestions: {
    flex: 1,
  },
  searchSuggestionsTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 16,
  },
  searchSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchSuggestionText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultUsername: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 4,
  },
  searchResultCaption: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  searchResultStats: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },

  // Message Modal Styles
  messageModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    height: '80%',
    borderRadius: 16,
    padding: 20,
  },
  messageList: {
    flex: 1,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  messageAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageAvatarText: {
    fontSize: 20,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageUsername: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  // Chat Modal Styles
  chatModal: {
    backgroundColor: COLORS.surface,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    padding: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatAvatarText: {
    fontSize: 18,
  },
  chatUsername: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  chatStatus: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 2,
  },
  chatMessagesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  chatMessage: {
    marginBottom: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  myBubble: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
  },
  messageBubbleText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myBubbleText: {
    color: COLORS.surface,
  },
  otherBubbleText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  chatAttachButton: {
    padding: 8,
    marginRight: 8,
  },
  chatInputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chatInput: {
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonActive: {
    backgroundColor: COLORS.accent,
  },
  chatSendButtonInactive: {
    backgroundColor: '#f8f9fa',
  },

  // Notification Modal Styles
  notificationModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    height: '80%',
    borderRadius: 16,
    padding: 20,
  },
  clearAllText: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationItemUnread: {
    backgroundColor: '#f8f9fa',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
  },

  // AR Button Container
  arButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.md,
  },
  wardrobeButton: {
    backgroundColor: COLORS.accent,
    marginRight: SIZES.sm,
  },

  // Wardrobe Selector Modal
  wardrobeSelectorModal: {
    backgroundColor: COLORS.surface,
    width: '95%',
    height: '90%',
    borderRadius: 16,
    padding: SIZES.md,
  },
  createAvatarButton: {
    fontSize: 16,
    color: COLORS.accent,
    fontFamily: FONTS.medium,
  },
  selectedItemsSummary: {
    backgroundColor: COLORS.background,
    padding: SIZES.md,
    borderRadius: 8,
    marginVertical: SIZES.sm,
  },
  selectedItemsText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  selectedCategoriesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  wardrobeCategoriesList: {
    flex: 1,
    marginVertical: SIZES.sm,
  },
  wardrobeCategorySection: {
    marginBottom: SIZES.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: SIZES.sm,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryItemsScroll: {
    marginVertical: SIZES.sm,
  },
  wardrobeItem: {
    width: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SIZES.xs,
    alignItems: 'center',
    padding: SIZES.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  wardrobeItemSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}10`,
  },
  wardrobeItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: SIZES.sm,
    backgroundColor: COLORS.background,
  },
  wardrobeItemName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  itemSelectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SIZES.md,
  },
  wardrobeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  wardrobeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: 8,
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  tryOnButton: {
    backgroundColor: COLORS.accent,
  },
  tryOnButtonText: {
    fontSize: 14,
    color: COLORS.surface,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.xs,
  },

  // Avatar Preview Modal
  avatarPreviewModal: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: SIZES.lg,
  },
  avatarDisplay: {
    alignItems: 'center',
    marginVertical: SIZES.lg,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.md,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  avatarTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  avatarSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  avatarItemsDisplay: {
    marginVertical: SIZES.lg,
  },
  avatarItemsTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  avatarItem: {
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  avatarItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: SIZES.xs,
    backgroundColor: COLORS.background,
  },
  avatarItemName: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
    maxWidth: 80,
  },
  avatarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.lg,
  },
  avatarActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: 8,
    marginHorizontal: SIZES.sm,
  },
  backToSelectionButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backToSelectionButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
});

export default TabNavigator;