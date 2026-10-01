import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, Badge, LoadingSpinner } from '@/components/ui'
import { MapPin, Mail, Github, ExternalLink, Globe, Linkedin, GraduationCap, Briefcase, Code2, CheckCircle2, ArrowLeft, Calendar } from 'lucide-react'
import { formatExperienceLevel, formatDate, getApplicationStatusColor } from '@/lib/utils'

export default function StudentPublicProfile() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [education, setEducation] = useState<any[]>([])
  const [experience, setExperience] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [availability, setAvailability] = useState<any>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }

    async function loadProfile() {
      try {
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('*, profiles(full_name, email, avatar_url, created_at), primary_category:categories(name, color, icon), student_skills(id, proficiency, skills(id, name))')
          .eq('id', id)
          .single()

        setStudent(sp)

        if (sp) {
          const [{ data: edu }, { data: exp }, { data: proj }, { data: avail }] = await Promise.all([
            supabase.from('student_education').select('*').eq('student_id', id).order('end_year', { ascending: false }),
            supabase.from('student_experience').select('*').eq('student_id', id).order('start_date', { ascending: false }),
            supabase.from('student_projects').select('*').eq('student_id', id).order('created_at', { ascending: false }),
            supabase.from('student_availability').select('*').eq('student_id', id).maybeSingle(),
          ])
          setEducation(edu || [])
          setExperience(exp || [])
          setProjects(proj || [])
          setAvailability(avail)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [id])

  if (loading) return <LoadingSpinner size="lg" text="Loading profile..." />
  if (!student) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Profile not found.</p>
      <Link to="/talent" className="text-primary-600 text-sm mt-2 inline-block">← Back to Talent</Link>
    </div>
  )

  const name = student.profiles?.full_name || 'Student'
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
  const skills = student.student_skills || []
  const availTypes: string[] = availability?.types || []

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Link to="/talent" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={15} /> Back to Talent Directory
      </Link>

      {/* Hero Card */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {student.profiles?.avatar_url ? (
              <img src={student.profiles.avatar_url} alt={name} className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-2xl">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{name}</h1>
              {student.is_open_to_work && (
                <Badge variant="green">✓ Open to Work</Badge>
              )}
            </div>

            {student.headline && (
              <p className="text-sm text-gray-600 mb-2">{student.headline}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {student.primary_category && (
                <Badge variant="blue">{student.primary_category.name}</Badge>
              )}
              <Badge variant="gray">{formatExperienceLevel(student.experience_level)}</Badge>
              {availTypes.slice(0, 2).map((t: string, i: number) => (
                <Badge key={i} variant="purple">{t.replace('_', '-')}</Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {student.location && (
                <span className="flex items-center gap-1"><MapPin size={12} /> {student.location}</span>
              )}
              {student.profiles?.email && (
                <a href={`mailto:${student.profiles.email}`} className="flex items-center gap-1 hover:text-primary-600">
                  <Mail size={12} /> {student.profiles.email}
                </a>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2 mt-3">
              {student.github_url && (
                <a href={student.github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors">
                  <Github size={13} /> GitHub
                </a>
              )}
              {student.linkedin_url && (
                <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors">
                  <Linkedin size={13} /> LinkedIn
                </a>
              )}
              {student.portfolio_url && (
                <a href={student.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors">
                  <Globe size={13} /> Portfolio
                </a>
              )}
              {student.resume_url && (
                <a href={student.resume_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <ExternalLink size={13} /> Resume
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {student.bio && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{student.bio}</p>
          </div>
        )}
      </Card>

      {/* Skills */}
      {skills.length > 0 && (
        <Card padding="lg">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-primary-600" /> Skills & Tools
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((ss: any) => (
              <span
                key={ss.id}
                className="px-3 py-1 rounded-lg bg-primary-50 border border-primary-100 text-primary-800 text-xs font-medium"
              >
                {ss.skills?.name}
                {ss.proficiency && ss.proficiency !== 'intermediate' && (
                  <span className="ml-1 text-primary-500 font-normal">({ss.proficiency})</span>
                )}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card padding="lg">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-primary-600" /> Education
          </h2>
          <div className="space-y-4">
            {education.map((edu: any) => (
              <div key={edu.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{edu.institution}</p>
                  <p className="text-xs text-gray-600">
                    {[edu.degree, edu.field_of_study ? `in ${edu.field_of_study}` : ''].filter(Boolean).join(' ')}
                  </p>
                  {(edu.start_year || edu.end_year) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {edu.start_year || ''}{edu.start_year && edu.end_year ? ' – ' : ''}{edu.is_current ? 'Present' : edu.end_year || ''}
                    </p>
                  )}
                  {edu.grade && <p className="text-xs text-gray-500">Grade: {edu.grade}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <Card padding="lg">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-primary-600" /> Work Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp: any) => (
              <div key={exp.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{exp.role}</p>
                  <p className="text-xs text-gray-600">{exp.company}</p>
                  {(exp.start_date || exp.end_date) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {exp.start_date ? formatDate(exp.start_date, 'MMM yyyy') : ''}{exp.start_date ? ' – ' : ''}{exp.is_current ? 'Present' : exp.end_date ? formatDate(exp.end_date, 'MMM yyyy') : ''}
                    </p>
                  )}
                  {exp.description && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{exp.description}</p>}
                  {exp.skills_used?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {exp.skills_used.map((s: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Card padding="lg">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code2 size={16} className="text-primary-600" /> Projects
          </h2>
          <div className="space-y-4">
            {projects.map((proj: any) => (
              <div key={proj.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-gray-900">{proj.title}</h3>
                  <div className="flex gap-1.5">
                    {proj.github_url && (
                      <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900">
                        <Github size={14} />
                      </a>
                    )}
                    {proj.project_url && (
                      <a href={proj.project_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
                {proj.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{proj.description}</p>
                )}
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.map((tech: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded border border-primary-100">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
