import { NavLink } from 'react-router-dom'
import { Droplets, Scale, Footprints, Moon, Smile, Ruler, Camera, Trophy, Target, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Each shortcut gets its own signature gradient — mirrors the colorful,
// per-category tile pattern used by apps like Apple Fitness / Google Fit
// (blue for hydration, orange for steps, indigo for sleep, gold for
// achievements, etc.) instead of one flat muted icon color for everything.
const features = [
  { to: '/tracking/water', icon: Droplets, label: 'Water', gradient: 'from-sky-400 to-blue-600', glow: 'shadow-sky-500/30' },
  { to: '/tracking/weight', icon: Scale, label: 'Weight', gradient: 'from-violet-400 to-purple-600', glow: 'shadow-violet-500/30' },
  { to: '/tracking/steps', icon: Footprints, label: 'Steps', gradient: 'from-orange-400 to-pink-500', glow: 'shadow-orange-500/30' },
  { to: '/tracking/sleep', icon: Moon, label: 'Sleep', gradient: 'from-indigo-400 to-indigo-700', glow: 'shadow-indigo-500/30' },
  { to: '/tracking/mood', icon: Smile, label: 'Mood', gradient: 'from-pink-400 to-rose-500', glow: 'shadow-pink-500/30' },
  { to: '/tracking/measurements', icon: Ruler, label: 'Measurements', gradient: 'from-teal-400 to-emerald-600', glow: 'shadow-teal-500/30' },
  { to: '/tracking/photos', icon: Camera, label: 'Photos', gradient: 'from-fuchsia-400 to-purple-600', glow: 'shadow-fuchsia-500/30' },
  { to: '/achievements', icon: Trophy, label: 'Achievements', gradient: 'from-amber-400 to-yellow-500', glow: 'shadow-amber-500/30' },
  { to: '/challenges', icon: Target, label: 'Challenges', gradient: 'from-red-400 to-rose-600', glow: 'shadow-red-500/30' },
  { to: '/personal-records', icon: Trophy, label: 'Records', gradient: 'from-cyan-400 to-teal-600', glow: 'shadow-cyan-500/30' },
  { to: '/reports', icon: FileText, label: 'Reports', gradient: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/30' },
]

export function MoreFeaturesGrid() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>More</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {features.map((f) => (
            <NavLink
              key={f.to}
              to={f.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-2 rounded-2xl p-3 transition-all hover:-translate-y-0.5 hover:bg-muted/60',
                  isActive && 'bg-muted/60'
                )
              }
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-105',
                  f.gradient,
                  f.glow
                )}
              >
                <f.icon className="size-5 text-white" strokeWidth={2.25} />
              </div>
              <span className="text-xs font-medium text-center text-foreground/80">{f.label}</span>
            </NavLink>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
