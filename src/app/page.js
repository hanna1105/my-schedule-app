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
  X,
  Briefcase,
  Dumbbell,
  BookOpen,
  Coffee,
  Plane,
  Heart
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

// 색상 프리셋
const COLOR_PRESETS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
]

// 배경 테마 목록
const THEMES = [
  { id: 'slate', name: '기본 보라/슬레이트', bg: 'bg-slate-100', cardBg: 'bg-white' },
  { id: 'indigo', name: '파스텔 인디고', bg: 'bg-indigo-50/80', cardBg: 'bg-white' },
  { id: 'emerald', name: '파스텔 에메랄드', bg: 'bg-emerald-50/80', cardBg: 'bg-white' },
  { id: 'amber', name: '파스텔 앰버', bg: 'bg-amber-50/80', cardBg: 'bg-white' },
  { id: 'rose', name: '파스텔 로즈', bg: 'bg-rose-50/80', cardBg: 'bg-white' },
  { id: 'dark', name: '다크 모드', bg: 'bg-slate-900', cardBg: 'bg-slate-800' }
]

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

  const [currentTheme, setCurrentTheme] = useState(THEMES[0])

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
      else alert('회원가입 이메일이 발송되었습니다! 이메일을 확인해 주세요.')
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
    if (!confirm('정말 이 일정을 삭제하시겠습니까?')) return
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
    return <div className="p-8 text-center text-slate-600">로딩 중...</div>
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-white/50">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md mb-2">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">개인 일정 관리 툴</h1>
            <p className="text-xs text-slate-500 mt-1">나만의 달력을 자유롭게 꾸며보세요</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-medium text-slate-700 hover:bg-slate-50 transition mb-4 shadow-2xs"
          >
            Google 로그인
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400">또는 이메일</span></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
            <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md hover:bg-indigo-700 transition">
              {isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            {isSignUp ? '계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-indigo-600 underline">
              {isSignUp ? '로그인하기' : '회원가입하기'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  // --- 월간 달력 그리드 ---
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['일', '월', '화', '수', '목', '금', '토']

    return (
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-sm border border-slate-200 overflow-hidden`}>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-500 py-3">
          {weekDays.map((day, idx) => (
            <div key={day} className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : ''}>
              {day}
            </div>
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
                className={`min-h-[110px] p-2 transition hover:bg-indigo-50/30 cursor-pointer ${
                  !isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : day.getDay() === 0
                        ? 'text-red-500'
                        : day.getDay() === 6
                        ? 'text-blue-500'
                        : 'text-slate-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map((sched) => {
                    const cat = categories.find(c => c.id === sched.category_id)
                    const bg = sched.background_style || cat?.color || '#3B82F6'
                    return (
                      <div
                        key={sched.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditScheduleModal(sched)
                        }}
                        style={{ backgroundColor: bg }}
                        className="truncate rounded-md px-2 py-1 text-xs text-white font-semibold shadow-2xs hover:opacity-90 transition"
                      >
                        {sched.title}
                      </div>
                    )
                  })}
                  {daySchedules.length > 3 && (
                    <div className="text-[10px] font-bold text-slate-400 pl-1">
                      +{daySchedules.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- 주간 뷰 ---
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-sm border border-slate-200 overflow-hidden`}>
        <div className="grid grid-cols-7 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={day.toString()} className="p-3 text-center">
                <p className="text-xs font-medium text-slate-400 mb-1">{format(day, 'EEE', { locale: ko })}</p>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </span>
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[400px]">
          {days.map((day) => {
            const daySchedules = filteredSchedules.filter(s => isSameDay(parseISO(s.start_time), day))
            return (
              <div key={day.toString()} onClick={() => openNewScheduleModal(day)} className="p-2 space-y-2 hover:bg-slate-50/50 cursor-pointer">
                {daySchedules.map((sched) => {
                  const cat = categories.find(c => c.id === sched.category_id)
                  const bg = sched.background_style || cat?.color || '#3B82F6'
                  return (
                    <div
                      key={sched.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditScheduleModal(sched)
                      }}
                      style={{ backgroundColor: bg }}
                      className="rounded-xl p-2.5 text-white shadow-2xs hover:opacity-90 transition"
                    >
                      <p className="font-bold text-xs truncate">{sched.title}</p>
                      <p className="text-[10px] opacity-80 mt-1">{format(parseISO(sched.start_time), 'HH:mm')}</p>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // --- 일간 뷰 ---
  const renderDayView = () => {
    const daySchedules = filteredSchedules.filter(s => isSameDay(parseISO(s.start_time), currentDate))

    return (
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-sm border border-slate-200 p-6`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {format(currentDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">총 {daySchedules.length}개의 일정이 있습니다.</p>
          </div>
          <button onClick={() => openNewScheduleModal(currentDate)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> 일정 추가
          </button>
        </div>

        {daySchedules.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">등록된 일정이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">상단 "+ 일정 추가" 버튼을 누르세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {daySchedules.map((sched) => {
              const cat = categories.find(c => c.id === sched.category_id)
              const bg = sched.background_style || cat?.color || '#3B82F6'
              return (
                <div
                  key={sched.id}
                  onClick={() => openEditScheduleModal(sched)}
                  className="flex items-center justify-between rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-indigo-300 transition cursor-pointer"
                  style={{ borderLeftWidth: '6px', borderLeftColor: bg }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{sched.title}</span>
                      {cat && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                    </div>
                    {sched.description && <p className="text-xs text-slate-500">{sched.description}</p>}
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {format(parseISO(sched.start_time), 'a hh:mm', { locale: ko })} ~ {format(parseISO(sched.end_time), 'a hh:mm', { locale: ko })}
                    </div>
                  </div>
                  <Edit className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} p-4 md:p-8 transition-colors duration-200`}>
      {/* Header */}
      <header className={`max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-6 ${currentTheme.cardBg} rounded-2xl p-4 shadow-sm border border-slate-200`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">일정 관리 툴</h1>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Views & Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'month' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              월간
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'week' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              주간
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${view === 'day' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'}`}
            >
              일간
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={prevDate} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-800 min-w-[100px] text-center">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </span>
            <button onClick={nextDate} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openNewScheduleModal()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> 일정 추가
          </button>
          <button
            onClick={handleLogout}
            title="로그아웃"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <aside className="space-y-6">
          {/* Categories */}
          <div className={`${currentTheme.cardBg} rounded-2xl p-5 shadow-sm border border-slate-200`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> 카테고리
              </h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <FolderPlus className="h-3.5 w-3.5" /> 추가
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>전체 보기</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{schedules.length}</span>
              </button>

              {categories.map((cat) => {
                const count = schedules.filter(s => s.category_id === cat.id).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* UI Theme Customizer */}
          <div className={`${currentTheme.cardBg} rounded-2xl p-5 shadow-sm border border-slate-200`}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> 화면 테마 배경
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">클릭하면 전체 앱 배경 색상이 변경됩니다.</p>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setCurrentTheme(theme)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition ${
                    currentTheme.id === theme.id ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full border ${theme.bg}`} />
                  <span className="truncate text-slate-600">{theme.name.split(' ') || theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Calendar View Area */}
        <main className="lg:col-span-3">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </main>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingSchedule ? '일정 수정' : '새 일정 추가'}
              </h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">일정 제목</label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="예: 회의, 운동, 시험 공부"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">카테고리</label>
                <select
                  value={scheduleCategoryId}
                  onChange={(e) => setScheduleCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">카테고리 없음</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">시작 시간</label>
                  <input
                    type="datetime-local"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">종료 시간</label>
                  <input
                    type="datetime-local"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Schedule Color Customizer */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">일정 배지 색상 커스텀</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setScheduleBgColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-7 w-7 rounded-full transition transform ${scheduleBgColor === color ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={scheduleBgColor}
                    onChange={(e) => setScheduleBgColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-lg border-0 p-0 ml-1"
                    title="커스텀 색상 선택"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">세부 메모 (선택)</label>
                <textarea
                  value={scheduleDesc}
                  onChange={(e) => setScheduleDesc(e.target.value)}
                  rows={3}
                  placeholder="메모를 입력하세요"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {editingSchedule ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(editingSchedule.id)}
                    className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" /> 삭제
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm"
                  >
                    저장
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">새 카테고리 추가</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">카테고리 이름</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="예: 업무, 개인, 운동, 스터디"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">대표 색상 지정</label>
                <div className="
