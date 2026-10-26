import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Dumbbell, Flame, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { exerciseLibraryService } from '@/services/exercise-library.service'
import { useAuthStore } from '@/stores/auth.store'
import type { EquipmentType } from '@/types/database.types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Full Body', 'Hips', 'Cardio']
const EQUIPMENT: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other']
const CATEGORIES = ['Cardio', 'HIIT', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Full Body', 'Yoga', 'Mobility']

export default function ExerciseLibraryPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [category, setCategory] = useState('')
  const [cardioOnly, setCardioOnly] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['exercise-library', search, muscle, equipment, category, cardioOnly],
    queryFn: () =>
      exerciseLibraryService.search(search, {
        muscle: muscle || undefined,
        equipment: equipment || undefined,
        categories: cardioOnly ? ['Cardio', 'HIIT'] : undefined,
        category: !cardioOnly ? category || undefined : undefined,
      }),
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await exerciseLibraryService.deleteCustom(deleteTarget.id)
      queryClient.invalidateQueries({ queryKey: ['exercise-library'] })
      toast.success(`"${deleteTarget.name}" deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete exercise')
    }
    setDeleteTarget(null)
  }

  const toggleCardio = () => {
    setCardioOnly((v) => !v)
    setCategory('')
  }

  const selectCategory = (c: string) => {
    setCardioOnly(false)
    setCategory((prev) => (prev === c ? '' : c))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exercise Library</h1>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={!cardioOnly && !category ? 'gradient' : 'outline'} onClick={() => { setCardioOnly(false); setCategory('') }}>
          All
        </Button>
        <Button type="button" size="sm" variant={cardioOnly ? 'gradient' : 'outline'} onClick={toggleCardio} className="gap-1.5">
          <Flame className="size-3.5" /> Cardio &amp; HIIT (weight loss)
        </Button>
        {CATEGORIES.filter((c) => c !== 'Cardio' && c !== 'HIIT').map((c) => (
          <Button key={c} type="button" size="sm" variant={!cardioOnly && category === c ? 'gradient' : 'outline'} onClick={() => selectCategory(c)}>
            {c}
          </Button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="sm:max-w-[160px]">
          <option value="">All Muscles</option>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="sm:max-w-[160px]">
          <option value="">All Equipment</option>
          {EQUIPMENT.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((ex) => (
            <Card key={ex.id} className="card-hover cursor-pointer relative" onClick={() => navigate(`/workout/exercises/${encodeURIComponent(ex.name)}`)}>
              {user && ex.is_custom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget({ id: ex.id, name: ex.name })
                  }}
                  className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
                  title="Delete custom exercise"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold">{ex.name}</p>
                  <Badge variant="outline">{ex.difficulty}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={cn((ex.category === 'Cardio' || ex.category === 'HIIT') && 'gradient-fire border-0 text-white')}>
                    {ex.category === 'HIIT' ? 'HIIT Cardio' : ex.category || ex.target_muscle}
                  </Badge>
                  <Badge variant="secondary">{ex.equipment}</Badge>
                </div>
                {ex.instructions && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.instructions}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Dumbbell} title="No exercises found" description="Try a different search or filter." />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this custom exercise?"
        description={deleteTarget ? `"${deleteTarget.name}" will be removed from your library. Workouts that already logged it are unaffected.` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}
