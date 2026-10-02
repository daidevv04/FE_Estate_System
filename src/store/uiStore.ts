import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
}

const KEY = 'dxmt.sidebarCollapsed'

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: localStorage.getItem(KEY) === '1',
  toggleSidebar: () =>
    set((s) => {
      localStorage.setItem(KEY, s.sidebarCollapsed ? '0' : '1')
      return { sidebarCollapsed: !s.sidebarCollapsed }
    }),
  setSidebarCollapsed: (v) => {
    localStorage.setItem(KEY, v ? '1' : '0')
    set({ sidebarCollapsed: v })
  },
}))
