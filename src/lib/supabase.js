import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lxkzsiguvltcebssefdv.supabase.co'

// 아래에 Legacy anon 탭에서 복사한 eyJ... 로 시작하는 긴 키를 붙여넣으세요.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3pzaWd1dmx0Y2Vic3NlZmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2ODkyMDQsImV4cCI6MjEwMTI2NTIwNH0.R2mR5pSgSsBijob2DlSOhYVCSfNYhmmZKUzuIyjDh0o.'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
