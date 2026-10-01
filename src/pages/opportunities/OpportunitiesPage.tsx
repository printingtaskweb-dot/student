import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, Button, Input, SearchBar, Select, Badge, LoadingSpinner, EmptyState } from '@/components/ui'
import { Building2, MapPin, Clock, SlidersHorizontal, X, Bookmark, BookmarkCheck, ArrowRight, Briefcase, IndianRupee } from 'lucide-react'
import { formatSalary, formatWorkMode, formatJobType, timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const JOB_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'project', label: 'Project-based' },
]

const WORK_MODE_OPTIONS = [
  { value: '', label: 'All Modes' },
  { value: 'remote', label: '🌐 Remote' },
  { value: 'hybrid', label: '🔀 Hybrid' },
  { value: 'on_site', label: '🏢 On-site' },
]

const EXP_LEVEL_OPTIONS = [
  { value: '', label: 'Any Experience' },
  { value: 'fresher', label: 'Fresher / Student' },
  { value: 'less_than_1_year', label: '< 1 Year' },
  { value: '1_2_years', label: '1-2 Years' },
  { value: '2_5_years', label: '2-5 Years' },
  { value: '5_plus_years', label: '5+ Years' },
]

const JOB_TYPE_COLORS: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'gray'> = {
  full_time: 'blue',
  internship: 'green',
  part_time: 'purple',
  freelance: 'orange',
  project: 'gray',
}

export default function OpportunitiesPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<any[]>([])
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [jobType, setJobType] = useState('')
  const [workMode, setWorkMode] = useState('')
  const [expLevel, setExpLevel] = useState('')
  const [location, setLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Load student profile ID and saved jobs
  useEffect(() => {
    async function initStudent() {
      if (!user || user.role !== 'student') return
      try {
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (sp) {
          setStudentProfileId(sp.id)
          const { data: saved } = await supabase
            .from('saved_jobs')
            .select('job_id')
            .eq('student_id', sp.id)
          if (saved) setSavedJobIds(new Set(saved.map((s: any) => s.job_id)))
        }
      } catch {
        // ignore
      }
    }
    initStudent()
  }, [user])

  const loadJobs = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('jobs')
        .select('*, business_profiles(business_name, logo_url, location, industry)', { count: 'exact' })
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (search) query = query.ilike('title', `%${search}%`)
      if (jobType) query = query.eq('job_type', jobType as any)
      if (workMode) query = query.eq('work_mode', workMode as any)
      if (expLevel) query = query.eq('experience_level', expLevel as any)
      if (location) query = query.ilike('location', `%${location}%`)

      const { data, count } = await query.limit(50)
      setJobs(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, jobType, workMode, expLevel, location])

  useEffect(() => {
    const timer = setTimeout(loadJobs, 350)
    return () => clearTimeout(timer)
  }, [loadJobs])

  const handleToggleSave = async (jobId: string) => {
    if (!user || !studentProfileId) {
      toast.error('Please sign in to save jobs')
      return
    }
    setSavingId(jobId)
    try {
      if (savedJobIds.has(jobId)) {
        await supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('student_id', studentProfileId)
        setSavedJobIds(prev => { const n = new Set(prev); n.delete(jobId); return n })
        toast.success('Removed from saved')
      } else {
        await supabase.from('saved_jobs').insert({ job_id: jobId, student_id: studentProfileId })
        setSavedJobIds(prev => new Set([...prev, jobId]))
        toast.success('Saved! ✨')
      }
    } catch {
      toast.error('Action failed')
    } finally {
      setSavingId(null)
    }
  }

  const hasFilters = jobType || workMode || expLevel || location

  const clearFilters = () => {
    setJobType('')
    setWorkMode('')
    setExpLevel('')
    setLocation('')
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Explore Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Searching...' : `${totalCount} active jobs, internships & projects`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(v => !v)}
          leftIcon={<SlidersHorizontal size={15} />}
          className={showFilters ? 'border-primary-400 bg-primary-50 text-primary-700' : ''}
        >
          Filters {hasFilters && <span className="ml-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{[jobType, workMode, expLevel, location].filter(Boolean).length}</span>}
        </Button>
      </div>

      {/* Search + Quick Filters */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by job title, company, or keyword..."
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            <Select options={JOB_TYPE_OPTIONS} value={jobType} onChange={e => setJobType(e.target.value)} />
            <Select options={WORK_MODE_OPTIONS} value={workMode} onChange={e => setWorkMode(e.target.value)} />
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
            <div className="flex-1">
              <Input
                placeholder="📍 Filter by location (e.g. Mumbai, Delhi)"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <Select
              options={EXP_LEVEL_OPTIONS}
              value={expLevel}
              onChange={e => setExpLevel(e.target.value)}
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X size={14} />}>
                Clear All
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {jobType && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">{formatJobType(jobType)} <button onClick={() => setJobType('')}><X size={12} /></button></span>}
          {workMode && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">{formatWorkMode(workMode)} <button onClick={() => setWorkMode('')}><X size={12} /></button></span>}
          {expLevel && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">{EXP_LEVEL_OPTIONS.find(o => o.value === expLevel)?.label} <button onClick={() => setExpLevel('')}><X size={12} /></button></span>}
          {location && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-200">📍 {location} <button onClick={() => setLocation('')}><X size={12} /></button></span>}
        </div>
      )}

      {/* Job List */}
      {loading ? (
        <LoadingSpinner size="lg" text="Finding best opportunities for you..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description="Try adjusting your search query or clearing some filters."
          icon={<Briefcase size={40} className="text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <Card key={job.id} hover className="flex flex-col justify-between group">
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {job.business_profiles?.logo_url ? (
                      <img
                        src={job.business_profiles.logo_url}
                        alt={job.business_profiles?.business_name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                        {job.business_profiles?.business_name?.[0] || 'B'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 size={11} /> {job.business_profiles?.business_name || 'Company'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {job.is_featured && (
                      <Badge variant="yellow">⭐ Featured</Badge>
                    )}
                    <Badge variant={JOB_TYPE_COLORS[job.job_type] || 'gray'}>
                      {formatJobType(job.job_type)}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                  {job.description}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {job.location || 'Remote'}</span>
                  <span className="flex items-center gap-1">💼 {formatWorkMode(job.work_mode)}</span>
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <IndianRupee size={11} /> {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                  )}
                  {job.application_deadline && (
                    <span className="flex items-center gap-1 text-red-500">
                      <Clock size={11} /> Deadline: {new Date(job.application_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                <span className="text-gray-400">{timeAgo(job.created_at)}</span>
                <div className="flex items-center gap-2">
                  {user?.role === 'student' && (
                    <button
                      onClick={() => handleToggleSave(job.id)}
                      disabled={savingId === job.id}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
                      title={savedJobIds.has(job.id) ? 'Remove from saved' : 'Save job'}
                    >
                      {savedJobIds.has(job.id)
                        ? <BookmarkCheck size={15} className="text-primary-600" />
                        : <Bookmark size={15} />
                      }
                    </button>
                  )}
                  <Link
                    to={`/opportunities/${job.slug}`}
                    className="font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    View & Apply <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
