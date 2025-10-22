/**
 * Screen Wrappers for 7Ftrends
 * Provides consistent error handling, loading states, and fallbacks for screens
 */

import React, { useState, useEffect } from 'react';
import { View, RefreshControl, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ErrorState, LoadingState, EmptyState, BrandedButton } from './BrandedComponents';

// Higher-order component for error handling
export const withErrorHandling = (WrappedComponent) => {
  return (props) => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { colors } = useTheme();

    const handleError = (error) => {
      console.error('Screen Error:', error);
      setError(error);
      setLoading(false);
    };

    const handleRetry = () => {
      setError(null);
      setLoading(true);
      // Component will handle retry logic
    };

    if (error) {
      return (
        <ErrorState
          title={error.message || 'Something went wrong'}
          subtitle={error.details || 'Please try again later'}
          onRetry={handleRetry}
        />
      );
    }

    if (loading) {
      return <LoadingState />;
    }

    return (
      <WrappedComponent
        {...props}
        onError={handleError}
        setLoading={setLoading}
      />
    );
  };
};

// Refreshable Screen Wrapper
export const RefreshableScreen = ({
  children,
  onRefresh,
  refreshing = false,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.background.primary }, style]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// Safe Data Renderer - handles null/undefined data gracefully
export const SafeDataRenderer = ({
  data,
  renderItem,
  renderEmpty,
  renderLoading,
  isLoading,
  error,
  onRetry,
  fallbackMessage = 'No data available',
  style,
}) => {
  const { colors } = useTheme();

  if (isLoading) {
    return renderLoading ? renderLoading() : <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        subtitle={error.message || 'Please try again'}
        onRetry={onRetry}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return renderEmpty ? (
      renderEmpty()
    ) : (
      <EmptyState
        title={fallbackMessage}
        subtitle="There's nothing to show here right now"
        action={
          onRetry && (
            <BrandedButton
              title="Refresh"
              variant="secondary"
              onPress={onRetry}
            />
          )
        }
      />
    );
  }

  if (Array.isArray(data)) {
    return (
      <View style={style}>
        {data.map((item, index) => renderItem(item, index))}
      </View>
    );
  }

  return (
    <View style={style}>
      {renderItem(data, 0)}
    </View>
  );
};

// API Screen Wrapper - handles API calls with loading/error states
export const APIScreen = ({
  fetchFunction,
  dependencies = [],
  renderItem,
  renderEmpty,
  emptyMessage,
  refreshable = true,
  style,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { colors } = useTheme();

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const handleRefresh = () => {
    fetchData(true);
  };

  const Content = () => (
    <SafeDataRenderer
      data={data}
      renderItem={renderItem}
      renderEmpty={renderEmpty}
      isLoading={loading && !data}
      error={error}
      onRetry={handleRefresh}
      fallbackMessage={emptyMessage}
    />
  );

  if (refreshable) {
    return (
      <RefreshableScreen
        onRefresh={handleRefresh}
        refreshing={refreshing}
        style={style}
      >
        <Content />
      </RefreshableScreen>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background.primary }, style]}>
      <Content />
    </View>
  );
};

// List Screen Wrapper - optimized for lists with pagination
export const ListScreen = ({
  fetchFunction,
  renderItem,
  ListHeaderComponent,
  ListFooterComponent,
  emptyMessage = 'No items found',
  style,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const { colors } = useTheme();

  const fetchData = async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetchFunction({
        offset: isLoadMore ? data.length : 0,
        limit: 20,
      });

      if (isLoadMore) {
        setData(prev => [...prev, ...result.data]);
        setHasMore(result.data.length > 0);
      } else {
        setData(result.data);
        setHasMore(result.data.length > 0);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchData(false, true);
    }
  };

  const renderListFooter = () => {
    if (loadingMore) {
      return (
        <View style={{ padding: 20 }}>
          <LoadingState title="Loading more..." />
        </View>
      );
    }

    if (!hasMore && data.length > 0) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.text.secondary }}>
            End of results
          </Text>
        </View>
      );
    }

    return ListFooterComponent?.() || null;
  };

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  if (error && data.length === 0) {
    return (
      <ErrorState
        title="Failed to load data"
        subtitle={error.message || 'Please try again'}
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <RefreshableScreen
      onRefresh={handleRefresh}
      refreshing={refreshing}
      style={style}
    >
      {ListHeaderComponent?.()}

      {data.length === 0 ? (
        <EmptyState
          title={emptyMessage}
          action={
            <BrandedButton
              title="Refresh"
              variant="secondary"
              onPress={handleRefresh}
            />
          }
        />
      ) : (
        <>
          {data.map((item, index) => renderItem(item, index))}
          {renderListFooter()}
        </>
      )}
    </RefreshableScreen>
  );
};

// Form Screen Wrapper - handles form submissions with validation
export const FormScreen = ({
  initialValues,
  validationSchema,
  onSubmit,
  children,
  loading = false,
  error = null,
  style,
}) => {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { colors } = useTheme();

  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const setError = (field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const setFieldTouched = (field, touched = true) => {
    setTouched(prev => ({ ...prev, [field]: touched }));
  };

  const validateField = (field, value) => {
    if (validationSchema?.[field]) {
      const schema = validationSchema[field];
      if (schema.required && (!value || value.toString().trim() === '')) {
        return schema.errorMessage || `${field} is required`;
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        return schema.errorMessage || `${field} is invalid`;
      }
      if (schema.minLength && value.length < schema.minLength) {
        return `${field} must be at least ${schema.minLength} characters`;
      }
      if (schema.maxLength && value.length > schema.maxLength) {
        return `${field} must be no more than ${schema.maxLength} characters`;
      }
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(values).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (err) {
        // Error is handled by parent component
      }
    }
  };

  const formContext = {
    values,
    errors,
    touched,
    setValue,
    setError,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background.primary }, style]}>
      {typeof children === 'function' ? children(formContext) : children}
    </View>
  );
};

export default {
  withErrorHandling,
  RefreshableScreen,
  SafeDataRenderer,
  APIScreen,
  ListScreen,
  FormScreen,
};