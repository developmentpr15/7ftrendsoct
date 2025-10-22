import { useState, useCallback } from 'react';

export const useSearch = (data) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    if (!Array.isArray(data)) {
      setSearchResults([]);
      return;
    }

      const filtered = Array.isArray(data) ? data.filter(item =>
      item.username?.toLowerCase().includes(query.toLowerCase()) ||
      item.outfit?.toLowerCase().includes(query.toLowerCase()) ||
      item.items?.some(item => item.toLowerCase().includes(query.toLowerCase()))
    ) : [];
    setSearchResults(filtered);
  }, [data]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    searchResults,
    handleSearch,
    clearSearch
  };
};