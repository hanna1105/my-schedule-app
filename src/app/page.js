import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 2. 로그인 상태 변경 감지 (구글 로그인 후 돌아왔을 때 세션을 잡아주는 역할)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 구글 로그인 함수
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://vermillion-cendol-1df387.netlify.app',
      },
    })
  }

  return (
    <div>
      {session ? (
        <p>로그인 성공: {session.user.email}</p>
      ) : (
        <button onClick={handleGoogleLogin}>구글로 로그인</button>
      )}
    </div>
  )
}

export default App
