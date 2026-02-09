import { create } from 'zustand'

export type ArtifactView = null | 'outline' | 'draft' | 'review' | 'export'

interface NavigationStore {
  sidebarCollapsed: boolean
  activeArtifact: ArtifactView

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveArtifact: (artifact: ArtifactView) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  sidebarCollapsed: false,
  activeArtifact: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveArtifact: (artifact) => set({ activeArtifact: artifact }),
}))
