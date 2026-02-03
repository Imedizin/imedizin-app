import { create } from "zustand";

interface MailboxState {
  selectedMailboxId: string | null;
  setSelectedMailboxId: (id: string | null) => void;
  lastUpdateAt: number | null;
  setLastUpdateAt: (timestamp: number | null) => void;
}

export const useMailboxStore = create<MailboxState>((set) => ({
  selectedMailboxId: null,
  setSelectedMailboxId: (id) => set({ selectedMailboxId: id }),
  lastUpdateAt: null,
  setLastUpdateAt: (timestamp) => set({ lastUpdateAt: timestamp }),
}));
