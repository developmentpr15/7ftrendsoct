import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';
import { useFeed } from '../../hooks/useFeed';
import FriendshipStatus from '../../components/social/FriendshipStatus';
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
  const user = useAuthStore((state) => state.user);
  const [showFeedInfo, setShowFeedInfo] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  // Use the intelligent feed hook
  const {
    posts,
    analytics,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    onRefresh,
    loadMore,
    likePost,
    unlikePost,
    voteForEntry,
    reportPost,
    clearCacheAndRefresh,
    isEmpty,
    hasError,
    feedComposition
  } = useFeed({
    limit: 20,
    refreshInterval: 60000, // 1 minute auto-refresh
    autoRefresh: true,
    preload: true
  });

  // Country selection
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Notifications
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'like', message: 'fashionista liked your post', time: '2m ago', read: false },
    { id: 2, type: 'comment', message: 'styleguru commented: "Great outfit!"', time: '15m ago', read: false },
    { id: 3, type: 'follow', message: 'trendsetter started following you', time: '1h ago', read: true },
  ]);

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
    },
    {
      id: 2,
      username: 'styleguru',
      avatar: '👔',
      lastMessage: 'Where did you get that?',
      time: '15m ago',
      unread: 1,
    },
    {
      id: 3,
      username: 'trendsetter',
      avatar: '👠',
      lastMessage: 'Thanks for the follow!',
      time: '1h ago',
      unread: 0,
    },
  ]);

  // Handle like action with intelligent feed
  const handleLike = useCallback(async (postId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like posts');
      return;
    }

    // Check if post is already liked
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update like status');
    }
  }, [user, posts, likePost, unlikePost]);

  // Handle vote for competition entries
  const handleVote = useCallback(async (postId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to vote');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post || post.feed_type !== 'competition') return;

    try {
      await voteForEntry(postId, 5); // Default score of 5
      Alert.alert('Success', 'Vote submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit vote');
    }
  }, [user, posts, voteForEntry]);

  // Handle comment action
  const handleComment = useCallback((postId) => {
    Alert.alert('Comments', 'Comments feature coming soon!');
  }, []);

  // Handle report post
  const handleReport = useCallback((postId) => {
    Alert.prompt(
      'Report Post',
      'Please select a reason for reporting this post:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => reportPost(postId, 'spam')
        },
        {
          text: 'Inappropriate Content',
          onPress: () => reportPost(postId, 'inappropriate')
        },
        {
          text: 'Harassment',
          onPress: () => reportPost(postId, 'harassment')
        }
      ]
    );
  }, [reportPost]);

  // Handle refresh with analytics
  const handleRefresh = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  const handleCreatePost = () => {
    setCreatePostVisible(true);
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

  // Render post item with intelligent feed features
  const renderPost = useCallback(({ item }) => {
    if (!item || !item.id) {
      console.warn('renderPost received invalid item:', item);
      return null;
    }

    return (
      <View key={item.id} style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <Text style={styles.postAvatar}>
              {item.author?.avatar_url ?
                <Image source={{ uri: item.author.avatar_url }} style={styles.postAvatarImage} /> :
                <Text style={styles.postAvatarText}>
                  {item.author?.username?.[0]?.toUpperCase() || 'U'}
                </Text>
              }
            </Text>
            <View style={styles.postAuthorInfo}>
              <View style={styles.postAuthorRow}>
                <Text style={styles.postUsername}>{item.author?.username || 'Anonymous'}</Text>
                {/* Friendship/Relationship Indicator */}
                {item.relationship_type && (
                  <View style={[
                    styles.relationshipIndicator,
                    item.relationship_type === 'mutual_friend' && styles.mutualFriendIndicator,
                    item.relationship_type === 'following' && styles.followingIndicator,
                    item.relationship_type === 'discover' && styles.discoverIndicator
                  ]}>
                    <Ionicons
                      name={
                        item.relationship_type === 'mutual_friend' ? 'people' :
                        item.relationship_type === 'following' ? 'person' :
                        item.relationship_type === 'own' ? 'person' : 'globe'
                      }
                      size={10}
                      color={
                        item.relationship_type === 'mutual_friend' ? COLORS.success :
                        item.relationship_type === 'following' ? COLORS.accent :
                        item.relationship_type === 'discover' ? COLORS.textSecondary : COLORS.textSecondary
                      }
                    />
                    <Text style={[
                      styles.relationshipText,
                      item.relationship_type === 'mutual_friend' && styles.mutualFriendText,
                      item.relationship_type === 'following' && styles.followingText,
                      item.relationship_type === 'discover' && styles.discoverText
                    ]}>
                      {item.relationship_type === 'mutual_friend' ? 'Mutual' :
                       item.relationship_type === 'following' ? 'Following' :
                       item.relationship_type === 'own' ? 'You' : 'Discover'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.postTimestamp}>{item.metadata?.time_ago || 'Just now'}</Text>
            </View>
          </View>
          <View style={styles.postHeaderActions}>
            <FriendshipStatus
              currentUserId={user?.id}
              targetUserId={item.author_id}
              targetUsername={item.author?.username}
              style={styles.postFriendshipButton}
            />
            <TouchableOpacity>
              <Ionicons name="ellipsis-horizontal" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Image */}
        {item.images && item.images.length > 0 && (
          <Image source={{ uri: item.images[0] }} style={styles.postImage} />
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item.id)}>
            <Ionicons
              name={item.is_liked ? "heart" : "heart-outline"}
              size={24}
              color={item.is_liked ? COLORS.like : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {item.feed_type === 'competition' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleVote(item.id)}>
              <Ionicons name="trophy" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
            <Ionicons name="bookmark-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Post Stats */}
        <View style={styles.postStats}>
          <Text style={styles.likesCount}>{item.likes_count || 0} likes</Text>
          <Text style={styles.commentsCount}>{item.comments_count || 0} comments</Text>
          {item.feed_type && (
            <View style={styles.feedTypeContainer}>
              <Text style={[
                styles.feedTypeLabel,
                item.feed_type === 'mutual_friend' && styles.mutualFriendLabel,
                item.feed_type === 'following' && styles.followingLabel,
                item.feed_type === 'own' && styles.ownLabel,
                item.feed_type === 'trending' && styles.trendingLabel,
                item.feed_type === 'competition' && styles.competitionLabel
              ]}>
                {item.feed_type === 'mutual_friend' ? '👥 Mutual Friend' :
                 item.feed_type === 'following' ? '👤 Following' :
                 item.feed_type === 'own' ? '📝 Your Post' :
                 item.feed_type === 'trending' ? '🔥 Trending' : '🏆 Competition'}
              </Text>
              {item.friendship_boost && item.friendship_boost > 1.0 && (
                <Text style={styles.boostIndicator}>
                  {item.friendship_boost === 3.0 ? '⭐⭐⭐' :
                   item.friendship_boost === 2.0 ? '⭐⭐' : '⭐'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Post Description */}
        <View style={styles.postDescription}>
          <Text style={styles.postUsernameText}>{item.author?.username || 'Anonymous'}</Text>
          <Text style={styles.postCaption}>{item.content || ''}</Text>
        </View>
      </View>
    );
  }, [handleLike, handleComment, handleVote, posts]);

  // Render feed composition indicator
  const renderFeedComposition = () => {
    if (!feedComposition || !showFeedInfo) return null;

    return (
      <View style={styles.feedCompositionContainer}>
        <View style={styles.compositionRow}>
          <View style={styles.compositionItem}>
            <View style={[styles.compositionDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.compositionText}>
              Friends: {feedComposition.friends}
            </Text>
          </View>
          <View style={styles.compositionItem}>
            <View style={[styles.compositionDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.compositionText}>
              Trending: {feedComposition.trending}
            </Text>
          </View>
        </View>
        <View style={styles.compositionRow}>
          <View style={styles.compositionItem}>
            <View style={[styles.compositionDot, { backgroundColor: '#9C27B0' }]} />
            <Text style={styles.compositionText}>
              Competitions: {feedComposition.competitions}
            </Text>
          </View>
          <View style={styles.compositionItem}>
            <Text style={styles.compositionText}>
              Total: {feedComposition.total}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filtered = posts.filter(post =>
      post.author?.username?.toLowerCase().includes(query.toLowerCase()) ||
      (post.content && post.content.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  // Handle create post
  const submitPost = () => {
    if (newPostText.trim() || selectedImage) {
      Alert.alert('Coming Soon', 'Create post functionality will be integrated with the intelligent feed!');
      setNewPostText('');
      setSelectedImage(null);
      setCreatePostVisible(false);
    } else {
      Alert.alert('Error', 'Please add a caption or image to create a post.');
    }
  };

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