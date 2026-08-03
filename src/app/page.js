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
  FolderPlus,
  Palette,
  X
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

// =========================================================================
//  [나만의 자유 커스텀 디자인 설정 구역]
//  아래 값만 변경하면 포인트 색상, 배경 이미지, 패턴, 글씨 색상이 모두 바뀝니다!
// =========================================================================
const CUSTOM_DESIGN = {
  // 1. 포인트 컬러 (달력 이모티콘, +일정추가 버튼, 오늘 날짜 배지, '추가' 링크 등)
  // 예시 색상: '#cdb4db' (Pink Orchid), '#ffafcc' (Pastel Petal), '#ffafcc' (Blush Pop), '#bde0fe' (Icy Blue), '#a2d2ff' (Sky Blue)
  primaryColor: '#ffafcc',

  // 2. 전체 앱 배경 (이미지/패턴 URL 또는 색상)
  // - 이미지/패턴 사용 시: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809')"
  // - 단색만 사용 시: "none"
  backgroundImage: "https://chatgpt.com/backend-api/estuary/content?id=file_000000008ee48211ba2441e7f82b160b&ts=496037&p=fs&cid=1&sig=9f98f46db3fe986c7c603a7db8784f10fea8761ec5e0272a7f5bcc53c88338d8&v=0",
  backgroundColor: "#F1F5F9", 

  // 3. 주요 글씨 색상
  headerTitleColor: '#1E293B',  // 상단 대제목 글자색
  bodyTextColor: '#475569',      // 본문 / 카테고리 글자색
  calendarDateColor: '#334155',  // 평일 날짜 글자색
  sundayColor: '#EF4444',        // 일요일 글자색
  saturdayColor: '#3B82F6',      // 토요일 글자색

  // 4. 카드 및 모달 배경색
  cardBackgroundColor: '#FFFFFF',
}

const COLOR_PRESETS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']

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

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleDesc, setScheduleDesc] = useState('')
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')
  const [scheduleCategoryId, setScheduleCategoryId] = useState('')
  const [scheduleBgColor, setScheduleBgColor] = useState('#3B82F6')

  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3B82F6')

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
    if (!email || !password) return alert('이메일과 비밀번호를 입력해 주세요.')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('회원가입 이메일이 발송되었습니다!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const openNewScheduleModal = (defaultDate = null) => {
    setEditingSchedule(null)
    setScheduleTitle('')
    setScheduleDesc('')
    const targetDate = defaultDate || new Date()
    setScheduleStart(format(targetDate, "yyyy-MM-dd'T'10:00"))
    setScheduleEnd(format(targetDate, "yyyy-MM-dd'T'11:00"))
    setScheduleCategoryId(categories[0]?.id || '')
    setScheduleBgColor(categories[0]?.color || '#3B82F6')
    setShowScheduleModal(true)
  }

  const openEditScheduleModal = (sched) => {
    setEditingSchedule(sched)
    setScheduleTitle(sched.title)
    setScheduleDesc(sched.description || '')
    setScheduleStart(sched.start_time ? format(parseISO(sched.start_time), "yyyy-MM-dd'T'HH:mm") : '')
    setScheduleEnd(sched.end_time ? format(parseISO(sched.end_time), "yyyy-MM-dd'T'HH:mm") : '')
    setScheduleCategoryId(sched.category_id || '')
    setScheduleBgColor(sched.background_style || '#3B82F6')
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

  if (authLoading) return <div className="p-8 text-center text-slate-600">로딩 중...</div>

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">개인 일정 관리 툴</h1>
          <form onSubmit={handleAuth} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="w-full border p-2.5 rounded-xl text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="w-full border p-2.5 rounded-xl text-sm" />
            <button type="submit" style={{ backgroundColor: CUSTOM_DESIGN.primaryColor }} className="w-full text-white py-3 rounded-xl font-bold">
              {isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ color: CUSTOM_DESIGN.primaryColor }} className="mt-4 text-xs underline block mx-auto font-bold">
            {isSignUp ? '로그인으로 전환' : '회원가입으로 전환'}
          </button>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['일', '월', '화', '수', '목', '금', '토']

    return (
      <div style={{ backgroundColor: CUSTOM_DESIGN.cardBackgroundColor }} className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold py-3">
          {weekDays.map((day, idx) => (
            <div key={day} style={{ color: idx === 0 ? CUSTOM_DESIGN.sundayColor : idx === 6 ? CUSTOM_DESIGN.saturdayColor : CUSTOM_DESIGN.bodyTextColor }}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const daySchedules = filteredSchedules.filter(s => isSameDay(parseISO(s.start_time), day))

            return (
              <div
                key={day.toString()}
                onClick={() => openNewScheduleModal(day)}
                className={`min-h-[110px] p-2 transition hover:bg-slate-50 cursor-pointer ${!isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      backgroundColor: isToday ? CUSTOM_DESIGN.primaryColor : 'transparent',
                      color: isToday ? '#FFFFFF' : day.getDay() === 0 ? CUSTOM_DESIGN.sundayColor : day.getDay() === 6 ? CUSTOM_DESIGN.saturdayColor : CUSTOM_DESIGN.calendarDateColor
                    }}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {daySchedules.map((sched) => (
                    <div
                      key={sched.id}
                      onClick={(e) => { e.stopPropagation(); openEditScheduleModal(sched); }}
                      style={{ backgroundColor: sched.background_style || CUSTOM_DESIGN.primaryColor }}
                      className="truncate rounded-md px-2 py-0.5 text-xs text-white font-semibold"
                    >
                      {sched.title}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundImage: CUSTOM_DESIGN.backgroundImage !== 'none' ? CUSTOM_DESIGN.backgroundImage : undefined,
        backgroundColor: CUSTOM_DESIGN.backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: CUSTOM_DESIGN.bodyTextColor
      }}
      className="min-h-screen p-4 md:p-8"
    >
      <header style={{ backgroundColor: CUSTOM_DESIGN.cardBackgroundColor }} className="max-w-7xl mx-auto flex items-center justify-between gap-4 mb-6 rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          {/* 달력 이모티콘 포인트 색상 */}
          <div style={{ backgroundColor: CUSTOM_DESIGN.primaryColor }} className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <h1 style={{ color: CUSTOM_DESIGN.headerTitleColor }} className="text-lg font-bold">일정 관리 툴</h1>
        </div>

        {/* 탭 버튼들 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            style={{ backgroundColor: view === 'month' ? CUSTOM_DESIGN.primaryColor : '#F1F5F9', color: view === 'month' ? '#FFFFFF' : CUSTOM_DESIGN.bodyTextColor }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs"
          >
            월간
          </button>
          <button
            onClick={() => setView('week')}
            style={{ backgroundColor: view === 'week' ? CUSTOM_DESIGN.primaryColor : '#F1F5F9', color: view === 'week' ? '#FFFFFF' : CUSTOM_DESIGN.bodyTextColor }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs"
          >
            주간
          </button>
          <button
            onClick={() => setView('day')}
            style={{ backgroundColor: view === 'day' ? CUSTOM_DESIGN.primaryColor : '#F1F5F9', color: view === 'day' ? '#FFFFFF' : CUSTOM_DESIGN.bodyTextColor }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition shadow-2xs"
          >
            일간
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevDate} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
          <span style={{ color: CUSTOM_DESIGN.headerTitleColor }} className="text-sm font-bold min-w-[100px] text-center">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </span>
          <button onClick={nextDate} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600"><ChevronRight className="h-4 w-4" /></button>
          
          {/* + 일정 추가 버튼 포인트 색상 */}
          <button
            onClick={() => openNewScheduleModal()}
            style={{ backgroundColor: CUSTOM_DESIGN.primaryColor }}
            className="text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> 일정 추가
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="space-y-6">
          <div style={{ backgroundColor: CUSTOM_DESIGN.cardBackgroundColor }} className="rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> 카테고리
              </h3>
              {/* '추가' 링크 포인트 색상 */}
              <button onClick={() => setShowCategoryModal(true)} style={{ color: CUSTOM_DESIGN.primaryColor }} className="text-xs font-bold hover:underline">
                추가
              </button>
            </div>
            <button onClick={() => setSelectedCategory('all')} className="w-full text-left text-xs p-2 rounded-xl bg-slate-50 font-semibold mb-2">전체 보기</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="w-full flex items-center gap-2 text-xs p-2 rounded-xl hover:bg-slate-50 font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-3">
          {view === 'month' && renderMonthView()}
        </main>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-800">{editingSchedule ? '일정 수정' : '새 일정 추가'}</h2>
            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <input type="text" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} placeholder="일정 제목" className="w-full border p-2.5 rounded-xl text-sm" />
              <select value={scheduleCategoryId} onChange={(e) => setScheduleCategoryId(e.target.value)} className="w-full border p-2.5 rounded-xl text-sm">
                <option value="">카테고리 없음</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">시작 시간</label>
                  <input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="w-full border p-2 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">종료 시간</label>
                  <input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="w-full border p-2 rounded-xl text-xs" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button key={color} type="button" onClick={() => setScheduleBgColor(color)} style={{ backgroundColor: color }} className="h-6 w-6 rounded-full" />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-xs border rounded-xl font-bold">취소</button>
                <button type="submit" style={{ backgroundColor: CUSTOM_DESIGN.primaryColor }} className="px-5 py-2 text-xs text-white rounded-xl font-bold shadow-md">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-800">새 카테고리 추가</h2>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="카테고리 이름" className="w-full border p-2.5 rounded-xl text-sm" />
              <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="h-10 w-full rounded-xl" />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-xs border rounded-xl font-bold">취소</button>
                <button type="submit" style={{ backgroundColor: CUSTOM_DESIGN.primaryColor }} className="px-5 py-2 text-xs text-white rounded-xl font-bold shadow-md">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
