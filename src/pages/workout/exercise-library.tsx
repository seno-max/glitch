import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Dumbbell, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { exerciseLibraryService } from '@/services/exercise-library.service'
import type { EquipmentType } from '@/types/database.types'
import { cn } from '@/lib/utils'

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Full Body', 'Hips', 'Cardio']
const EQUIPMENT: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other']
const CATEGORIES = ['Cardio', 'HIIT', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core', 'Full Body', 'Yoga', 'Mobility']

export default function ExerciseLibraryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [category, setCategory] = useState('')
  const [cardioOnly, setCardioOnly] = useState(false)

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
            <Card key={ex.id} className="card-hover cursor-pointer" onClick={() => navigate(`/workout/exercises/${encodeURIComponent(ex.name)}`)}>
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
    </div>
  )
}
