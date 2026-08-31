import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Calendar,
  Droplets,
  Scale,
  Trophy,
  Target,
  Camera,
  Moon,
  Smile,
  Footprints,
  Ruler,
  FileText,
  Sun,
  MoonStar,
  Monitor,
  Bell,
  Menu,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useState } from 'react'

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/nutrition', icon: UtensilsCrossed, label: 'Nutrition' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const trackingNav = [
  { to: '/tracking/water', icon: Droplets, label: 'Water' },
  { to: '/tracking/weight', icon: Scale, label: 'Weight' },
  { to: '/tracking/steps', icon: Footprints, label: 'Steps' },
  { to: '/tracking/sleep', icon: Moon, label: 'Sleep' },
  { to: '/tracking/mood', icon: Smile, label: 'Mood' },
  { to: '/tracking/measurements', icon: Ruler, label: 'Measurements' },
  { to: '/tracking/photos', icon: Camera, label: 'Photos' },
]

const gamificationNav = [
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/challenges', icon: Target, label: 'Challenges' },
  { to: '/personal-records', icon: Trophy, label: 'Records' },
  { to: '/reports', icon: FileText, label: 'Reports' },
]

const bottomNav = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/nutrition', icon: UtensilsCrossed, label: 'Food' },
  { to: '/analytics', icon: BarChart3, label: 'Stats' },
]

function ThemeToggle() {
  const { theme, setTheme } = useUIStore()
  const icons = { light: Sun, dark: MoonStar, system: Monitor } as const
  const order: (keyof typeof icons)[] = ['light', 'dark', 'system']
  const Icon = icons[theme]

  return (
    <button
      onClick={() => setTheme(order[(order.indexOf(theme) + 1) % order.length])}
      className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
      title={`Theme: ${theme}`}
    >
      <Icon className="size-4" />
    </button>
  )
}

function SidebarLink({ to, icon: Icon, label }: { to: string; icon: typeof Dumbbell; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          isActive ? 'gradient-primary text-white shadow-glow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <Icon className="size-[18px] shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{children}</p>
}

export function AppShell() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl z-30">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <Dumbbell className="size-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">FitTrack</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-hide">
          {mainNav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
          <SectionLabel>Tracking</SectionLabel>
          {trackingNav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
          <SectionLabel>Progress</SectionLabel>
          {gamificationNav.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
          <SectionLabel>Account</SectionLabel>
          <SidebarLink to="/settings" icon={Settings} label="Settings" />
        </nav>
        <div className="border-t border-border p-3">
          <NavLink to="/profile" className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted transition-colors">
            <Avatar src={profile?.avatar_url} fallback={profile?.full_name ?? 'U'} size={36} />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.full_name ?? 'Athlete'}</p>
              <p className="text-xs text-muted-foreground">Level {profile?.level ?? 1}</p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-card/80 backdrop-blur-xl">
        <button onClick={() => setMobileMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted">
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
            <Dumbbell className="size-4 text-white" />
          </div>
          <span className="font-bold">FitTrack</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted">
            <Bell className="size-4" />
          </button>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-20 items-center justify-end h-16 px-6 border-b border-border bg-background/60 backdrop-blur-xl gap-2">
        <ThemeToggle />
        <button className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted relative">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
      </header>

      {/* Mobile slide-in menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card p-4 overflow-y-auto"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className="flex items-center gap-2.5 mb-4 px-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
                  <Dumbbell className="size-5 text-white" />
                </div>
                <span className="font-bold text-lg">FitTrack</span>
              </div>
              <div onClick={() => setMobileMenuOpen(false)}>
                {mainNav.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
                <SectionLabel>Tracking</SectionLabel>
                {trackingNav.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
                <SectionLabel>Progress</SectionLabel>
                {gamificationNav.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
                <SectionLabel>Account</SectionLabel>
                <SidebarLink to="/settings" icon={Settings} label="Settings" />
                <SidebarLink to="/profile" icon={User} label="Profile" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 pb-20 lg:pb-6 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-6 max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around h-16 border-t border-border bg-card/90 backdrop-blur-xl px-2">
        {bottomNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-5 transition-transform', isActive && 'scale-110')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
