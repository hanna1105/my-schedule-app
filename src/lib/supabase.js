import { createClient } from '@supabase/supabase-js'

// 끝에 /rest/v1 이 없는 순수 주소를 입력해야 합니다.
const supabaseUrl = 'https://lxkzsigultcebssefdv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3pzaWd1dmx0Y2Vic3NlZmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODkyMDQsImV4cCI6MjEwMTI2NTIwNH0.R2mR5pSgSsBijob2DlSOhYVCSfNYhmmZKUzuIyjDh0o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
