'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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

const COLOR_PRESETS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']

const THEMES = [
  { id: 'slate', name: '기본 슬레이트', bg: 'bg-slate-100', cardBg: 'bg-white' },
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

  if (authLoading) return <div className="p-8 text-center text-slate-600">로딩 중...</div>

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">개인 일정 관리 툴</h1>
          <form onSubmit={handleAuth} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="w-full border p-2.5 rounded-xl text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="w-full border p-2.5 rounded-xl text-sm" />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">
              {isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} className="mt-4 text-xs text-indigo-600 underline block mx-auto">
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
      <div className={`${currentTheme.cardBg} rounded-2xl shadow-sm border border-slate-200 overflow-hidden`}>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 py-3">
          {weekDays.map((day, idx) => (
            <div key={day} className={idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : ''}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const daySchedules = filteredSchedules.filter(s => isSameDay(parseISO(s.start_time), day))
