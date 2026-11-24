import type { FileItem } from './types'

export const searchLimit = 8
export const maxQueryLength = 100
// Mirrors the Spanish characters folded by the database, including in literal file names.
export const accents = 'áéíóúüñ'
export const plain = 'aeiouun'
export const fold = (value: string) => value.normalize('NFC').toLowerCase().replace(/[áéíóúüñ]/g, char => plain[accents.indexOf(char)])

export type SearchFile = { file: FileItem; ownerName: string; requestTitle: string | null }
export type SearchClient = { id: string; label: string; email: string }
export type SearchMatches = { files: SearchFile[]; clients: SearchClient[] }
