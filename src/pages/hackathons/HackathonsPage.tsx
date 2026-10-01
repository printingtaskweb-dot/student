import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, Select, Badge, LoadingSpinner, EmptyState, Button } from '@/components/ui'
import { Trophy, Calendar, Users, ArrowRight, MapPin, Navigation, Tag, Clock } from 'lucide-react'
import { formatDate, getHackathonStatusColor, getHackathonStatusLabel } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'registration_open', label: '✅ Registration Open' },
  { value: 'upcoming', label: '📅 Upcoming' },
  { value: 'ongoing', label: '🔥 Ongoing Now' },
  { value: 'completed', label: '✓ Completed' },
]

// Approximate distance in km between two lat/lng points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Attempt to geocode a city/location string using a free API
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data?.[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {
    // ignore geocode errors
  }
  return null
}

export default function HackathonsPage() {
  const [loading, setLoading] = useState(true)
  const [hackathons, setHackathons] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'nearby'>('all')

  // Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [nearbyHackathons, setNearbyHackathons] = useState<any[]>([])
  const NEARBY_RADIUS_KM = 300

  const loadHackathons = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('hackathons')
        .select('*')
        .neq('status', 'draft')
        .order('start_date', { ascending: true })

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data } = await query
      setHackathons(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadHackathons()
  }, [loadHackathons])

  // When user coords are available, geocode hackathon locations & filter
  useEffect(() => {
    async function computeNearby() {
      if (!userCoords || hackathons.length === 0) return

      const withDistance = await Promise.all(
        hackathons.map(async h => {
          if (!h.location && !h.theme) return { ...h, _distance: Infinity }
          const coords = await geocodeLocation(h.location || h.theme || '')
          if (!coords) return { ...h, _distance: Infinity }
          const dist = haversineDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng)
          return { ...h, _distance: dist, _coords: coords }
        })
      )

      const nearby = withDistance
        .filter(h => h._distance <= NEARBY_RADIUS_KM)
        .sort((a, b) => a._distance - b._distance)

      setNearbyHackathons(nearby)
    }
    computeNearby()
  }, [userCoords, hackathons])

  const requestLocation = () => {
    setLocationLoading(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setActiveTab('nearby')
        setLocationLoading(false)
      },
      err => {
        setLocationError('Could not get your location. Please allow location access.')
        setLocationLoading(false)
      }
    )
  }

  const displayedList = activeTab === 'nearby' ? nearbyHackathons : hackathons

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Hackathons & Competitions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Participate, build, win prizes, and get noticed by top businesses
          </p>
        </div>
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Location / Tab toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            🌐 All Hackathons ({hackathons.length})
          </button>
          <button
            onClick={() => {
              if (!userCoords) {
                requestLocation()
              } else {
                setActiveTab('nearby')
              }
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'nearby'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Navigation size={14} />
            Near You {userCoords ? `(${nearbyHackathons.length})` : ''}
          </button>
        </div>

        {/* Location status */}
        {locationLoading && (
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            Getting your location...
          </span>
        )}
        {locationError && (
          <span className="text-xs text-red-500">{locationError}</span>
        )}
        {userCoords && activeTab === 'nearby' && (
          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <MapPin size={12} /> Showing within {NEARBY_RADIUS_KM} km of you
          </span>
        )}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading hackathons..." />
      ) : activeTab === 'nearby' && !userCoords ? (
        <Card className="text-center py-12">
          <Navigation size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-1">Allow Location Access</h3>
          <p className="text-sm text-gray-500 mb-4">We'll show hackathons happening near your city.</p>
          <Button onClick={requestLocation} isLoading={locationLoading} leftIcon={<MapPin size={15} />}>
            Use My Location
          </Button>
        </Card>
      ) : displayedList.length === 0 ? (
        <EmptyState
          title={activeTab === 'nearby' ? 'No hackathons near you' : 'No hackathons found'}
          description={
            activeTab === 'nearby'
              ? `No events found within ${NEARBY_RADIUS_KM} km. Try viewing all hackathons.`
              : 'Check back soon for upcoming coding challenges and competitions!'
          }
          icon={<Trophy size={40} className="text-gray-300" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedList.map((h: any) => {
            const prizes = h.prizes && Array.isArray(h.prizes) ? h.prizes : []
            const tags: string[] = h.tags && Array.isArray(h.tags) ? h.tags : []
            const cats: string[] = h.categories && Array.isArray(h.categories) ? h.categories : []
            const isOpen = h.status === 'registration_open'
            const isOngoing = h.status === 'ongoing'
            const regDeadline = h.registration_deadline ? new Date(h.registration_deadline) : null
            const daysLeft = regDeadline ? Math.ceil((regDeadline.getTime() - Date.now()) / 86400000) : null

            return (
              <Card key={h.id} hover className="flex flex-col justify-between">
                {/* Cover image */}
                {h.cover_image_url && (
                  <div className="h-36 rounded-xl overflow-hidden mb-4 -mt-1 -mx-1">
                    <img src={h.cover_image_url} alt={h.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  {/* Status + Featured */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={getHackathonStatusColor(h.status)}>
                      {getHackathonStatusLabel(h.status)}
                    </Badge>
                    {h.is_featured && <Badge variant="yellow">⭐ Featured</Badge>}
                    {(h as any)._distance !== undefined && (h as any)._distance < Infinity && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <MapPin size={11} /> ~{Math.round((h as any)._distance)} km away
                      </span>
                    )}
                  </div>

                  {/* Title + Theme */}
                  <h3 className="text-base font-bold text-gray-900 mb-1">{h.title}</h3>
                  {h.theme && <p className="text-xs text-primary-600 font-medium mb-2">🎯 {h.theme}</p>}

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{h.short_description || h.description}</p>

                  {/* Prizes */}
                  {prizes.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {prizes.slice(0, 3).map((prize: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs border border-amber-200 font-medium">
                            🏆 {typeof prize === 'string' ? prize : prize.title || prize.label || `Prize ${i + 1}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {(tags.length > 0 || cats.length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {[...cats, ...tags].slice(0, 4).map((tag: string, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(h.start_date)} → {formatDate(h.end_date)}</span>
                    <span className="flex items-center gap-1"><Users size={11} /> Team: {h.min_team_size}–{h.max_team_size}</span>
                    {h.location && <span className="flex items-center gap-1"><MapPin size={11} /> {h.location}</span>}
                  </div>

                  {/* Registration deadline */}
                  {isOpen && daysLeft !== null && daysLeft > 0 && (
                    <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-500' : 'text-amber-600'}`}>
                      <Clock size={11} /> {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to register
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100 text-xs">
                  <div>
                    {isOpen && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        ✅ Registration Open
                      </span>
                    )}
                    {isOngoing && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                        🔥 Live Now
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/hackathons/${h.slug}`}
                    className="font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    View Details <ArrowRight size={13} />
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
