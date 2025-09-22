import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export type Player = {
  id: string
  name: string
  gender: 'Guy' | 'Gal'
  skill: number
  present: boolean
  created_at?: string
  updated_at?: string
}

export type Team = {
  id: string
  name: string
  players: Player[]
  created_at?: string
  updated_at?: string
}

export type PublishedData = {
  id?: string
  teams: Team[]
  format: string
  schedule: any[]
  active_rule: any
  points_to_win: number
  created_at?: string
  updated_at?: string
}