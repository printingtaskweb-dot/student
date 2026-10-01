import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, Button, Badge, LoadingSpinner, EmptyState } from '@/components/ui'
import {
  Briefcase, FileText, BookmarkCheck, Trophy, Sparkles,
  ArrowRight, MapPin, Building2, UserCheck, Bot, CheckCircle2, Navigation
} from 'lucide-react'
import { formatSalary, formatWorkMode, timeAgo } from '@/lib/utils'
import { ResumeGeneratorModal } from '@/components/ai/ResumeGeneratorModal'
import type { JobWithDetails, ApplicationWithDetails } from '@/types'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ applications: 0, saved: 0, shortlisted: 0 })
  const [recentApplications, setRecentApplications] = useState<ApplicationWithDetails[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<JobWithDetails[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false)

  useEffect(() => {
    async function loadStudentData() {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        let { data: sp } = await supabase
          .from('student_profiles')
          .select('*, primary_category:categories(name)')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!sp) {
          const { data: newSp } = await supabase
            .from('student_profiles')
            .upsert({
              user_id: user.id,
              headline: 'Aspiring Professional',
              bio: '',
              experience_level: 'fresher',
            }, { onConflict: 'user_id' })
            .select('*, primary_category:categories(name)')
            .maybeSingle()
          sp = newSp
        }

        setStudentProfile(sp)

        if (sp?.id) {
          const [{ count: appCount }, { count: savedCount }, { count: shortCount }] = await Promise.all([
            supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', sp.id),
            supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('student_id', sp.id),
            supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', sp.id).eq('status', 'shortlisted'),
          ])

          setStats({ applications: appCount || 0, saved: savedCount || 0, shortlisted: shortCount || 0 })

          const { data: apps } = await supabase
            .from('applications')
            .select('*, jobs(*, business_profiles(*))')
            .eq('student_id', sp.id)
            .order('created_at', { ascending: false })
            .limit(4)

          setRecentApplications(apps || [])
        }

        const { data: jobs } = await supabase
          .from('jobs')
          .select('*, business_profiles(*), job_skills(*, skills(*))')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(4)

        setRecommendedJobs(jobs || [])
      } catch (err) {
        console.error('Student dashboard notice:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStudentData()
  }, [user])

  if (loading) return <LoadingSpinner size="lg" text="Loading your dashboard..." />

  const completionScore = studentProfile?.profile_completion || 70

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── WELCOME HERO (Obsidian Black + White + #2563eb) ── */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-[#090d16] text-white border border-gray-800 shadow-xl overflow-hidden">
        {/* Luminous Blue Aura */}
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[#2563eb]/25 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-3 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
              Student Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Student'}! 👋
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 leading-relaxed">
              Track live applications, auto-format ATS-ready resumes with AI, and apply directly to hiring partners.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button
                size="sm"
                onClick={() => setIsResumeModalOpen(true)}
                className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-md hover:shadow-[#2563eb]/30 font-semibold"
                leftIcon={<Sparkles size={14} />}
              >
                Generate AI Resume
              </Button>
              <Link
                to="/opportunities"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all inline-flex items-center gap-1.5"
              >
                <Briefcase size={14} /> Browse Jobs
              </Link>
              <Link
                to="/profile"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all inline-flex items-center gap-1.5"
              >
                <UserCheck size={14} /> Edit Profile
              </Link>
            </div>
          </div>

          {/* Profile Strength Widget */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2">
              <span>Profile Strength</span>
              <span className="text-[#60a5fa] font-bold">{completionScore}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mb-3">
              <div
                className="bg-[#2563eb] h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {completionScore >= 80 ? '✓ Your profile is ranked at top of searches' : 'Add your education & links to rank higher'}
            </p>
          </div>
        </div>
      </div>

      {/* ── METRICS OVERVIEW (Clean Minimalist White Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover className="p-5 border border-gray-200/80 flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-gray-950">{stats.applications}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Submitted Applications</p>
          </div>
          <div className="w-11 h-11 bg-[#eff6ff] text-[#2563eb] rounded-xl flex items-center justify-center border border-[#bfdbfe]/50">
            <FileText size={20} />
          </div>
        </Card>

        <Card hover className="p-5 border border-gray-200/80 flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-gray-950">{stats.saved}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Saved Opportunities</p>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-200/60">
            <BookmarkCheck size={20} />
          </div>
        </Card>

        <Card hover className="p-5 border border-gray-200/80 flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-gray-950">{stats.shortlisted}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">Shortlisted for Review</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-200/60">
            <CheckCircle2 size={20} />
          </div>
        </Card>
      </div>

      {/* ── RECOMMENDED JOBS SECTION ── */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Recommended Opportunities</h2>
            <p className="text-xs text-gray-500">Curated opportunities matching fresh talent and student profiles</p>
          </div>
          <Link
            to="/opportunities"
            className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] flex items-center gap-1 group"
          >
            View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {recommendedJobs.length === 0 ? (
          <EmptyState title="No opportunities available yet" description="Check back soon for new postings from verified companies!" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map(job => (
              <Card key={job.id} hover className="flex flex-col justify-between p-5 border border-gray-200/80">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-950 line-clamp-1">{job.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 size={12} /> {job.business_profiles?.business_name || 'Verified Company'}
                      </p>
                    </div>
                    <Badge variant="blue">{job.job_type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 my-2.5">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {job.location || 'Remote'}</span>
                    <span>•</span>
                    <span>{formatWorkMode(job.work_mode)}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-900">{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <span className="text-gray-400">{timeAgo(job.created_at)}</span>
                  <Link to={`/opportunities/${job.slug}`} className="font-bold text-[#2563eb] hover:underline flex items-center gap-0.5">
                    Apply Now →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resume Generator Modal */}
      <ResumeGeneratorModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />
    </div>
  )
}
