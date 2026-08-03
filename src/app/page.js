'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  Trash2,
  Edit,
  Tag,
  Clock,
  FolderPlus
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  subDays,
  addWeeks,
  subWeeks,
  parseISO
} from 'date-fns'
import { ko } from 'date-fns/locale/ko'

export default function ScheduleApp() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const [schedules, setSchedules] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [themeBg, setThemeBg] = useState('bg-slate-50')

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleDesc, setScheduleDesc] = useState('')
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')
  const [scheduleCategoryId, setScheduleCategoryId] = useState('')
  const [scheduleBgColor, setScheduleBgColor] = useState('#ffffff')

  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchSchedules()
    } else {
      setSchedules([])
      setCategories([])
    }
  }, [user])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true })
    setCategories(data || [])
  }

  const fetchSchedules = async () => {
    const { data } = await supabase.from('schedules').select('*').order('start_time', { ascending: true })
    setSchedules(data || [])
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('회원가입 이메일이 발송되었습니다! 이메일을 확인하세요.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) alert(error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const openNewScheduleModal = (defaultDate = null) => {
    setEditingSchedule(null)
    setScheduleTitle('')
    setScheduleDesc('')
    const dateStr = defaultDate ? format(defaultDate, "yyyy-MM-dd'T'10:00") : format(new Date(), "yyyy-MM-dd'T'10:00")
    const endDateStr = defaultDate ? format(defaultDate, "yyyy-MM-dd'T'11:00") : format(new Date(), "yyyy-MM-dd'T'11:00")
    setScheduleStart(dateStr)
    setScheduleEnd(endDateStr)
    setScheduleCategoryId(categories[0]?.id || '')
    setScheduleBgColor('#ffffff')
    setShowScheduleModal(true)
  }

  const openEditScheduleModal = (sched) => {
    setEditingSchedule(sched)
    setScheduleTitle(sched.title)
    setScheduleDesc(sched.description || '')
    setScheduleStart(sched.start_time ? format(parseISO(sched.start_time), "yyyy-MM-dd'T'HH:mm") : '')
    setScheduleEnd(sched.end_time ? format(parseISO(sched.end_time), "yyyy-MM-dd'T'HH:mm") : '')
    setScheduleCategoryId(sched.category_id || '')
    setScheduleBgColor(sched.background_style || '#ffffff')
    setShowScheduleModal(true)
  }

  const handleSaveSchedule = async (e) => {
    e.preventDefault()
    if (!scheduleTitle) return alert('제목을 입력해 주세요.')

    const payload = {
      user_id: user.id,
      title: scheduleTitle,
      description: scheduleDesc,
      start_time: new Date(scheduleStart).toISOString(),
      end_time: new Date(scheduleEnd).toISOString(),
      category_id: scheduleCategoryId || null,
      background_style: scheduleBgColor
    }

    if (editingSchedule) {
      await supabase.from('schedules').update(payload).eq('id', editingSchedule.id)
    } else {
      await supabase.from('schedules').insert([payload])
    }

    setShowScheduleModal(false)
    fetchSchedules()
  }

  const handleDeleteSchedule = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('schedules').delete().eq('id', id)
    setShowScheduleModal(false)
    fetchSchedules()
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCatName) return alert('카테고리 이름을 입력하세요.')

    await supabase.from('categories').insert([{
      user_id: user.id,
      name: newCatName,
      color: newCatColor
    }])

    setNewCatName('')
    setShowCategoryModal(false)
    fetchCategories()
  }

  const prevDate = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const nextDate = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const filteredSchedules = selectedCategory === 'all'
    ? schedules
    : schedules.filter(s => s.category_id === selectedCategory)

  if (authLoading) {
    return <div className="p-8 text-center">로딩 중...</div>
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">개인 일정 관리 툴</h1>
            <p className="text-xs text-slate-500 mt-1">나만의 달력을 자유롭게 꾸며보세요</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl border py-3 font-medium text-slate-700 hover:bg-slate-50 mb-4"
          >
            Google 로그인
          </button>

          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full rounded-xl border p-2.5 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-xl border p-2.5 text-sm"
            />
            <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white">
              {isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            <button onClick={() => setIsSignUp(!isSignUp)} className="underline">
              {isSignUp ? '로그인으로 전환' : '회원가입으로 전환'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${themeBg} p-4 md:p-8`}>
      <header className="max-w-7xl mx-auto flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-indigo-600" />
          <h1 className="font-bold text-lg">일정 관리 툴</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setView('month')} className={`px-3 py-1 rounded-lg text-xs ${view === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>월간</button>
          <button onClick={() => setView('week')} className={`px-3 py-1 rounded-lg text-xs ${view === 'week' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>주간</button>
          <button onClick={() => setView('day')} className={`px-3 py-1 rounded-lg text-xs ${view === 'day' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>일간</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevDate}><ChevronLeft className="h-5 w-5" /></button>
          <span className="font-bold text-sm">{format(currentDate, 'yyyy년 M월')}</span>
          <button onClick={nextDate}><ChevronRight className="h-5 w-5" /></button>
          <button onClick={() => openNewScheduleModal()} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
            <Plus className="h-4 w-4" /> 일정 추가
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-400">카테고리</h3>
            <button onClick={() => setShowCategoryModal(true)} className="text-xs text-indigo-600 underline">추가</button>
          </div>
          <button onClick={() => setSelectedCategory('all')} className="w-full text-left text-xs p-2 rounded-lg bg-slate-50">전체 보기</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} className="w-full flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-slate-50">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}
        </aside>

        <main className="md:col-span-3 bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-center text-slate-500 text-sm">일정 목록이 여기에 표시됩니다. 상단 "+ 일정 추가" 버튼을 누르세요!</p>
        </main>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-lg">일정 추가 / 수정</h2>
            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <input type="text" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} placeholder="일정 제목" className="w-full border p-2 rounded-lg text-sm" />
              <input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="w-full border p-2 rounded-lg text-xs" />
              <input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="w-full border p-2 rounded-lg text-xs" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-xs border rounded-lg">취소</button>
                <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-lg">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg">새 카테고리 추가</h2>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="카테고리 이름" className="w-full border p-2 rounded-lg text-sm" />
              <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-10 w-full rounded-lg" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-xs border rounded-lg">취소</button>
                <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-lg">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
