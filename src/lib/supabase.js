import { createClient } from '@supabase/supabase-js'

// 끝에 /rest/v1 이 없는 순수 주소를 입력해야 합니다.
const supabaseUrl = 'https://lxkzsigultcebssefdv.supabase.co'
const supabaseAnonKey = 'sb_publishable_r02ELSGuwCwFhuRpPOj9MQ_CLjxmtk7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
