import { create } from "zustand";
import type { NavSection, ModalState } from "../types";

interface UIState {
  // Navigation
  activeSection: NavSection;

  // Window modes
  isFloating: boolean;
  sidebarCollapsed: boolean;

  // Modals
  modal: ModalState;

  // Actions
  setActiveSection: (s: NavSection) => void;
  setFloating: (v: boolean) => void;
  toggleFloating: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: "today",
  isFloating: false,
  sidebarCollapsed: false,
  modal: { type: null },

  setActiveSection: (activeSection) => set({ activeSection }),
  setFloating: (isFloating) => set({ isFloating }),
  toggleFloating: () => set((s) => ({ isFloating: !s.isFloating })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: { type: null } }),
}));
