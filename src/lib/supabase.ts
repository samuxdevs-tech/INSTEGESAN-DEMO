import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qecdvowgfemhbfelymqu.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_S0RSIQE3MAs32lYlq8i-Hg_J_AQX0fz'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
