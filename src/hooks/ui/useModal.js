import { useState, useCallback } from 'react';

export const useModal = (initialState = false) => {
  const [visible, setVisible] = useState(initialState);
  const [data, setData] = useState(null);

  const showModal = useCallback((modalData = null) => {
    setData(modalData);
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
    setData(null);
  }, []);

  const toggleModal = useCallback(() => {
    setVisible(prev => !prev);
    if (visible) {
      setData(null);
    }
  }, [visible]);

  return {
    visible,
    data,
    showModal,
    hideModal,
    toggleModal,
  };
};

export default useModal;