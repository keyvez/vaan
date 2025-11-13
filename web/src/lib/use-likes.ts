import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './auth-context';

const LIKES_STORAGE_KEY = 'vaan_baby_name_likes';

interface LikeData {
  [nameId: string]: boolean;
}

export function useLikes() {
  const { isAuthenticated, user } = useAuth();
  const [likes, setLikes] = useState<LikeData>(() => {
    try {
      const stored = localStorage.getItem(LIKES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  // Save likes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
  }, [likes]);

  const toggleLike = useCallback(
    (nameId: string) => {
      console.log('toggleLike called', { nameId, isAuthenticated });
      if (!isAuthenticated) {
        console.log('Setting showSignInDialog to true');
        setShowSignInDialog(true);
        return;
      }

      setLikes((prev) => {
        const newLikes = { ...prev };
        if (newLikes[nameId]) {
          delete newLikes[nameId];
        } else {
          newLikes[nameId] = true;
        }
        return newLikes;
      });
    },
    [isAuthenticated]
  );

  const isLiked = useCallback(
    (nameId: string) => {
      return !!likes[nameId];
    },
    [likes]
  );

  const getLikedNames = useCallback(() => {
    return Object.keys(likes).filter((nameId) => likes[nameId]);
  }, [likes]);

  const getLikeCount = useCallback(
    (nameId: string) => {
      return isLiked(nameId) ? 1 : 0;
    },
    [isLiked]
  );

  return {
    likes,
    toggleLike,
    isLiked,
    getLikedNames,
    getLikeCount,
    showSignInDialog,
    setShowSignInDialog,
  };
}
