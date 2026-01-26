import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ohjgplnomwejeygtnlmz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_05rGM2nM7MA_RrCsGoWVWg_c01y7Ok0'

export const supabase = createClient(supabaseUrl, supabaseKey)
