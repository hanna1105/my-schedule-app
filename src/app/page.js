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
  Save,
  Upload,
  Eye,
  EyeOff
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
  parseISO,
  startOfDay
} from 'date-fns'
import { ko } from 'date-fns/locale/ko'

// 기본 파스텔 테마 설정
const DEFAULT_THEME = {
  id: 'default_pastel',
  name: '파스텔 드림 (기본)',
  primaryColor: '#FFAFCC',    // 포인트 핑크
  bgColor: '#BDE0FE',         // 소프트 블루
  bgImage: '',
  headerTextColor: '#3D344D',
  bodyTextColor: '#4A3E59',
  sundayColor: '#EF4444',     // 일요일 빨강
  saturdayColor: '#3B82F6',   // 토요일 파랑
  cardBgColor: '#FFFFFF'
}

const COLOR_PRESETS = ['#CDB4DB', '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#3B82F6', '#10B981', '#F59E0B']

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

  // --- 실시간 테마 커스텀 상태 ---
  const [activeTheme, setActiveTheme] = useState(DEFAULT_THEME)
  const [savedThemes, setSavedThemes] = useState([DEFAULT_THEME])
  const [newThemeName, setNewThemeName] = useState('')
  const [showThemeEditor, setShowThemeEditor] = useState(false)
  const [hideThemePanel, setHideThemePanel] = useState(false) // 전체 테마 패널 숨기기 상태

  // Modal States
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Schedule Form States
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleDesc, setScheduleDesc] = useState('')
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')
  const [scheduleCategoryId, setScheduleCategoryId] = useState('')
  const [scheduleBgColor, setScheduleBgColor] = useState('#FFAFCC')

  // Category Form States
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#FFAFCC')

  // 로컬 스토리지에서 저장된 테마 불러오기
  useEffect(() => {
    try {
      const localThemes = localStorage.getItem('my_custom_themes_v4')
      if (localThemes) {
        const parsed = JSON.parse(localThemes)
        if (Array.isArray(parsed) && parsed.length > 0) setSavedThemes(parsed)
      }
      const localActiveTheme = localStorage.getItem('my_active_theme_v4')
      if (localActiveTheme) {
        const parsedActive = JSON.parse(localActiveTheme)
        if (parsedActive) setActiveTheme(parsedActive)
      }
    } catch (e) {
      console.error('Error loading themes:', e)
    }
  }, [])

  const saveThemesToLocal = (themesList, currentActive) => {
    try {
      localStorage.setItem('my_custom_themes_v4', JSON.stringify(themesList))
      if (currentActive) {
        localStorage.setItem('my_active_theme_v4', JSON.stringify(currentActive))
      }
    } catch (e) {
      console.error('Error saving themes:', e)
    }
  }

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

  const applyTheme = (theme) => {
    setActiveTheme(theme)
    saveThemesToLocal(savedThemes, theme)
  }

  const handleSaveCurrentTheme = () => {
    if (!newThemeName.trim()) return alert('저장할 테마 이름을 입력하세요.')
    const newThemeObj = {
      ...activeTheme,
      id: 'custom_' + Date.now(),
      name: newThemeName.trim()
    }
    const updatedList = [...savedThemes, newThemeObj]
    setSavedThemes(updatedList)
    setActiveTheme(newThemeObj)
    saveThemesToLocal(updatedList, newThemeObj)
    setNewThemeName('')
    alert(`'${newThemeObj.name}' 테마가 저장되었습니다!`)
  }

  const handleDeleteTheme = (themeId, e) => {
    e.stopPropagation()
    if (savedThemes.length <= 1) return alert('최소 1개의 테마는 남아있어야 합니다.')
    if (!confirm('이 테마를 삭제하시겠습니까?')) return

    const updatedList = savedThemes.filter(t => t.id !== themeId)
    setSavedThemes(updatedList)
    const nextActive = updatedList[0] || DEFAULT_THEME
    setActiveTheme(nextActive)
    saveThemesToLocal(updatedList, nextActive)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return alert('이미지 파일(.jpg, .png, .gif 등)만 선택할 수 있습니다.')
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (dataUrl) {
        setActiveTheme({
          ...activeTheme,
          bgImage: dataUrl
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const openNewScheduleModal = (defaultDate = null) => {
    setEditingSchedule(null)
    setScheduleTitle('')
    setScheduleDesc('')
    const targetDate = defaultDate || new Date()
    setScheduleStart(format(targetDate, "yyyy-MM-dd'T'10:00"))
    setScheduleEnd(format(targetDate, "yyyy-MM-dd'T'11:00"))
    setScheduleCategoryId(categories[0]?.id || '')
    setScheduleBgColor(categories[0]?.color || activeTheme.primaryColor)
    setShowScheduleModal(true)
  }

  const openEditScheduleModal = (sched) => {
    setEditingSchedule(sched)
    setScheduleTitle(sched.title)
    setScheduleDesc(sched.description || '')
    setScheduleStart(sched.start_time ? format(parseISO(sched.start_time), "yyyy-MM-dd'T'HH:mm") : '')
    setScheduleEnd(sched.end_time ? format(parseISO(sched.end_time), "yyyy-MM-dd'T'HH:mm") : '')
    setScheduleCategoryId(sched.category_id || '')
    setScheduleBgColor(sched.background_style || activeTheme.primaryColor)
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

  // 이틀 이상 다일 일정 판별 함수
  const isScheduleOnDay = (sched, day) => {
    if (!sched.start_time) return false
    const targetDay = startOfDay(day)
    const schedStart = startOfDay(parseISO(sched.start_time))
    const schedEnd = sched.end_time ? startOfDay(parseISO(sched.end_time)) : schedStart
    return targetDay >= schedStart && targetDay <= schedEnd
  }

  if (authLoading) return <div className="p-8 text-center text-slate-600">로딩 중...</div>

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">개인 일정 관리 툴</h1>
          <form onSubmit={handleAuth} className="space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" className="w-full border p-2.5 rounded-xl text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="w-full border p-2.5 rounded-xl text-sm" />
            <button type="submit" style={{ backgroundColor: activeTheme.primaryColor }} className="w-full text-white py-3 rounded-xl font-bold shadow-md">
              {isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>
          <button onClick={() => setIsSignUp(!isSignUp)} style={{ color: activeTheme.primaryColor }} className="mt-4 text-xs underline block mx-auto font-bold">
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
      <div style={{ backgroundColor: activeTheme.cardBgColor }} className="rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center text-xs font-bold py-3">
          {weekDays.map((day, idx) => (
            <div key={day} style={{ color: idx === 0 ? activeTheme.sundayColor : idx === 6 ? activeTheme.saturdayColor : activeTheme.bodyTextColor }}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const daySchedules = filteredSchedules.filter(s => isScheduleOnDay(s, day))

            return (
              <div
                key={day.toString()}
                onClick={() => openNewScheduleModal(day)}
                className={`min-h-[110px] p-2 transition hover:opacity-90 cursor-pointer ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      backgroundColor: isToday ? activeTheme.primaryColor : 'transparent',
                      color: isToday ? '#FFFFFF' : day.getDay() === 0 ? activeTheme.sundayColor : day.getDay() === 6 ? activeTheme.saturdayColor : activeTheme.bodyTextColor
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
                      style={{ backgroundColor: sched.background_style || activeTheme.primaryColor }}
                      className="truncate rounded-md px-2 py-0.5 text-xs text-white font-semibold shadow-2xs"
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
        backgroundColor: activeTheme.bgColor,
        backgroundImage: activeTheme.bgImage ? `url('${activeTheme.bgImage}')` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: activeTheme.bodyTextColor
      }}
      className="min-h-screen p-4 md:p-8 transition-all duration-300"
    >
      {/* Header */}
      <header style={{ backgroundColor: activeTheme.cardBgColor }} className="max-w-7xl mx-auto flex items-center justify-between gap-4 mb-6 rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: activeTheme.primaryColor }} className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 style={{ color: activeTheme.headerTextColor }} className="text-lg font-bold">일정 관리 툴</h1>
            <p className="text-xs opacity-70">{user.email}</p>
          </div>
        </div>

        {/* 탭 버튼들 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('month')}
            style={{ backgroundColor: view === 'month' ? activeTheme.primaryColor : '#F1F5F9', color: view === 'month' ? '#FFFFFF' : activeTheme.bodyTextColor }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition"
          >
            월간
          </button>
          <button
            onClick={() => setView('week')}
            style={{ backgroundColor: view === 'week' ? activeTheme.primaryColor : '#F1F5F9', color: view === 'week' ? '#FFFFFF' : activeTheme.bodyTextColor }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition"
          >
            주간
          </button>
          <button
            onClick={() => setView('day')}
            style={{ backgroundColor: view === 'day' ? activeTheme.primaryColor : '#F1F5F9', color: view === 'day' ? '#FFFFFF' : activeTheme.bodyTextColor }}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl transition"
          >
            일간
          </button>
        </div>

        {/* 네비게이션 및 일정 추가 */}
        <div className="flex items-center gap-2">
          <button onClick={prevDate} className="p-2 hover:bg-slate-100 rounded-xl transition"><ChevronLeft className="h-4 w-4" /></button>
          <span style={{ color: activeTheme.headerTextColor }} className="text-sm font-bold min-w-[100px] text-center">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </span>
          <button onClick={nextDate} className="p-2 hover:bg-slate-100 rounded-xl transition"><ChevronRight className="h-4 w-4" /></button>
          
          <button
            onClick={() => openNewScheduleModal()}
            style={{ backgroundColor: activeTheme.primaryColor }}
            className="text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> 일정 추가
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition"><LogOut className="h-5 w-5" /></button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Controls */}
        <aside className="space-y-6">
          {/* Categories */}
          <div style={{ backgroundColor: activeTheme.cardBgColor }} className="rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold opacity-60 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> 카테고리
              </h3>
              <button onClick={() => setShowCategoryModal(true)} style={{ color: activeTheme.primaryColor }} className="text-xs font-bold hover:underline">
                추가
              </button>
            </div>
            <button onClick={() => setSelectedCategory('all')} className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-50 font-semibold mb-2">전체 보기</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="w-full flex items-center gap-2 text-xs p-2.5 rounded-xl hover:bg-slate-50 font-semibold">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Real-time Theme Editor & Presets */}
          <div style={{ backgroundColor: activeTheme.cardBgColor }} className="rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold opacity-60 uppercase tracking-wider flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" /> 실시간 테마 커스텀
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowThemeEditor(!showThemeEditor)}
                  style={{ color: activeTheme.primaryColor }}
                  className="text-xs font-bold underline"
                >
                  {showThemeEditor ? '편집기 닫기' : '편집기'}
                </button>
                {/* 패널 접기/펼치기 눈 아이콘 */}
                <button
                  onClick={() => setHideThemePanel(!hideThemePanel)}
                  className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-0.5"
                  title={hideThemePanel ? '테마 패널 펼치기' : '테마 패널 접기'}
                >
                  {hideThemePanel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!hideThemePanel && (
              <>
                {/* Saved Themes List */}
                <div>
                  <p className="text-[11px] opacity-60 mb-2">내 저장 테마 목록 (클릭하면 변경):</p>
                  <div className="grid grid-cols-2 gap-2">
                    {savedThemes.map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => applyTheme(theme)}
                        style={{ borderColor: activeTheme.id === theme.id ? activeTheme.primaryColor : '#E2E8F0' }}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer hover:shadow-2xs transition ${activeTheme.id === theme.id ? 'ring-2 ring-indigo-200' : ''}`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: theme.primaryColor }} />
                          <span className="text-xs font-bold truncate">{theme.name}</span>
                        </div>
                        {savedThemes.length > 1 && (
                          <button onClick={(e) => handleDeleteTheme(theme.id, e)} className="text-slate-300 hover:text-red-500 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Color Picker Controls */}
                {showThemeEditor && (
                  <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">포인트 색상 (Primary)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTheme.primaryColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, primaryColor: e.target.value })}
                          className="h-7 w-10 cursor-pointer border-0 rounded-md p-0"
                        />
                        <input
                          type="text"
                          value={activeTheme.primaryColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, primaryColor: e.target.value })}
                          className="w-full border p-1 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1">배경 색상 (Background)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTheme.bgColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, bgColor: e.target.value })}
                          className="h-7 w-10 cursor-pointer border-0 rounded-md p-0"
                        />
                        <input
                          type="text"
                          value={activeTheme.bgColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, bgColor: e.target.value })}
                          className="w-full border p-1 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* 내 PC 이미지 파일 선택 버튼 */}
                    <div>
                      <label className="block text-[11px] font-bold mb-1">배경 이미지 파일 (내 PC에서 선택)</label>
                      <label className="flex items-center justify-center gap-1.5 w-full py-2 border border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition mb-2">
                        <Upload className="h-3.5 w-3.5 text-indigo-600" /> 내 PC에서 사진 선택하기
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                      {activeTheme.bgImage && (
                        <button
                          onClick={() => setActiveTheme({ ...activeTheme, bgImage: '' })}
                          className="text-[10px] text-red-500 hover:underline block mb-1"
                        >
                          [배경 이미지 제거]
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1">또는 인터넷 이미지 URL 주소</label>
                      <input
                        type="text"
                        value={activeTheme.bgImage || ''}
                        onChange={(e) => setActiveTheme({ ...activeTheme, bgImage: e.target.value })}
                        placeholder="https://... 이미지 URL 주소"
                        className="w-full border p-1.5 rounded-md text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1">상단 타이틀 글자색</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTheme.headerTextColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, headerTextColor: e.target.value })}
                          className="h-7 w-10 cursor-pointer border-0 rounded-md p-0"
                        />
                        <input
                          type="text"
                          value={activeTheme.headerTextColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, headerTextColor: e.target.value })}
                          className="w-full border p-1 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1">본문/카테고리 글자색</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTheme.bodyTextColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, bodyTextColor: e.target.value })}
                          className="h-7 w-10 cursor-pointer border-0 rounded-md p-0"
                        />
                        <input
                          type="text"
                          value={activeTheme.bodyTextColor}
                          onChange={(e) => setActiveTheme({ ...activeTheme, bodyTextColor: e.target.value })}
                          className="w-full border p-1 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* 일요일 글자색 */}
                    <div>
                      <label className="block text-[11px] font-bold mb-1">일요일 글자색</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTheme.sundayColor || '#EF4444'}
                          onChange={(e) => setActiveTheme({ ...activeTheme, sundayColor: e.target.value })}
                          className="h-7 w-10 cursor-pointer border-0 rounded-md p-0"
                        />
                        <input
                          type="text"
                          value={activeTheme.sundayColor || '#EF4444'}
                          onChange={(e) => setActiveTheme({ ...activeTheme, sundayColor: e.target.value })}
                          className="w-full border p-1 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* 토요일 글자색 */}
                    <div>
                      <label className="block text-[11px] font-bold mb-1">토요일 글자색</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeTheme.saturdayColor || '#3B82F6'}
                          onChange={(e) => setActiveTheme({ ...activeTheme, saturdayColor: e.target.value })}
                          className="h-7 w-10 cursor-pointer border-0 rounded-md p-0"
                        />
                        <input
                          type="text"
                          value={activeTheme.saturdayColor || '#3B82F6'}
                          onChange={(e) => setActiveTheme({ ...activeTheme, saturdayColor: e.target.value })}
                          className="w-full border p-1 rounded-md text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Save Theme Action */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <input
                        type="text"
                        value={newThemeName}
                        onChange={(e) => setNewThemeName(e.target.value)}
                        placeholder="새 테마 이름 (예: 리본 핑크 테마)"
                        className="w-full border p-1.5 rounded-md text-xs"
                      />
                      <button
                        onClick={handleSaveCurrentTheme}
                        style={{ backgroundColor: activeTheme.primaryColor }}
                        className="w-full text-white py-1.5 rounded-md font-bold flex items-center justify-center gap-1"
                      >
                        <Save className="h-3.5 w-3.5" /> 현재 설정 저장하기
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">일정 색상</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button key={color} type="button" onClick={() => setScheduleBgColor(color)} style={{ backgroundColor: color }} className="h-6 w-6 rounded-full" />
                  ))}
                  <input type="color" value={scheduleBgColor} onChange={(e) => setScheduleBgColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded-lg border-0 p-0" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-xs border rounded-xl font-bold">취소</button>
                <button type="submit" style={{ backgroundColor: activeTheme.primaryColor }} className="px-5 py-2 text-xs text-white rounded-xl font-bold shadow-md">저장</button>
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
                <button type="submit" style={{ backgroundColor: activeTheme.primaryColor }} className="px-5 py-2 text-xs text-white rounded-xl font-bold shadow-md">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
