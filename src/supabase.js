import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kznsrapagszdrdkltbdr.supabase.co'
const supabaseKey = 'sb_publishable_RUl7G-8EcDNACAoIJKNAnQ_JWqoSKmF'

export const supabase = createClient(supabaseUrl, supabaseKey)
