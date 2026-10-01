import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, SearchBar, Select, Badge, LoadingSpinner, EmptyState } from '@/components/ui'
import { MapPin, Star, CheckCircle2, Users, Target, GraduationCap, Briefcase, ArrowRight } from 'lucide-react'
import { formatExperienceLevel } from '@/lib/utils'

const CATEGORY_DEFAULT = [{ value: '', label: 'All Domains' }]

const EXP_OPTIONS = [
  { value: '', label: 'Any Level' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'less_than_1_year', label: '< 1 Year' },
  { value: '1_2_years', label: '1-2 Years' },
  { value: '2_5_years', label: '2-5 Years' },
  { value: '5_plus_years', label: '5+ Years' },
]

const AVAIL_OPTIONS = [
  { value: '', label: 'Any Availability' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'part_time', label: 'Part-time' },
]

const PROFICIENCY_COLORS: Record<string, 'blue' | 'green' | 'purple' | 'orange'> = {
  beginner: 'blue',
  intermediate: 'green',
  advanced: 'purple',
  expert: 'orange',
}

export default function TalentPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [expLevel, setExpLevel] = useState('')
  const [availability, setAvailability] = useState('')

  // Business "looking for" banner data
  const [businessNeeds, setBusinessNeeds] = useState<string[]>([])

  useEffect(() => {
    async function loadMeta() {
      const { data: cats } = await supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order')
      setCategories(cats || [])

      // Aggregate what businesses are looking for
      const { data: biz } = await supabase.from('business_profiles').select('looking_for').not('looking_for', 'is', null)
      if (biz) {
        const allNeeds: string[] = biz.flatMap((b: any) => b.looking_for || [])
        const freq: Record<string, number> = {}
        allNeeds.forEach(n => { freq[n] = (freq[n] || 0) + 1 })
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0])
        setBusinessNeeds(sorted)
      }
    }
    loadMeta()
  }, [])

  const loadTalent = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('student_profiles')
        .select(
          '*, profiles!inner(full_name, email, avatar_url, status), primary_category:categories(name, color), student_skills(id, proficiency, skills(id, name))',
          { count: 'exact' }
        )
        .eq('profiles.status', 'active')
        .eq('is_available', true)
        .order('profile_completion', { ascending: false })

      if (categoryId) query = query.eq('primary_category_id', categoryId)
      if (expLevel) query = query.eq('experience_level', expLevel)

      const { data, count } = await query.limit(48)
      let filtered = data || []

      // Client-side filter: search by name or headline
      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(
          (s: any) =>
            s.profiles?.full_name?.toLowerCase().includes(q) ||
            s.headline?.toLowerCase().includes(q) ||
            s.student_skills?.some((sk: any) => sk.skills?.name?.toLowerCase().includes(q))
        )
      }

      setStudents(filtered)
      setTotalCount(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, expLevel, availability])

  useEffect(() => {
    const timer = setTimeout(loadTalent, 350)
    return () => clearTimeout(timer)
  }, [loadTalent])

  const categoryOptions = [
    ...CATEGORY_DEFAULT,
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover Student Talent</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? 'Searching...' : `${totalCount} skilled candidates available for hire`}
        </p>
      </div>

      {/* What Businesses Are Looking For */}
      {businessNeeds.length > 0 && (
        <div className="relative rounded-2xl p-5 bg-[#090d16] text-white border border-gray-800 shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563eb]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start gap-3 mb-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563eb] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Target size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">What Businesses Are Looking For</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Most in-demand student skills requested by active hiring partners</p>
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap gap-1.5">
            {businessNeeds.map((need, i) => (
              <button
                key={i}
                onClick={() => setSearch(need)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white border border-white/15 hover:bg-[#2563eb] hover:border-[#2563eb] transition-all"
              >
                {need}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, skill, headline..."
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            <Select options={categoryOptions} value={categoryId} onChange={e => setCategoryId(e.target.value)} />
            <Select options={EXP_OPTIONS} value={expLevel} onChange={e => setExpLevel(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Student Grid */}
      {loading ? (
        <LoadingSpinner size="lg" text="Discovering talented students..." />
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Try broadening your search or clearing filters."
          icon={<Users size={40} className="text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(sp => {
            const name = sp.profiles?.full_name || 'Student'
            const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            const topSkills = sp.student_skills?.slice(0, 5) || []
            const completionColor = sp.profile_completion >= 80 ? 'text-emerald-600' : sp.profile_completion >= 50 ? 'text-amber-600' : 'text-gray-400'

            return (
              <Card key={sp.id} hover className="flex flex-col justify-between">
                <div>
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      {sp.profiles?.avatar_url ? (
                        <img src={sp.profiles.avatar_url} alt={name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {initials}
                        </div>
                      )}
                      {sp.is_open_to_work && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" title="Open to work" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {sp.primary_category?.name || 'Student'} · {formatExperienceLevel(sp.experience_level)}
                      </p>
                    </div>
                  </div>

                  {/* Headline */}
                  {sp.headline && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">{sp.headline}</p>
                  )}

                  {/* Skills */}
                  {topSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {topSkills.map((ss: any) => (
                        <span
                          key={ss.id}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium"
                        >
                          {ss.skills?.name}
                        </span>
                      ))}
                      {(sp.student_skills?.length || 0) > 5 && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs">
                          +{sp.student_skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Location + Profile completion */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {sp.location || 'India'}</span>
                    {sp.profile_completion > 0 && (
                      <span className={`flex items-center gap-1 font-medium ${completionColor}`}>
                        <CheckCircle2 size={11} /> {sp.profile_completion}% complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    {sp.is_open_to_work && (
                      <Badge variant="green">Open to Work</Badge>
                    )}
                  </div>
                  <Link to={`/talent/${sp.id}`} className="font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    View Profile <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
