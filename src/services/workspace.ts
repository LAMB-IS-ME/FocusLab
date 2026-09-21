import { emptyData } from '../data/demo'
import { dataSchema } from '../lib/storage'
import { getSupabase } from '../lib/supabase'
import type { AppData } from '../types'
import type { Json } from '../types/database'

import type { Changes } from './workspaceChanges'
export { collections, diffData, mergeChanges, normalizeReferences } from './workspaceChanges'
export type { Changes, Collection } from './workspaceChanges'

export function parseWorkspace(data: unknown): AppData {
  const defaults = emptyData()
  const snapshot = dataSchema
    .omit({ version: true, timer: true })
    .extend({ settings: dataSchema.shape.settings.nullable() })
    .parse(data)
  return dataSchema.parse({
    ...defaults,
    ...snapshot,
    settings: snapshot?.settings ?? defaults.settings,
  })
}

export async function loadWorkspace(): Promise<AppData> {
  const { data, error } = await getSupabase().rpc('get_workspace')
  if (error) throw error
  return parseWorkspace(data)
}

export async function saveChanges(userId: string, changes: Changes) {
  const { data, error } = await getSupabase().rpc('apply_workspace_changes', {
    changes: JSON.parse(JSON.stringify(changes)) as Json,
    expected_user_id: userId,
  })
  if (error) throw error
  return parseWorkspace(data)
}

export async function resetWorkspace(userId: string) {
  const { error } = await getSupabase().rpc('reset_workspace', { expected_user_id: userId })
  if (error) throw error
}
