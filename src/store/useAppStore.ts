import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Project } from '@/types'

interface AppStore {
  user: User | null
  currentProject: Project | null
  theme: 'dark' | 'light'
  sidebarOpen: boolean
  propertiesPanelOpen: boolean

  setUser: (user: User | null) => void
  setCurrentProject: (project: Project | null) => void
  setTheme: (theme: 'dark' | 'light') => void
  toggleSidebar: () => void
  togglePropertiesPanel: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      currentProject: null,
      theme: 'dark',
      sidebarOpen: true,
      propertiesPanelOpen: true,

      setUser: (user) => set({ user }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      togglePropertiesPanel: () => set((s) => ({ propertiesPanelOpen: !s.propertiesPanelOpen })),
    }),
    {
      name: 'graphify-app',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
