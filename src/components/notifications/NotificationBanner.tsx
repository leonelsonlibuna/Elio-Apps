import React from 'react';
import { NotificationItem } from '../../types';
import { Bell, X, Check, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { playNotificationChime } from '../../utils/audio';

interface NotificationBannerProps {
  notifications: NotificationItem[];
  onDismissNotification: (id: string) => void;
  onActionNotification: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismissNotification,
  onActionNotification,
}) => {
  const unreadNotifications = notifications.filter((n) => !n.read);

  if (unreadNotifications.length === 0) return null;

  const topNotif = unreadNotifications[0];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-[28px] bg-zinc-900/70 backdrop-blur-2xl border border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-white/10 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            {topNotif.type === 'urgent' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white truncate">{topNotif.title}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{topNotif.timestamp}</span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5 leading-snug">{topNotif.body}</p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => {
                  onActionNotification(topNotif.id);
                  playNotificationChime('complete');
                }}
                className="px-3 py-1 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[11px] font-medium border border-blue-500/30 transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
              >
                <Check className="w-3 h-3" />
                <span>Mark Acknowledged</span>
              </button>

              <button
                onClick={() => {
                  onDismissNotification(topNotif.id);
                  playNotificationChime('tink');
                }}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[11px] font-medium transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDismissNotification(topNotif.id)}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-full hover:bg-white/5 transition-all"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
