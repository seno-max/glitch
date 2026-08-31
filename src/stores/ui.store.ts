import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, UnitSystem } from '@/types/database.types'

interface UIState {
  theme: Theme
  unitSystem: UnitSystem
  sidebarOpen: boolean
  setTheme: (theme: Theme) => void
  setUnitSystem: (unit: UnitSystem) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  resolvedTheme: () => 'light' | 'dark'
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      unitSystem: 'metric',
      sidebarOpen: true,
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
      setUnitSystem: (unitSystem) => set({ unitSystem }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      resolvedTheme: () => {
        const theme = get().theme
        return theme === 'system' ? getSystemTheme() : theme
      },
    }),
    { name: 'fitness-ui-store' }
  )
)

export function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}
