import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore polling errors
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
      const count = data.filter((n) => !n.is_read).length;
      setUnreadCount(count);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Polling unread count every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};
