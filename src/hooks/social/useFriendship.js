import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export const useFriendship = (currentUserId) => {
  const [friendships, setFriendships] = useState([]);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get friendship status between current user and target user
  const getFriendshipStatus = async (targetUserId) => {
    try {
      const { data, error } = await supabase.rpc('get_friendship_status', {
        current_user_id: currentUserId,
        target_user_id: targetUserId
      });

      if (error) throw error;
      return data[0] || { status: 'none', direction: 'none', is_mutual: false };
    } catch (err) {
      console.error('Error getting friendship status:', err);
      return { status: 'none', direction: 'none', is_mutual: false };
    }
  };

  // Check if two users are mutual friends
  const areMutualFriends = async (userA, userB) => {
    try {
      const { data, error } = await supabase.rpc('are_mutual_friends', {
        user_a: userA,
        user_b: userB
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking mutual friends:', err);
      return false;
    }
  };

  // Get mutual friends for current user
  const fetchMutualFriends = async (limit = 50, offset = 0) => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_mutual_friends', {
        current_user_id: currentUserId,
        limit_count: limit,
        offset_count: offset
      });

      if (error) throw error;
      setMutualFriends(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get friend suggestions for current user
  const fetchFriendSuggestions = async (limit = 15) => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase.rpc('get_friend_suggestions', {
        current_user_id: currentUserId,
        limit_count: limit
      });

      if (error) throw error;
      setFriendSuggestions(data || []);
    } catch (err) {
      console.error('Error fetching friend suggestions:', err);
    }
  };

  // Send follow request
  const sendFollowRequest = async (targetUserId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error sending follow request:', err);
      return { success: false, error: err.message };
    }
  };

  // Accept friend request (creates mutual follow)
  const acceptFriendRequest = async (fromUserId) => {
    try {
      const { data, error } = await supabase.rpc('accept_friend_request', {
        from_user_id: fromUserId,
        to_user_id: currentUserId
      });

      if (error) throw error;

      // Refresh mutual friends after accepting request
      await fetchMutualFriends();
      return { success: true, mutual: data };
    } catch (err) {
      console.error('Error accepting friend request:', err);
      return { success: false, error: err.message };
    }
  };

  // Decline follow request
  const declineFollowRequest = async (fromUserId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'declined' })
        .eq('follower_id', fromUserId)
        .eq('following_id', currentUserId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error declining follow request:', err);
      return { success: false, error: err.message };
    }
  };

  // Unfollow user
  const unfollowUser = async (targetUserId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;

      // Refresh mutual friends after unfollowing
      await fetchMutualFriends();
      return { success: true };
    } catch (err) {
      console.error('Error unfollowing user:', err);
      return { success: false, error: err.message };
    }
  };

  // Cancel follow request
  const cancelFollowRequest = async (targetUserId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error canceling follow request:', err);
      return { success: false, error: err.message };
    }
  };

  // Get pending follow requests (incoming)
  const getPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          follower:profiles!follows_follower_id_fkey (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('following_id', currentUserId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting pending requests:', err);
      return [];
    }
  };

  // Get sent follow requests (outgoing)
  const getSentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          following:profiles!follows_following_id_fkey (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('follower_id', currentUserId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error getting sent requests:', err);
      return [];
    }
  };

  // Real-time subscription for follow updates
  const subscribeToFollowUpdates = () => {
    if (!currentUserId) return;

    const subscription = supabase
      .channel('follows_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${currentUserId}`
        },
        (payload) => {
          // Refresh data when follow status changes
          fetchMutualFriends();
          fetchFriendSuggestions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Initialize data and subscribe to updates
  useEffect(() => {
    if (currentUserId) {
      fetchMutualFriends();
      fetchFriendSuggestions();

      const unsubscribe = subscribeToFollowUpdates();
      return unsubscribe;
    }
  }, [currentUserId]);

  return {
    // State
    friendships,
    mutualFriends,
    friendSuggestions,
    loading,
    error,

    // Actions
    getFriendshipStatus,
    areMutualFriends,
    fetchMutualFriends,
    fetchFriendSuggestions,
    sendFollowRequest,
    acceptFriendRequest,
    declineFollowRequest,
    unfollowUser,
    cancelFollowRequest,
    getPendingRequests,
    getSentRequests,
    subscribeToFollowUpdates,
  };
};