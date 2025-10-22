/**
 * src/components/competitions/CompetitionsScreen.tsx
 *
 * Main competitions screen displaying active competitions
 * Luxury purple (#6a2fb0) and gold (#f2c94c) themed UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';

import { COLORS, SIZES, FONTS, StyleHelpers } from '@/utils/constants';
import { competitionsService, Competition, CompetitionEntry } from '@/services/competitionsService';
import CompetitionCard from './CompetitionCard';
import CreateCompetitionModal from './CreateCompetitionModal';
import CompetitionDetailModal from './CompetitionDetailModal';

const { width: screenWidth } = Dimensions.get('window');

interface CompetitionsScreenProps {
  onCompetitionPress?: (competition: Competition) => void;
  onEntryPress?: (entry: CompetitionEntry) => void;
}

export const CompetitionsScreen: React.FC<CompetitionsScreenProps> = ({
  onCompetitionPress,
  onEntryPress,
}) => {
  // State
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Available countries (in a real app, this would come from user location/settings)
  const availableCountries = [
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CA', name: 'Canada' },
  ];

  // Load competitions
  const loadCompetitions = useCallback(async (country?: string) => {
    try {
      setLoading(true);
      const response = await competitionsService.getActiveCompetitions(country);

      // Filter by search query if provided
      let filteredCompetitions = response.competitions;
      if (searchQuery.trim()) {
        filteredCompetitions = filteredCompetitions.filter(comp =>
          comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.theme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setCompetitions(filteredCompetitions);
    } catch (error) {
      console.error('❌ Failed to load competitions:', error);
      Alert.alert(
        'Error',
        'Failed to load competitions. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    loadCompetitions(selectedCountry || undefined);
  }, [loadCompetitions, selectedCountry]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCompetitions(selectedCountry || undefined);
  }, [loadCompetitions, selectedCountry]);

  // Handle competition press
  const handleCompetitionPress = useCallback((competition: Competition) => {
    setSelectedCompetition(competition);
    setShowDetailModal(true);
    onCompetitionPress?.(competition);
  }, [onCompetitionPress]);

  // Handle competition created
  const handleCompetitionCreated = useCallback((competition: Competition) => {
    setShowCreateModal(false);
    setCompetitions(prev => [competition, ...prev]);
  }, []);

  // Render competition item
  const renderCompetition = useCallback(({ item }: { item: Competition }) => (
    <CompetitionCard
      competition={item}
      onPress={() => handleCompetitionPress(item)}
      onEntryPress={onEntryPress}
    />
  ), [handleCompetitionPress, onEntryPress]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Active Competitions</Text>
      <Text style={styles.emptyStateText}>
        {selectedCountry
          ? `No active competitions in ${availableCountries.find(c => c.code === selectedCountry)?.name}`
          : 'No active competitions right now. Be the first to create one!'}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <AntDesign name="plus" size={20} color="white" />
        <Text style={styles.createButtonText}>Create Competition</Text>
      </TouchableOpacity>
    </View>
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.screenTitle}>Competitions</Text>
      <Text style={styles.screenSubtitle}>
        Enter fashion competitions and win prizes!
      </Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search competitions..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Country Filter */}
      <View style={styles.countryFilterContainer}>
        <Text style={styles.filterLabel}>Country:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.countryScroll}
        >
          <TouchableOpacity
            style={[
              styles.countryChip,
              !selectedCountry && styles.selectedCountryChip,
            ]}
            onPress={() => setSelectedCountry('')}
          >
            <Text style={[
              styles.countryChipText,
              !selectedCountry && styles.selectedCountryChipText,
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {availableCountries.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={[
                styles.countryChip,
                selectedCountry === country.code && styles.selectedCountryChip,
              ]}
              onPress={() => setSelectedCountry(country.code)}
            >
              <Text style={[
                styles.countryChipText,
                selectedCountry === country.code && styles.selectedCountryChipText,
              ]}>
                {country.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Render footer with create button
  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.floatingCreateButton}
        onPress={() => setShowCreateModal(true)}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.createButtonGradient}
        >
          <AntDesign name="plus" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading competitions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={competitions}
        renderItem={renderCompetition}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Competition Modal */}
      <CreateCompetitionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCompetitionCreated}
      />

      {/* Competition Detail Modal */}
      <CompetitionDetailModal
        competition={selectedCompetition}
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCompetition(null);
        }}
        onEntryPress={onEntryPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginTop: SIZES.md,
  },
  header: {
    padding: SIZES.lg,
    paddingBottom: SIZES.sm,
  },
  screenTitle: {
    fontSize: FONTS.sizes.xxl,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginBottom: SIZES.xs,
  },
  screenSubtitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    marginBottom: SIZES.lg,
    lineHeight: FONTS.lineHeight.relaxed,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginBottom: SIZES.lg,
    ...StyleHelpers.createShadow(COLORS.shadow, 1),
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.text,
    marginLeft: SIZES.sm,
  },
  countryFilterContainer: {
    marginBottom: SIZES.sm,
  },
  filterLabel: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  countryScroll: {
    flexDirection: 'row',
  },
  countryChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius.full,
    marginRight: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  selectedCountryChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  countryChipText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.medium,
    color: COLORS.textSecondary,
  },
  selectedCountryChipText: {
    color: 'white',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxl,
    paddingHorizontal: SIZES.xl,
  },
  emptyStateTitle: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONTS.lineHeight.relaxed,
    marginBottom: SIZES.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius.md,
    gap: SIZES.sm,
    ...StyleHelpers.createShadow(COLORS.primary, 2),
  },
  createButtonText: {
    fontSize: FONTS.sizes.md,
    fontFamily: FONTS.families.primary,
    fontWeight: FONTS.weight.semibold,
    color: 'white',
  },
  footer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCreateButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...StyleHelpers.createShadow(COLORS.primary, 4),
  },
  createButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CompetitionsScreen;