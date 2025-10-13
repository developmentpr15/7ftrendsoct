import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import styles from '../../styles/homeStyles';

// Import constants
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
];

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
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
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

  // Event handlers
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
          setSelectedImage('https://picsum.photos/seed/' + Date.now() + '/400/400');
        }},
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
      setSelectedHashtag(null);
    } catch (error) {
      console.error('Error in handleBackToAllPosts:', error);
      Alert.alert('Error', 'Failed to clear filter. Please try again.');
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
  };

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
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleChatPress = (conversation) => {
    setSelectedChat(conversation);
    setChatVisible(true);
    setMessageVisible(false);
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
      if (!selectedHashtag) {
        return posts || [];
      }

      if (!Array.isArray(posts)) {
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
        <TouchableOpacity>
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

      {/* Stories */}
      {!selectedHashtag && (
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={[styles.storyItem, styles.firstStoryItem]}>
              <View style={styles.storyAdd}>
                <Ionicons name="add" size={24} color="#666666" />
              </View>
              <Text style={styles.storyAddText}>Your Story</Text>
            </TouchableOpacity>

            {['fashionista', 'styleguru', 'trendsetter', 'modelpro', 'vintage'].map((username, index) => (
              <TouchableOpacity key={username} style={styles.storyItem}>
                <View style={styles.storyCircle}>
                  <Image source={{ uri: `https://picsum.photos/seed/story${index + 1}/100/100` }} style={styles.storyImage} />
                </View>
                <Text style={styles.storyUsername}>{username}</Text>
              </TouchableOpacity>
            ))}
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

      {/* All Modals will be extracted to separate components */}

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
                      onPress={() => setSearchVisible(false)}
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

      {/* Other modals (Chat, Notification, Comment, Create Post, Country) will be extracted to separate components */}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingActionButton}
        onPress={handleCreatePost}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;