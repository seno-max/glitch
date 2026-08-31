import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Star, Coffee, Sun, Cookie, Moon, GlassWater, Milk, Pill, Sandwich } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { useMealsForDate, useAddMeal, useDeleteMeal } from '@/hooks/use-nutrition'
import { todayStr, formatDisplayDate } from '@/utils/date'
import type { MealType } from '@/types/database.types'

const MEAL_SECTIONS: { type: MealType; label: string; icon: typeof Coffee }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Coffee },
  { type: 'lunch', label: 'Lunch', icon: Sun },
  { type: 'evening_snack', label: 'Evening Snack', icon: Cookie },
  { type: 'dinner', label: 'Dinner', icon: Moon },
  { type: 'beverage', label: 'Beverages', icon: GlassWater },
  { type: 'protein_shake', label: 'Protein Shake', icon: Milk },
  { type: 'supplement', label: 'Supplements', icon: Pill },
  { type: 'late_night_snack', label: 'Late Night Snack', icon: Sandwich },
]

export default function NutritionPage() {
  const date = todayStr()
  const { data: meals, isLoading } = useMealsForDate(date)
  const addMeal = useAddMeal()
  const deleteMeal = useDeleteMeal()
  const [dialogMealType, setDialogMealType] = useState<MealType | null>(null)
  const [form, setForm] = useState({ name: '', quantity: '', calories: '' })

  const totals = (meals ?? []).reduce(
    (acc, m) => ({ calories: acc.calories + (m.calories ?? 0) }),
    { calories: 0 }
  )

  const resetForm = () => setForm({ name: '', quantity: '', calories: '' })

  const handleAdd = async () => {
    if (!dialogMealType || !form.name.trim()) return
    await addMeal.mutateAsync({
      date,
      meal_type: dialogMealType,
      food_id: null,
      food_name: form.name,
      quantity: form.quantity || null,
      calories: form.calories ? Number(form.calories) : null,
      protein_g: null,
      carbs_g: null,
      fat_g: null,
      fiber_g: null,
      sugar_g: null,
      notes: null,
      logged_at: new Date().toISOString(),
    })
    resetForm()
    setDialogMealType(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <p className="text-sm text-muted-foreground">{formatDisplayDate(date)}</p>
      </div>

      <Card className="gradient-hero text-white">
        <CardContent className="p-6">
          <p className="text-white/50 text-xs mb-1">Calories Today</p>
          <p className="text-3xl font-bold">{Math.round(totals.calories)}</p>
          <p className="text-white/50 text-xs mt-1">Just log what you eat — no need to track protein/carbs/fat.</p>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        {MEAL_SECTIONS.map((section, i) => {
          const sectionMeals = (meals ?? []).filter((m) => m.meal_type === section.type)
          return (
            <motion.div key={section.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <section.icon className="size-4 text-muted-foreground" />
                    {section.label}
                  </CardTitle>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDialogMealType(section.type)}>
                    <Plus className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {isLoading ? (
                    <div className="h-8" />
                  ) : sectionMeals.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No items logged</p>
                  ) : (
                    sectionMeals.map((meal) => (
                      <div key={meal.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium">{meal.food_name}</p>
                          {meal.quantity && <p className="text-xs text-muted-foreground">{meal.quantity}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {meal.calories && <Badge variant="outline">{meal.calories} kcal</Badge>}
                          <button onClick={() => deleteMeal.mutate(meal.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Dialog open={!!dialogMealType} onOpenChange={(open) => !open && setDialogMealType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {MEAL_SECTIONS.find((s) => s.type === dialogMealType)?.label}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <Input placeholder="Food name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Quantity (e.g. 200g, 1 cup)" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            <Input type="number" placeholder="Calories (optional)" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMealType(null)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleAdd} disabled={!form.name.trim() || addMeal.isPending}>
              <Star className="size-4" /> Log Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
