/**
 * Component export index for organized imports
 * Centralizes all component exports for clean imports
 */

// UI Components
export { default as Button } from './ui/Button';
export { default as Input } from './ui/Input';
export { default as Card } from './ui/Card';
export { default as Loading } from './ui/Loading';
export { default as ConnectionStatus } from './ui/ConnectionStatus';
export { default as UIErrorBoundary } from './ui/ErrorBoundary';

// Feed Components
export { default as PostCard } from './feed/PostCard';
export { default as OptimizedPostCard } from './feed/OptimizedPostCard';
export { default as SkeletonLoader } from './feed/SkeletonLoader';

// Competition Components
export { default as CompetitionLeaderboard } from './competition/CompetitionLeaderboard';
export { default as HeartVoteButton } from './competition/HeartVoteButton';
export { default as WinnerAnnouncement } from './competition/WinnerAnnouncement';

// Auth Components
export { default as OnboardingFlow } from './auth/OnboardingFlow';
export { default as SocialAuthScreen } from './auth/SocialAuthScreen';

// Wardrobe Components
export { default as AIStatusIndicator } from './wardrobe/AIStatusIndicator';
export { default as AITaggingPanel } from './wardrobe/AITaggingPanel';

// Social Components
export { default as FriendshipStatus } from './social/FriendshipStatus';

// Error Handling
export { default as ErrorBoundary } from './ErrorBoundary';

// Realtime Components
export { default as RealtimeConnectionStatus } from './ui/RealtimeConnectionStatus';
export { default as RealtimeNotifications } from './ui/RealtimeNotifications';