import { createClient } from '@supabase/supabase-js'

// 아래 주소 부분을 Data API에서 복사한 진짜 주소로 교체해 주세요!
const supabaseUrl = 'https://lxkzsiguvltcebssefdv.supabase.co'
const supabaseAnonKey = 'sb_publishable_r02ELSGuwCwFhuRpPOj9MQ_CLjxmtk7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
