import { create } from 'zustand'
import type { StrengthExercise, CardioSession, WorkoutType } from '@/types/database.types'

export interface DraftStrengthExercise extends Partial<StrengthExercise> {
  tempId: string
  exercise_name: string
}
export interface DraftCardioSession extends Partial<CardioSession> {
  tempId: string
}

interface ActiveWorkoutState {
  isActive: boolean
  sessionId: string | null
  gymEntryTime: string | null
  workoutTypes: WorkoutType[]
  title: string
  draftStrength: DraftStrengthExercise[]
  draftCardio: DraftCardioSession[]

  startWorkout: (types: WorkoutType[], title?: string) => void
  endWorkout: () => void
  reset: () => void
  setSessionId: (id: string) => void
  addWorkoutType: (type: WorkoutType) => void
  addStrengthExercise: (ex: DraftStrengthExercise) => void
  updateStrengthExercise: (tempId: string, patch: Partial<DraftStrengthExercise>) => void
  removeStrengthExercise: (tempId: string) => void
  addCardioSession: (session: DraftCardioSession) => void
  updateCardioSession: (tempId: string, patch: Partial<DraftCardioSession>) => void
  removeCardioSession: (tempId: string) => void
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
  isActive: false,
  sessionId: null,
  gymEntryTime: null,
  workoutTypes: [],
  title: '',
  draftStrength: [],
  draftCardio: [],

  startWorkout: (types, title) =>
    set({
      isActive: true,
      gymEntryTime: new Date().toISOString(),
      workoutTypes: types,
      title: title ?? '',
      draftStrength: [],
      draftCardio: [],
    }),

  endWorkout: () => set({ isActive: false }),

  reset: () =>
    set({
      isActive: false,
      sessionId: null,
      gymEntryTime: null,
      workoutTypes: [],
      title: '',
      draftStrength: [],
      draftCardio: [],
    }),

  setSessionId: (id) => set({ sessionId: id }),

  addWorkoutType: (type) =>
    set((s) => ({ workoutTypes: s.workoutTypes.includes(type) ? s.workoutTypes : [...s.workoutTypes, type] })),

  addStrengthExercise: (ex) => set((s) => ({ draftStrength: [...s.draftStrength, ex] })),

  updateStrengthExercise: (tempId, patch) =>
    set((s) => ({
      draftStrength: s.draftStrength.map((e) => (e.tempId === tempId ? { ...e, ...patch } : e)),
    })),

  removeStrengthExercise: (tempId) =>
    set((s) => ({ draftStrength: s.draftStrength.filter((e) => e.tempId !== tempId) })),

  addCardioSession: (session) => set((s) => ({ draftCardio: [...s.draftCardio, session] })),

  updateCardioSession: (tempId, patch) =>
    set((s) => ({
      draftCardio: s.draftCardio.map((c) => (c.tempId === tempId ? { ...c, ...patch } : c)),
    })),

  removeCardioSession: (tempId) =>
    set((s) => ({ draftCardio: s.draftCardio.filter((c) => c.tempId !== tempId) })),
}))
