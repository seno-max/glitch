import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { nutritionService } from '@/services/nutrition.service'
import { updateStreak, awardDailyPoints } from '@/services/scoring.engine'
import type { Meal, MealType } from '@/types/database.types'
import { todayStr } from '@/utils/date'
import toast from 'react-hot-toast'

export function useMealsForDate(date: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['meals', user?.id, date],
    enabled: !!user,
    queryFn: () => nutritionService.getMealsByDate(user!.id, date),
  })
}

export function useAddMeal() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<Meal, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('Not authenticated')
      return nutritionService.addMeal({ ...payload, user_id: user.id })
    },
    onSuccess: async (meal) => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      if (user) {
        await updateStreak(user.id, 'food_logging', meal.date)
        if (meal.date === todayStr()) {
          await awardDailyPoints(user.id, meal.date, {
            gymCompleted: false,
            steps: 0,
            waterMl: 0,
            waterGoalMl: 3000,
            mealsLogged: 1,
            sleepHours: null,
            sleepGoalHours: 8,
            weightLogged: false,
            stretchingDone: false,
            moodLogged: false,
            photoLogged: false,
          })
        }
      }
      toast.success('Meal logged!')
    },
  })
}

export function useDeleteMeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => nutritionService.deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useFavoriteFoods() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['favorite-foods', user?.id],
    enabled: !!user,
    queryFn: () => nutritionService.getFavoriteFoods(user!.id),
  })
}

export function useFoodSearch(query: string) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['food-search', user?.id, query],
    enabled: !!user && query.length > 1,
    queryFn: () => nutritionService.searchFoods(user!.id, query),
  })
}

export function useMealTemplates(mealType?: MealType) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['meal-templates', user?.id, mealType],
    enabled: !!user,
    queryFn: () => nutritionService.getMealTemplates(user!.id, mealType),
  })
}
