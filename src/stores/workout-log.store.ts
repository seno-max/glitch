import { create } from 'zustand'
import type { EquipmentType, WorkoutType } from '@/types/database.types'
import { todayStr } from '@/utils/date'

/**
 * A single logged exercise entry in the manual gym-log flow. Supports three
 * styles depending on what's filled in:
 *  - Strength: sets + reps + weight_kg
 *  - Timed/cardio bodyweight sets: sets + duration_seconds (e.g. "30 sec x 3
 *    sets" burpees), duration_unit 'sec'
 *  - Machine cardio: no sets/reps at all — just distance_km and/or a total
 *    duration entered in whichever unit the user prefers (duration_unit
 *    'sec' or 'min'), e.g. "20 min on the recumbent bike, 5km".
 */
export interface DraftExercise {
  tempId: string
  exercise_name: string
  equipment: EquipmentType
  isMachineCardio: boolean
  weight_kg: number | null
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  duration_unit: 'sec' | 'min'
  distance_km: number | null
  rest_seconds: number | null
  rpe: number | null
  notes: string | null
}

interface WorkoutLogState {
  date: string
  entryTime: string // "HH:mm"
  exitTime: string // "HH:mm"
  workoutTypes: WorkoutType[]
  title: string
  exercises: DraftExercise[]

  setDate: (date: string) => void
  setEntryTime: (time: string) => void
  setExitTime: (time: string) => void
  setTitle: (title: string) => void
  toggleWorkoutType: (type: WorkoutType) => void
  setWorkoutTypes: (types: WorkoutType[]) => void
  addExercise: (ex: DraftExercise) => void
  updateExercise: (tempId: string, patch: Partial<DraftExercise>) => void
  removeExercise: (tempId: string) => void
  reset: () => void
  loadFromSession: (data: {
    date: string
    entryTime: string
    exitTime: string
    workoutTypes: WorkoutType[]
    title: string
    exercises: DraftExercise[]
  }) => void
}

function defaultState() {
  return {
    date: todayStr(),
    entryTime: '',
    exitTime: '',
    workoutTypes: [] as WorkoutType[],
    title: '',
    exercises: [] as DraftExercise[],
  }
}

export const useWorkoutLogStore = create<WorkoutLogState>((set) => ({
  ...defaultState(),

  setDate: (date) => set({ date }),
  setEntryTime: (entryTime) => set({ entryTime }),
  setExitTime: (exitTime) => set({ exitTime }),
  setTitle: (title) => set({ title }),

  toggleWorkoutType: (type) =>
    set((s) => ({
      workoutTypes: s.workoutTypes.includes(type) ? s.workoutTypes.filter((t) => t !== type) : [...s.workoutTypes, type],
    })),
  setWorkoutTypes: (workoutTypes) => set({ workoutTypes }),

  addExercise: (ex) => set((s) => ({ exercises: [...s.exercises, ex] })),
  updateExercise: (tempId, patch) =>
    set((s) => ({
      exercises: s.exercises.map((e) => (e.tempId === tempId ? { ...e, ...patch } : e)),
    })),
  removeExercise: (tempId) => set((s) => ({ exercises: s.exercises.filter((e) => e.tempId !== tempId) })),

  reset: () => set(defaultState()),
  loadFromSession: (data) =>
    set({
      date: data.date,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      workoutTypes: data.workoutTypes,
      title: data.title,
      exercises: data.exercises,
    }),
}))
