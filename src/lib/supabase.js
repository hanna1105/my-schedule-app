import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxkzsigultcebssefdv.supabase.co'
const supabaseAnonKey = 'sb_publishable_r02ELSGuwCwFhuRpPOj9MQ_CLjxmtk7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
