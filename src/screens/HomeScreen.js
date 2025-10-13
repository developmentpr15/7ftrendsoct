import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { COLORS, SIZES, FONTS, SHADOWS, CATEGORIES, APP_INFO } from '../utils/constants';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';

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

const { width } = Dimensions.get('window');

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
        { id: 1, text: 'Where did you get that?', sender: 'styleguru', time: '15m ago' },
      ]
    },
    {
      id: 3,
      username: 'trendsetter',
      avatar: '👟',
      lastMessage: 'Let\'s collaborate!',
      time: '1h ago',
      unread: 0,
      messages: [
        { id: 1, text: 'Let\'s collaborate!', sender: 'trendsetter', time: '1h ago' },
      ]
    },
  ]);

  const [fontsLoaded] = useFonts({
    Pacifico_400Regular,
  });

  // Filter posts based on selected country and hashtag
  const filteredPosts = posts.filter(post => {
    const countryMatch = !selectedCountry || post.country === selectedCountry.code;
    const hashtagMatch = !selectedHashtag || post.hashtags?.includes(selectedHashtag);
    return countryMatch && hashtagMatch;
  });

  // Hashtag extraction from posts
  const availableHashtags = [...new Set(posts.flatMap(post => post.hashtags || []))];

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = posts.filter(post =>
        post.text.toLowerCase().includes(query.toLowerCase()) ||
        post.username.toLowerCase().includes(query.toLowerCase()) ||
        post.hashtags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Message functionality
  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      const newMessage = {
        id: Date.now(),
        text: messageText,
        sender: 'me',
        time: 'Just now'
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedChat.id
            ? {
                ...conv,
                messages: [...conv.messages, newMessage],
                lastMessage: messageText,
                time: 'Just now'
              }
            : conv
        )
      );

      setMessageText('');
    }
  };

  const openChat = (conversation) => {
    setSelectedChat(conversation);
    setChatVisible(true);
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id ? { ...conv, unread: 0 } : conv
      )
    );
  };

  // Create post functionality
  const handleCreatePost = () => {
    if (newPostText.trim()) {
      const newPost = {
        id: Date.now(),
        username: user?.username || 'Anonymous',
        avatar: user?.avatar || '👤',
        text: newPostText,
        image: selectedImage,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        country: selectedCountry.code,
        hashtags: extractHashtags(newPostText),
      };

      addComment(newPost);
      setNewPostText('');
      setSelectedImage(null);
      setCreatePostVisible(false);

      Alert.alert('Success', 'Your post has been shared!');
    }
  };

  const extractHashtags = (text) => {
    const hashtags = text.match(/#\w+/g);
    return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
  };

  const renderStory = ({ item, index }) => (
    <TouchableOpacity key={index} style={styles.storyItem}>
      <View style={styles.storyRing}>
        <Image source={{ uri: item.image }} style={styles.storyImage} />
      </View>
      <Text style={styles.storyUsername}>{item.username}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <View style={[styles.avatar, { backgroundColor: item.color || COLORS.primary }]}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
          <View style={styles.postUserDetails}>
            <Text style={styles.postUsername}>{item.username}</Text>
            <Text style={styles.postTime}>{item.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postText}>{item.text}</Text>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons
            name={item.liked ? "heart" : "heart-outline"}
            size={20}
            color={item.liked ? COLORS.error : COLORS.text}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedPost(item);
            setCommentModalVisible(true);
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color={COLORS.text} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.conversationItem}
      onPress={() => openChat(item)}
    >
      <View style={styles.conversationAvatar}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationUsername}>{item.username}</Text>
          <Text style={styles.conversationTime}>{item.time}</Text>
        </View>
        <Text style={styles.conversationLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>7Ftrends</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowCountrySelector(true)}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setSearchVisible(true)}
            >
              <Ionicons name="search" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setMessageVisible(true)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Country and Hashtag Filters */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              key="all"
              style={[
                styles.filterChip,
                !selectedHashtag && styles.activeFilterChip
              ]}
              onPress={() => setSelectedHashtag(null)}
            >
              <Text style={[
                styles.filterText,
                !selectedHashtag && styles.activeFilterText
              ]}>
                All Posts
              </Text>
            </TouchableOpacity>
            {availableHashtags.map(hashtag => (
              <TouchableOpacity
                key={hashtag}
                style={[
                  styles.filterChip,
                  selectedHashtag === hashtag && styles.activeFilterChip
                ]}
                onPress={() => setSelectedHashtag(hashtag)}
              >
                <Text style={[
                  styles.filterText,
                  selectedHashtag === hashtag && styles.activeFilterText
                ]}>
                  #{hashtag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Stories */}
      <View style={styles.storiesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity style={styles.addStory}>
            <View style={styles.addStoryIcon}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.addStoryText}>Your Story</Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5].map(i => (
            <TouchableOpacity key={i} style={styles.storyItem}>
              <View style={styles.storyRing}>
                <View style={[styles.storyImage, { backgroundColor: COLORS.accent }]}>
                  <Text style={styles.storyAvatar}>👤</Text>
                </View>
              </View>
              <Text style={styles.storyUsername}>User{i}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Posts */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsContainer}
      />

      {/* Create Post Button */}
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => setCreatePostVisible(true)}
      >
        <Ionicons name="add" size={24} color={COLORS.surface} />
      </TouchableOpacity>

      {/* Country Selector Modal */}
      <Modal
        visible={showCountrySelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountrySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.countrySelectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountrySelector(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry.code === item.code && styles.selectedCountry
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountrySelector(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  {selectedCountry.code === item.code && (
                    <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.code}
            />
          </View>
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <TouchableOpacity onPress={() => setSearchVisible(false)}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts, users, hashtags..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                renderItem={renderPost}
                keyExtractor={item => `search-${item.id}`}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Messages Modal */}
      <Modal
        visible={messageVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMessageVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.messagesModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Messages</Text>
              <TouchableOpacity onPress={() => setMessageVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={item => `conv-${item.id}`}
            />
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={chatVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModal}>
            {selectedChat && (
              <>
                <View style={styles.chatHeader}>
                  <TouchableOpacity onPress={() => setChatVisible(false)}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <View style={styles.chatUserInfo}>
                    <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
                      <Text style={styles.avatarText}>{selectedChat.avatar}</Text>
                    </View>
                    <Text style={styles.chatUsername}>{selectedChat.username}</Text>
                  </View>
                </View>
                <FlatList
                  data={selectedChat.messages}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        styles.messageItem,
                        item.sender === 'me' ? styles.myMessage : styles.theirMessage
                      ]}
                    >
                      <Text style={[
                        styles.messageText,
                        item.sender === 'me' ? styles.myMessageText : styles.theirMessageText
                      ]}>
                        {item.text}
                      </Text>
                      <Text style={styles.messageTime}>{item.time}</Text>
                    </View>
                  )}
                  keyExtractor={item => `msg-${item.id}`}
                  style={styles.messagesList}
                />
                <View style={styles.messageInputContainer}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Type a message..."
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendMessage}
                  >
                    <Ionicons name="send" size={20} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Post Modal */}
      <Modal
        visible={createPostVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreatePostVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createPostModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setCreatePostVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.createPostContent}>
              <View style={styles.createPostUserInfo}>
                <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.avatarText}>{user?.avatar || '👤'}</Text>
                </View>
                <Text style={styles.createPostUsername}>{user?.username || 'Anonymous'}</Text>
              </View>
              <TextInput
                style={styles.createPostInput}
                placeholder="Share your fashion thoughts..."
                value={newPostText}
                onChangeText={setNewPostText}
                multiline
              />
              <TouchableOpacity style={styles.addPhotoButton}>
                <Ionicons name="image-outline" size={20} color={COLORS.accent} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createPostSubmitButton, !newPostText.trim() && styles.disabledButton]}
                onPress={handleCreatePost}
                disabled={!newPostText.trim()}
              >
                <Text style={styles.createPostSubmitText}>Share Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {selectedPost && (
              <View style={styles.commentContent}>
                <View style={styles.selectedPost}>
                  <Text style={styles.selectedPostText}>{selectedPost.text}</Text>
                </View>
                <View style={styles.commentList}>
                  {selectedPost.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={[styles.avatar, { backgroundColor: COLORS.secondary }]}>
                        <Text style={styles.avatarText}>{comment.avatar}</Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUsername}>{comment.username}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <TouchableOpacity
                    style={[styles.commentButton, !commentText.trim() && styles.disabledButton]}
                    onPress={() => {
                      if (commentText.trim()) {
                        addComment(selectedPost.id, {
                          id: Date.now(),
                          username: user?.username || 'Anonymous',
                          avatar: user?.avatar || '👤',
                          text: commentText,
                          timestamp: 'Just now'
                        });
                        setCommentText('');
                      }
                    }}
                    disabled={!commentText.trim()}
                  >
                    <Ionicons name="send" size={16} color={COLORS.surface} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles would go here - for now using a minimal set
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: 50,
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
    ...SHADOWS.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  logo: {
    fontSize: FONTS.sizes.xl,
    fontFamily: 'Pacifico_400Regular',
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 20,
  },
  filterContainer: {
    marginTop: SIZES.xs,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: SIZES.sm,
  },
  activeFilterChip: {
    backgroundColor: COLORS.accent,
  },
  filterText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.surface,
    fontFamily: FONTS.medium,
  },
  storiesSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addStory: {
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  addStoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  addStoryText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    fontSize: 24,
  },
  storyUsername: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  postsContainer: {
    padding: SIZES.md,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.md,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.sm,
  },
  avatarText: {
    fontSize: 18,
  },
  postUserDetails: {
    flex: 1,
  },
  postUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  postTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  postText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginBottom: SIZES.md,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: SIZES.sm,
    marginBottom: SIZES.md,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  createPostButton: {
    position: 'absolute',
    bottom: SIZES.lg,
    right: SIZES.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  countrySelectorModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SIZES.lg,
    borderTopRightRadius: SIZES.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedCountry: {
    backgroundColor: COLORS.background,
  },
  countryName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SIZES.md,
    flex: 1,
  },
  searchModal: {
    backgroundColor: COLORS.surface,
    height: '100%',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    marginLeft: SIZES.md,
  },
  messagesModal: {
    backgroundColor: COLORS.surface,
    height: '80%',
    borderTopLeftRadius: SIZES.lg,
    borderTopRightRadius: SIZES.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  conversationTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  conversationLastMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.surface,
    fontFamily: FONTS.bold,
  },
  chatModal: {
    backgroundColor: COLORS.surface,
    height: '100%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZES.md,
  },
  chatUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  messagesList: {
    flex: 1,
    padding: SIZES.md,
  },
  messageItem: {
    marginVertical: SIZES.xs,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
  },
  messageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  myMessageText: {
    color: COLORS.surface,
  },
  theirMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    marginRight: SIZES.sm,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostModal: {
    backgroundColor: COLORS.surface,
    height: '60%',
    borderTopLeftRadius: SIZES.lg,
    borderTopRightRadius: SIZES.lg,
  },
  createPostContent: {
    padding: SIZES.md,
  },
  createPostUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  createPostUsername: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  createPostInput: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    fontSize: FONTS.sizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  addPhotoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.accent,
    marginLeft: SIZES.sm,
  },
  createPostSubmitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.sm,
    padding: SIZES.md,
    alignItems: 'center',
    marginTop: SIZES.md,
  },
  disabledButton: {
    backgroundColor: COLORS.background,
  },
  createPostSubmitText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.medium,
    color: COLORS.surface,
  },
  commentModal: {
    backgroundColor: COLORS.surface,
    height: '80%',
    borderTopLeftRadius: SIZES.lg,
    borderTopRightRadius: SIZES.lg,
  },
  commentContent: {
    flex: 1,
  },
  selectedPost: {
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectedPostText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  commentList: {
    flex: 1,
    padding: SIZES.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: SIZES.md,
  },
  commentContent: {
    flex: 1,
    marginLeft: SIZES.sm,
  },
  commentUsername: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  commentText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginTop: SIZES.xs,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.sm,
    padding: SIZES.sm,
    marginRight: SIZES.sm,
  },
  commentButton: {
    backgroundColor: COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;