import { create } from "zustand";

export type PanelNotificationType = "new_email" | "sync_completed";

export interface PanelNotification {
  id: string;
  type: PanelNotificationType;
  title: string;
  description: string;
  from: { name: string; emailAddress?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface NotificationState {
  notifications: PanelNotification[];
  addNotification: (notification: Omit<PanelNotification, "id">) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `notif-${Date.now()}-${idCounter}`;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: nextId(),
        },
        ...state.notifications,
      ].slice(0, 100),
    })),
  clearAll: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.length,
}));
