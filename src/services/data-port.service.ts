import { supabase } from '@/lib/supabase'
import { saveOrDownloadFile } from '@/utils/file-download'

/**
 * Full-profile data port: exports every user-owned table to a file and can
 * restore it back. Two formats are supported:
 *  - .xlsx (Excel workbook, one sheet per table) — human-readable, the
 *    format the user asked for.
 *  - .json (raw backup) — included for completeness/back-compat with the
 *    earlier JSON export; import accepts either format and auto-detects
 *    which one it was given.
 *
 * Import is intentionally additive (upsert-on-conflict by natural key
 * where the table has one) rather than a destructive wipe-and-restore —
 * importing merges with whatever's currently in your account instead of
 * replacing it, so importing a file from an old device doesn't delete
 * anything you've logged since.
 */

/** Every user-owned table included in the export, in export order. */
const TABLES = [
  'profiles',
  'settings',
  'workout_sessions',
  'strength_exercises',
  'cardio_sessions',
  'workout_templates',
  'workout_template_exercises',
  'meals',
  'foods',
  'water_logs',
  'weight_logs',
  'body_measurements',
  'progress_photos',
  'sleep_logs',
  'mood_logs',
  'step_logs',
  'daily_routines',
  'daily_scores',
  'points_ledger',
  'streaks',
  'streak_rewards',
  'habits',
  'habit_checkins',
  'rest_day_logs',
  'personal_records',
  'challenges',
  'user_achievements',
  'notifications',
] as const

type TableName = (typeof TABLES)[number]

export interface ExportData {
  exported_at: string
  app_version?: string
  tables: Record<TableName, Record<string, unknown>[]>
}

/** Natural unique key per table, used for upsert-on-import where the table
 * has one. Tables without a natural key are simply re-inserted (they're
 * append-only logs anyway). */
const UPSERT_KEYS: Partial<Record<TableName, string[]>> = {
  profiles: ['id'],
  settings: ['user_id'],
  weight_logs: ['user_id', 'date'],
  sleep_logs: ['user_id', 'date'],
  mood_logs: ['user_id', 'date'],
  step_logs: ['user_id', 'date'],
  daily_routines: ['user_id', 'date'],
  streaks: ['user_id', 'category'],
  foods: ['id'],
  habits: ['id'],
  personal_records: ['id'],
  challenges: ['id'],
  user_achievements: ['user_id', 'achievement_code'],
  streak_rewards: ['id'],
}

/**
 * Fetches every user-owned table and returns it as a structured export object.
 */
export async function exportAllData(): Promise<ExportData> {
  const results = await Promise.all(TABLES.map((t) => supabase.from(t).select('*')))
  const tables: Record<TableName, Record<string, unknown>[]> = {} as Record<TableName, Record<string, unknown>[]>
  TABLES.forEach((t, i) => {
    tables[t] = (results[i].error ? [] : (results[i].data ?? [])) as Record<string, unknown>[]
  })
  return {
    exported_at: new Date().toISOString(),
    tables,
  }
}

/** Exports everything as a multi-sheet .xlsx workbook and saves/downloads it.
 *  `xlsx` is dynamically imported here (rather than statically at module
 *  top level) so the ~420KB library only downloads when the user actually
 *  clicks Export, instead of being bundled into the Settings page's eager
 *  chunk for everyone who ever visits Settings.
 */
export async function exportAsExcel(): Promise<string> {
  const data = await exportAllData()
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  for (const tableName of TABLES) {
    const rows = data.tables[tableName]
    const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ info: 'no data' }])
    XLSX.utils.book_append_sheet(wb, sheet, tableName)
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const fileName = `fittrack-export-${new Date().toISOString().slice(0, 10)}.xlsx`
  return saveOrDownloadFile(fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', blob)
}

/** Exports everything as a raw .json backup and saves/downloads it. */
export async function exportAsJson(): Promise<string> {
  const data = await exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const fileName = `fittrack-export-${new Date().toISOString().slice(0, 10)}.json`
  return saveOrDownloadFile(fileName, 'application/json', blob)
}

/**
 * Imports data from a previously exported file (.xlsx or .json),
 * upserting rows into the current account. Returns a per-table row-count
 * summary.
 */
export async function importDataFile(userId: string, file: File): Promise<{ imported: number; errors: string[] }> {
  const ext = file.name.toLowerCase().split('.').pop()
  let data: ExportData

  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: 'array' })
    const tables: Record<string, Record<string, unknown>[]> = {}
    for (const sheetName of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]) as Record<string, unknown>[]
      if (rows.length > 0 && Object.keys(rows[0]).length === 1 && 'info' in rows[0]) continue // "no data" placeholder
      tables[sheetName] = rows
    }
    data = { exported_at: '', tables: tables as ExportData['tables'] }
  } else {
    const text = await file.text()
    const parsed = JSON.parse(text) as unknown
    const normalized = normalizeExportShape(parsed)
    if (!normalized) {
      throw new Error("This file doesn't look like a FitTrack export")
    }
    data = normalized
  }

  let imported = 0
  const errors: string[] = []

  for (const tableName of TABLES) {
    const rows = data.tables[tableName]
    if (!rows || !Array.isArray(rows) || rows.length === 0) continue

    // Rewrite user_id on every imported row to the CURRENT signed-in user.
    // Without this, importing a file that was exported by a different
    // account would insert rows belonging to that other account into yours
    // (wrong data ownership) -- RLS would also just reject those rows.
    // Rows that don't carry a user_id (e.g. profiles, where the key is `id`)
    // are left alone; RLS checks those separately.
    const sanitized = rows.map((row) => {
      if (!row || typeof row !== 'object') return row
      const copy = { ...(row as Record<string, unknown>) }
      if ('user_id' in copy) copy.user_id = userId
      return copy
    })

    const upsertKeys = UPSERT_KEYS[tableName]
    try {
      if (upsertKeys) {
        const onConflict = upsertKeys.join(',')
        const { error } = await supabase.from(tableName).upsert(sanitized as never, { onConflict })
        if (error) throw error
      } else {
        const { error } = await supabase.from(tableName).insert(sanitized as never)
        if (error) throw error
      }
      imported += rows.length
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error'
      errors.push(`${tableName}: ${msg}`)
    }
  }

  return { imported, errors }
}

/**
 * Back-compat shim: some older JSON exports used the flat
 * {profiles, settings, ...} top-level shape instead of {tables: {...}}.
 * Normalizes that into the tables{} shape so importDataFile works for both.
 */
export function normalizeExportShape(raw: unknown): ExportData | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (obj.tables && typeof obj.tables === 'object') return obj as unknown as ExportData

  // Legacy flat shape: top-level keys are table names.
  const tables: Record<string, Record<string, unknown>[]> = {}
  let found = false
  for (const [key, value] of Object.entries(obj)) {
    if (TABLES.includes(key as TableName) && Array.isArray(value)) {
      tables[key] = value as Record<string, unknown>[]
      found = true
    }
  }
  return found ? { exported_at: typeof obj.exported_at === 'string' ? obj.exported_at : '', tables: tables as ExportData['tables'] } : null
}
