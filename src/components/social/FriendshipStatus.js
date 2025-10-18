import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriendship } from '../../hooks/social/useFriendship';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../utils/constants';

const FriendshipStatus = ({
  currentUserId,
  targetUserId,
  targetUsername,
  style,
  showMutualFriendsCount = false
}) => {
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    sendFollowRequest,
    acceptFriendRequest,
    declineFollowRequest,
    unfollowUser,
    cancelFollowRequest,
    getFriendshipStatus
  } = useFriendship(currentUserId);

  useEffect(() => {
    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      fetchFriendshipStatus();
    }
  }, [currentUserId, targetUserId]);

  const fetchFriendshipStatus = async () => {
    try {
      const status = await getFriendshipStatus(targetUserId);
      setFriendshipStatus(status);
    } catch (error) {
      console.error('Error fetching friendship status:', error);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || !targetUserId) return;

    setLoading(true);
    try {
      const result = await sendFollowRequest(targetUserId);
      if (result.success) {
        setFriendshipStatus({
          status: 'request_sent',
          direction: 'outgoing',
          is_mutual: false
        });
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send follow request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!friendshipStatus) return;

    setLoading(true);
    try {
      const result = await acceptFriendRequest(targetUserId);
      if (result.success) {
        setFriendshipStatus({
          status: 'mutual_friends',
          direction: 'mutual',
          is_mutual: true
        });
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!friendshipStatus) return;

    setLoading(true);
    try {
      const result = await declineFollowRequest(targetUserId);
      if (result.success) {
        setFriendshipStatus({
          status: 'none',
          direction: 'none',
          is_mutual: false
        });
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline request');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    Alert.alert(
      'Unfollow User',
      `Are you sure you want to unfollow ${targetUsername || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await unfollowUser(targetUserId);
              if (result.success) {
                setFriendshipStatus({
                  status: 'none',
                  direction: 'none',
                  is_mutual: false
                });
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unfollow');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    try {
      const result = await cancelFollowRequest(targetUserId);
      if (result.success) {
        setFriendshipStatus({
          status: 'none',
          direction: 'none',
          is_mutual: false
        });
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusButton = () => {
    if (!currentUserId || currentUserId === targetUserId) {
      return null;
    }

    if (loading) {
      return (
        <View style={[styles.button, styles.loadingButton]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!friendshipStatus) {
      return (
        <TouchableOpacity style={[styles.button, styles.followButton]} onPress={handleFollow}>
          <Ionicons name="person-add" size={16} color={COLORS.surface} />
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity>
      );
    }

    const { status, direction, is_mutual } = friendshipStatus;

    // Mutual Friends - highest priority
    if (is_mutual) {
      return (
        <View style={styles.mutualFriendsContainer}>
          <View style={styles.mutualFriendsIndicator}>
            <Ionicons name="people" size={14} color={COLORS.success} />
            <Text style={styles.mutualFriendsText}>Mutual Friends</Text>
          </View>
          <TouchableOpacity style={[styles.button, styles.followingButton]} onPress={handleUnfollow}>
            <Ionicons name="person-remove" size={16} color={COLORS.text} />
            <Text style={styles.followingText}>Unfollow</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Request Received
    if (status === 'request_received' || direction === 'incoming') {
      return (
        <View style={styles.requestContainer}>
          <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
            <Ionicons name="checkmark" size={16} color={COLORS.surface} />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={handleDecline}>
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Request Sent
    if (status === 'request_sent' || direction === 'outgoing') {
      return (
        <TouchableOpacity style={[styles.button, styles.pendingButton]} onPress={handleCancelRequest}>
          <Ionicons name="time" size={16} color={COLORS.textSecondary} />
          <Text style={styles.pendingText}>Request Sent</Text>
        </TouchableOpacity>
      );
    }

    // Following (one-way)
    if (status === 'following' || status === 'followed_by') {
      return (
        <View style={styles.followingContainer}>
          <View style={styles.followingIndicator}>
            <Ionicons
              name={status === 'following' ? "arrow-forward" : "arrow-back"}
              size={12}
              color={COLORS.textSecondary}
            />
            <Text style={styles.followingStatusText}>
              {status === 'following' ? 'Following' : 'Follows You'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.button, styles.followingButton]} onPress={handleUnfollow}>
            <Ionicons name="person-remove" size={16} color={COLORS.text} />
            <Text style={styles.followingText}>Unfollow</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // No relationship - can follow
    return (
      <TouchableOpacity style={[styles.button, styles.followButton]} onPress={handleFollow}>
        <Ionicons name="person-add" size={16} color={COLORS.surface} />
        <Text style={styles.followText}>Follow</Text>
      </TouchableOpacity>
    );
  };

  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {renderStatusButton()}
    </View>
  );
};

const styles = {
  container: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: 20,
    gap: SIZES.base / 2,
    minWidth: 100,
    ...SHADOWS.small,
  },
  followButton: {
    backgroundColor: COLORS.accent,
  },
  followingButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingButton: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
    fontFamily: 'System',
  },
  followingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'System',
  },
  acceptText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
    fontFamily: 'System',
  },
  declineText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  mutualFriendsContainer: {
    alignItems: 'center',
    gap: SIZES.base / 2,
  },
  mutualFriendsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base / 3,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SIZES.base / 2,
    paddingVertical: SIZES.base / 3,
    borderRadius: 12,
  },
  mutualFriendsText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    fontFamily: 'System',
  },
  followingContainer: {
    alignItems: 'center',
    gap: SIZES.base / 2,
  },
  followingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base / 3,
    backgroundColor: COLORS.light,
    paddingHorizontal: SIZES.base / 2,
    paddingVertical: SIZES.base / 3,
    borderRadius: 12,
  },
  followingStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  requestContainer: {
    flexDirection: 'row',
    gap: SIZES.base / 2,
  },
};

export default FriendshipStatus;