export const DATA_MODES = ['mock', 'supabase'] as const
export type DataMode = (typeof DATA_MODES)[number]

export const dataMode: DataMode = (import.meta.env.VITE_DATA_MODE as DataMode) || 'mock'
export const isMock = dataMode === 'mock'

/** true когда приложение работает в демо-режиме (mock-хранилище). */
export const IS_DEMO = isMock