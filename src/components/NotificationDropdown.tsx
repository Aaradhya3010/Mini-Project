import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        aria-label="View notifications"
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-indigo-600 rounded-full tabular-nums">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs text-indigo-700 font-medium tabular-nums">
                  ({unreadCount} new)
                </span>
              )}
            </div>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer ${
                    n.is_read
                      ? 'bg-white text-slate-600 hover:bg-slate-50'
                      : 'bg-indigo-50/50 text-slate-900 font-medium hover:bg-indigo-50/80'
                  }`}
                >
                  <p className="leading-relaxed">{n.message}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="tabular-nums">{formatTime(n.created_at)}</span>
                    {!n.is_read && (
                      <span className="text-indigo-600 font-semibold">Unread</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
