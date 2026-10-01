import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, Button, Input, Textarea, Select, MultiSelect, LoadingSpinner } from '@/components/ui'
import {
  User, Mail, Phone, MapPin, Globe, Github, Linkedin,
  Briefcase, GraduationCap, Save, Plus, Trash2, CheckCircle2, Sparkles, Code2, Calendar
} from 'lucide-react'
import { BUILTIN_CATEGORIES, getAvailableCategories, getAvailableSkills } from '@/lib/categories'
import toast from 'react-hot-toast'

const CAT_ICONS: Record<string, string> = {
  'software': '💻', 'web': '💻', 'development': '💻', 'dev': '💻',
  'design': '🎨', 'ui': '🎨', 'ux': '🎨',
  'marketing': '📈', 'growth': '📈',
  'video': '🎬', 'media': '🎬', 'content': '✍️',
  'data': '🤖', 'ai': '🤖', 'ml': '🤖',
  'finance': '💰', 'business': '💼', 'sales': '📊',
  'writing': '✍️', 'technical': '✍️',
  'admin': '🖥️', 'operations': '🖥️',
}
function getCatIcon(cat: any): string {
  if (cat.icon && !cat.icon.includes('dY') && !cat.icon.includes('0x') && cat.icon.length <= 4) return cat.icon
  const name = (cat.name || '').toLowerCase()
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (name.includes(key)) return icon
  }
  return '💼'
}

const EXP_LEVEL_OPTIONS = [
  { value: 'fresher', label: 'Fresher / Student' },
  { value: 'less_than_1_year', label: '< 1 Year' },
  { value: '1_2_years', label: '1-2 Years' },
  { value: '2_5_years', label: '2-5 Years' },
  { value: '5_plus_years', label: '5+ Years' },
]

const WORK_MODE_OPTIONS = [
  { value: 'remote', label: '🌐 Remote' },
  { value: 'hybrid', label: '🔀 Hybrid' },
  { value: 'on_site', label: '🏢 On-site' },
]

const AVAILABILITY_TYPES = [
  { value: 'internship', label: '🎓 Internship' },
  { value: 'part_time', label: '⏱️ Part-time' },
  { value: 'full_time', label: '💼 Full-time' },
  { value: 'freelance', label: '⚡ Freelance' },
  { value: 'project_based', label: '🚀 Project-based' },
]

const emptyExp = { company: '', role: '', start_date: '', end_date: '', is_current: false, description: '', skills_used: [] as string[] }
const emptyProject = { title: '', description: '', project_url: '', github_url: '', technologies: [] as string[] }
const emptyEdu = { institution: '', degree: '', field_of_study: '', end_year: '' }

export default function StudentProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [studentProfileId, setStudentProfileId] = useState<string | null>(null)
  const [allCategories, setAllCategories] = useState<any[]>(BUILTIN_CATEGORIES)
  const [allSkills, setAllSkills] = useState<any[]>([])

  // Main form
  const [form, setForm] = useState({
    headline: '', bio: '', location: '', phone: '',
    categoryId: '', categoryName: '',
    githubUrl: '', linkedinUrl: '', portfolioUrl: '', resumeUrl: '',
    experienceLevel: 'fresher',
    selectedSkillIds: [] as string[],
    isOpenToWork: true,
  })

  // Education
  const [educationList, setEducationList] = useState<any[]>([])
  const [newEdu, setNewEdu] = useState(emptyEdu)

  // Experience
  const [experienceList, setExperienceList] = useState<any[]>([])
  const [newExp, setNewExp] = useState(emptyExp)
  const [showExpForm, setShowExpForm] = useState(false)

  // Projects
  const [projectList, setProjectList] = useState<any[]>([])
  const [newProject, setNewProject] = useState(emptyProject)
  const [newTech, setNewTech] = useState('')
  const [showProjectForm, setShowProjectForm] = useState(false)

  // Availability
  const [availabilityTypes, setAvailabilityTypes] = useState<string[]>([])
  const [preferredWorkMode, setPreferredWorkMode] = useState('remote')
  const [availabilityId, setAvailabilityId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user) return
      try {
        const [
          { data: p },
          { data: sp },
          { data: catData },
          { data: skillsData },
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('student_profiles').select('*, primary_category:categories(name)').eq('user_id', user.id).maybeSingle(),
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('skills').select('*').eq('is_active', true).order('name'),
        ])

        if (catData && catData.length > 0) setAllCategories(catData)
        if (skillsData && skillsData.length > 0) setAllSkills(skillsData)

        if (sp) {
          setStudentProfileId(sp.id)

          const [
            { data: userSkills },
            { data: edu },
            { data: exp },
            { data: proj },
            { data: avail },
          ] = await Promise.all([
            supabase.from('student_skills').select('skill_id').eq('student_id', sp.id),
            supabase.from('student_education').select('*').eq('student_id', sp.id).order('end_year', { ascending: false }),
            supabase.from('student_experience').select('*').eq('student_id', sp.id).order('start_date', { ascending: false }),
            supabase.from('student_projects').select('*').eq('student_id', sp.id).order('created_at', { ascending: false }),
            supabase.from('student_availability').select('*').eq('student_id', sp.id).maybeSingle(),
          ])

          setEducationList(edu || [])
          setExperienceList(exp || [])
          setProjectList(proj || [])
          if (avail) {
            setAvailabilityTypes(avail.types || [])
            setPreferredWorkMode(avail.preferred_work_mode || 'remote')
            setAvailabilityId(avail.id)
          }

          setForm({
            headline: sp.headline || '',
            bio: sp.bio || '',
            location: sp.location || '',
            phone: p?.phone || '',
            categoryId: sp.primary_category_id || '',
            categoryName: sp.primary_category?.name || '',
            githubUrl: sp.github_url || '',
            linkedinUrl: sp.linkedin_url || '',
            portfolioUrl: sp.portfolio_url || '',
            resumeUrl: sp.resume_url || '',
            experienceLevel: sp.experience_level || 'fresher',
            selectedSkillIds: (userSkills || []).map((s: any) => s.skill_id),
            isOpenToWork: sp.is_open_to_work !== false,
          })
        }
      } catch (err) {
        console.error('Profile load notice:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // Skills based on selected category
  const availableSkillsList = getAvailableSkills(form.categoryId, allSkills.length > 0 ? allSkills : undefined)
  const skillOptions = availableSkillsList.map((s: any) => ({ value: s.id || s.slug || s.name, label: s.name }))
  const categoryOptions = allCategories.map((c: any) => ({
    value: c.id || c.slug,
    label: `${getCatIcon(c)} ${c.name}`,
  }))

  // ── Save main profile ──
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ phone: form.phone || null } as any).eq('id', user.id)

      const isDbUuid = form.categoryId && form.categoryId.length > 30
      const payload: any = {
        user_id: user.id,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        github_url: form.githubUrl || null,
        linkedin_url: form.linkedinUrl || null,
        portfolio_url: form.portfolioUrl || null,
        resume_url: form.resumeUrl || null,
        experience_level: form.experienceLevel as any,
        is_open_to_work: form.isOpenToWork,
      }
      if (isDbUuid) payload.primary_category_id = form.categoryId

      // Calculate rough profile completion
      const fields = [form.headline, form.bio, form.location, form.githubUrl, form.resumeUrl]
      const filledCount = fields.filter(Boolean).length
      payload.profile_completion = Math.round((filledCount / fields.length) * 100)

      const { data: spData } = await supabase
        .from('student_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle()

      // Sync skills
      const spId = spData?.id || studentProfileId
      if (spId && form.selectedSkillIds.length > 0) {
        const validIds = form.selectedSkillIds.filter(id => id && id.length > 20)
        if (validIds.length > 0) {
          await supabase.from('student_skills').delete().eq('student_id', spId)
          await supabase.from('student_skills').insert(
            validIds.map(skId => ({ student_id: spId, skill_id: skId, proficiency: 'intermediate' as const }))
          )
        }
      }

      // Save availability
      if (spId) {
        await supabase.from('student_availability').upsert({
          student_id: spId,
          types: availabilityTypes as any,
          preferred_work_mode: preferredWorkMode as any,
        }, { onConflict: 'student_id' })
      }

      if (!studentProfileId && spData?.id) setStudentProfileId(spData.id)
      toast.success('✅ Profile updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ── Education handlers ──
  const handleAddEducation = async () => {
    if (!newEdu.institution || !studentProfileId) {
      toast.error('Institution name is required')
      return
    }
    try {
      const { data } = await supabase.from('student_education').insert({
        student_id: studentProfileId,
        institution: newEdu.institution,
        degree: newEdu.degree || null,
        field_of_study: newEdu.field_of_study || null,
        end_year: newEdu.end_year ? parseInt(newEdu.end_year) : null,
      } as any).select().single()
      setEducationList(p => [...p, data])
      setNewEdu(emptyEdu)
      toast.success('Education added!')
    } catch {
      toast.error('Failed to add education')
    }
  }
  const handleDeleteEducation = async (id: string) => {
    await supabase.from('student_education').delete().eq('id', id)
    setEducationList(p => p.filter(e => e.id !== id))
    toast.success('Removed')
  }

  // ── Experience handlers ──
  const handleAddExperience = async () => {
    if (!newExp.company || !newExp.role || !studentProfileId) {
      toast.error('Company and role are required')
      return
    }
    try {
      const { data } = await supabase.from('student_experience').insert({
        student_id: studentProfileId,
        company: newExp.company,
        role: newExp.role,
        start_date: newExp.start_date || null,
        end_date: newExp.is_current ? null : (newExp.end_date || null),
        is_current: newExp.is_current,
        description: newExp.description || null,
        skills_used: newExp.skills_used.length > 0 ? newExp.skills_used : null,
      } as any).select().single()
      setExperienceList(p => [data, ...p])
      setNewExp(emptyExp)
      setShowExpForm(false)
      toast.success('Experience added!')
    } catch {
      toast.error('Failed to add experience')
    }
  }
  const handleDeleteExperience = async (id: string) => {
    await supabase.from('student_experience').delete().eq('id', id)
    setExperienceList(p => p.filter(e => e.id !== id))
    toast.success('Removed')
  }

  // ── Project handlers ──
  const handleAddProject = async () => {
    if (!newProject.title || !studentProfileId) {
      toast.error('Project title is required')
      return
    }
    try {
      const { data } = await supabase.from('student_projects').insert({
        student_id: studentProfileId,
        title: newProject.title,
        description: newProject.description || null,
        project_url: newProject.project_url || null,
        github_url: newProject.github_url || null,
        technologies: newProject.technologies.length > 0 ? newProject.technologies : null,
      } as any).select().single()
      setProjectList(p => [data, ...p])
      setNewProject(emptyProject)
      setNewTech('')
      setShowProjectForm(false)
      toast.success('Project added!')
    } catch {
      toast.error('Failed to add project')
    }
  }
  const handleDeleteProject = async (id: string) => {
    await supabase.from('student_projects').delete().eq('id', id)
    setProjectList(p => p.filter(e => e.id !== id))
    toast.success('Removed')
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading your profile..." />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your professional profile, skills, experience & projects</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} leftIcon={<Save size={15} />}>
          Save All Changes
        </Button>
      </div>

      {/* ── Domain Category ── */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <Sparkles size={16} className="text-primary-600" />
          <span className="text-sm font-semibold text-primary-800">Primary Domain Category:</span>
        </div>
        <Select
          options={[{ value: '', label: 'Select your domain...' }, ...categoryOptions]}
          value={form.categoryId}
          onChange={e => {
            const cat = allCategories.find((c: any) => (c.id || c.slug) === e.target.value)
            setForm({ ...form, categoryId: e.target.value, categoryName: cat?.name || '' })
          }}
        />
        <p className="text-xs text-primary-700">
          Your domain helps companies filter and discover your profile in the Talent Directory.
        </p>
      </Card>

      {/* ── Basic Info ── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <User size={16} className="text-primary-600" /> Basic Information
        </h2>
        <Input
          label="Professional Headline"
          value={form.headline}
          onChange={e => setForm({ ...form, headline: e.target.value })}
          placeholder="e.g. Full Stack Developer | React & Node.js Specialist"
        />
        <Textarea
          label="About Me / Bio"
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Write a short summary about your skills, passion, and career aspirations..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            leftIcon={<MapPin size={15} />}
            placeholder="e.g. Mumbai, India"
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            leftIcon={<Phone size={15} />}
            placeholder="+91 98765 43210"
          />
        </div>
        <Select
          label="Experience Level"
          options={EXP_LEVEL_OPTIONS}
          value={form.experienceLevel}
          onChange={e => setForm({ ...form, experienceLevel: e.target.value })}
        />

        {/* Open to work toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, isOpenToWork: !form.isOpenToWork })}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isOpenToWork ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isOpenToWork ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {form.isOpenToWork ? '✅ Open to Work (Visible to employers)' : '🔒 Not currently looking'}
          </span>
        </div>
      </Card>

      {/* ── Skills ── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-primary-600" /> Technical Skills & Tools
        </h2>
        <div className="flex flex-wrap gap-2">
          {availableSkillsList.map((sk: any) => {
            const val = sk.id || sk.slug || sk.name
            const isSelected = form.selectedSkillIds.includes(val)
            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  const updated = isSelected
                    ? form.selectedSkillIds.filter(x => x !== val)
                    : [...form.selectedSkillIds, val]
                  setForm({ ...form, selectedSkillIds: updated })
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                {isSelected ? `✓ ${sk.name}` : `+ ${sk.name}`}
              </button>
            )
          })}
        </div>
        <MultiSelect
          label="Search or Add More Skills"
          options={skillOptions}
          value={form.selectedSkillIds}
          onChange={ids => setForm({ ...form, selectedSkillIds: ids })}
          placeholder="Type to filter skills..."
        />
        {form.selectedSkillIds.length > 0 && (
          <p className="text-xs text-emerald-600 font-medium">{form.selectedSkillIds.length} skills selected</p>
        )}
      </Card>

      {/* ── Availability ── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={16} className="text-primary-600" /> Availability & Work Preferences
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Types I'm Open To</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABILITY_TYPES.map(t => {
              const isChecked = availabilityTypes.includes(t.value)
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setAvailabilityTypes(prev =>
                      isChecked ? prev.filter(x => x !== t.value) : [...prev, t.value]
                    )
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs text-left transition-all ${
                    isChecked
                      ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-400/30'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        <Select
          label="Preferred Work Mode"
          options={WORK_MODE_OPTIONS}
          value={preferredWorkMode}
          onChange={e => setPreferredWorkMode(e.target.value)}
        />
      </Card>

      {/* ── Education ── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap size={16} className="text-primary-600" /> Education
        </h2>
        {educationList.length > 0 && (
          <div className="space-y-2">
            {educationList.map(edu => (
              <div key={edu.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{edu.institution}</p>
                  <p className="text-xs text-gray-500">
                    {[edu.degree, edu.field_of_study ? `in ${edu.field_of_study}` : ''].filter(Boolean).join(' ')}
                    {edu.end_year ? ` (${edu.end_year})` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteEducation(edu.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Input placeholder="College / University *" value={newEdu.institution} onChange={e => setNewEdu({ ...newEdu, institution: e.target.value })} />
          <Input placeholder="Degree (e.g. B.Tech)" value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} />
          <Input placeholder="Field of Study (e.g. CS)" value={newEdu.field_of_study} onChange={e => setNewEdu({ ...newEdu, field_of_study: e.target.value })} />
          <Input placeholder="Graduation Year" type="number" value={newEdu.end_year} onChange={e => setNewEdu({ ...newEdu, end_year: e.target.value })} />
        </div>
        <Button variant="outline" size="sm" onClick={handleAddEducation} leftIcon={<Plus size={14} />}>
          Add Education
        </Button>
      </Card>

      {/* ── Experience ── */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={16} className="text-primary-600" /> Work Experience
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowExpForm(v => !v)} leftIcon={<Plus size={14} />}>
            Add Experience
          </Button>
        </div>

        {experienceList.length > 0 && (
          <div className="space-y-3">
            {experienceList.map(exp => (
              <div key={exp.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{exp.role} <span className="text-gray-500 font-normal">@ {exp.company}</span></p>
                  <p className="text-xs text-gray-400">
                    {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                    {exp.start_date ? ' – ' : ''}
                    {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                  </p>
                  {exp.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{exp.description}</p>}
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteExperience(exp.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showExpForm && (
          <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Company / Organization *" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} />
              <Input placeholder="Your Role / Title *" value={newExp.role} onChange={e => setNewExp({ ...newExp, role: e.target.value })} />
              <Input type="date" label="Start Date" value={newExp.start_date} onChange={e => setNewExp({ ...newExp, start_date: e.target.value })} />
              <Input type="date" label="End Date" value={newExp.end_date} onChange={e => setNewExp({ ...newExp, end_date: e.target.value })} disabled={newExp.is_current} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={newExp.is_current} onChange={e => setNewExp({ ...newExp, is_current: e.target.checked })} className="rounded" />
              I currently work here
            </label>
            <Textarea placeholder="Brief description of your role and responsibilities..." value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setShowExpForm(false); setNewExp(emptyExp) }}>Cancel</Button>
              <Button size="sm" onClick={handleAddExperience} leftIcon={<Plus size={14} />}>Add Experience</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Projects ── */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Code2 size={16} className="text-primary-600" /> Projects & Portfolio
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowProjectForm(v => !v)} leftIcon={<Plus size={14} />}>
            Add Project
          </Button>
        </div>

        {projectList.length > 0 && (
          <div className="space-y-3">
            {projectList.map(proj => (
              <div key={proj.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{proj.title}</p>
                  {proj.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{proj.description}</p>}
                  <div className="flex gap-2 mt-1">
                    {proj.github_url && <a href={proj.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">GitHub</a>}
                    {proj.project_url && <a href={proj.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">Live Demo</a>}
                  </div>
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {proj.technologies.map((t: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteProject(proj.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showProjectForm && (
          <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50/50">
            <Input placeholder="Project Title *" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} />
            <Textarea placeholder="Brief description of what the project does..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="GitHub URL" value={newProject.github_url} onChange={e => setNewProject({ ...newProject, github_url: e.target.value })} />
              <Input placeholder="Live Demo URL" value={newProject.project_url} onChange={e => setNewProject({ ...newProject, project_url: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add tech (e.g. React)"
                value={newTech}
                onChange={e => setNewTech(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTech.trim()) {
                    setNewProject({ ...newProject, technologies: [...newProject.technologies, newTech.trim()] })
                    setNewTech('')
                  }
                }}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={() => {
                if (newTech.trim()) {
                  setNewProject({ ...newProject, technologies: [...newProject.technologies, newTech.trim()] })
                  setNewTech('')
                }
              }}>+ Add</Button>
            </div>
            {newProject.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {newProject.technologies.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded border border-primary-100">
                    {t}
                    <button onClick={() => setNewProject({ ...newProject, technologies: newProject.technologies.filter((_, j) => j !== i) })} className="text-primary-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setShowProjectForm(false); setNewProject(emptyProject) }}>Cancel</Button>
              <Button size="sm" onClick={handleAddProject} leftIcon={<Plus size={14} />}>Add Project</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Portfolio & Links ── */}
      <Card padding="lg" className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Globe size={16} className="text-primary-600" /> Portfolio & Social Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="GitHub Profile URL" value={form.githubUrl} onChange={e => setForm({ ...form, githubUrl: e.target.value })} leftIcon={<Github size={15} />} placeholder="https://github.com/username" />
          <Input label="LinkedIn Profile URL" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} leftIcon={<Linkedin size={15} />} placeholder="https://linkedin.com/in/username" />
          <Input label="Portfolio Website URL" value={form.portfolioUrl} onChange={e => setForm({ ...form, portfolioUrl: e.target.value })} leftIcon={<Globe size={15} />} placeholder="https://yourportfolio.com" />
          <Input label="Resume URL (PDF / Drive)" value={form.resumeUrl} onChange={e => setForm({ ...form, resumeUrl: e.target.value })} placeholder="https://drive.google.com/..." />
        </div>
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} isLoading={saving} leftIcon={<Save size={15} />} className="px-8">
          Save All Changes
        </Button>
      </div>
    </div>
  )
}
