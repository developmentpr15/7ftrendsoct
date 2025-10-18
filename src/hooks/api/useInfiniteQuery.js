import { useState, useCallback, useEffect } from 'react';

export const useInfiniteQuery = (fetchFunction, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { limit = 10 } = options;

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, limit);

      if (result.length === 0 || result.length < limit) {
        setHasMore(false);
      }

      if (page === 1) {
        setData(result);
      } else {
        setData(prev => [...prev, ...result]);
      }

      setPage(prev => prev + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, limit, loading, hasMore, page]);

  const reset = useCallback(() => {
    setData([]);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setPage(1);
  }, []);

  const refetch = useCallback(() => {
    reset();
    fetchMore();
  }, [reset, fetchMore]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    loading,
    error,
    hasMore,
    fetchMore,
    reset,
    refetch,
  };
};

export default useInfiniteQuery;