'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Team {
  id: string
  team_code: string
  status: string
  last_known_latitude: number | null
  last_known_longitude: number | null
  last_location_at: string | null
  runners?: { full_name: string; relay_order: number; status: string }[] | null
}

interface Checkpoint {
  id: string
  code: string
  name: string
  latitude: number
  longitude: number
}

interface TrackingMapProps {
  teams: Team[]
  checkpoints: Checkpoint[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return '#3b82f6'
    case 'finished':
      return '#10b981'
    case 'emergency':
      return '#ef4444'
    case 'attention':
      return '#f59e0b'
    default:
      return '#6b7280'
  }
}

export default function TrackingMap({ teams, checkpoints }: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const teamMarkersRef = useRef<Map<string, any>>(new Map())
  const [mapError, setMapError] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // 1. Initialize Map
  useEffect(() => {
    const initMap = () => {
      // @ts-ignore
      const maplibregl = window.maplibregl
      if (!maplibregl || !mapContainer.current) return
      if (mapRef.current) return // Already initialized

      try {
        const style = {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap Contributors',
            },
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        }

        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: style,
          bounds: [
            [106.7, -7.0],
            [107.7, -6.1],
          ], // Jakarta – Bandung
          fitBoundsOptions: { padding: 40 },
        })
        mapRef.current = map

        map.addControl(new maplibregl.NavigationControl(), 'top-right')
        map.on('error', (e: any) => console.error('MapLibre error:', e?.error || e))

        map.on('load', () => {
          map.resize()
          
          // Route Placeholder
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [106.8272, -6.1751], // Jakarta
                  [107.6191, -6.9175], // Bandung
                ]
              }
            }
          })
          map.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#94a3b8', 'line-width': 4, 'line-dasharray': [2, 2] }
          })

          setMapLoaded(true)
        })
      } catch (e) {
        console.error('Map initialization failed:', e)
        setMapError(true)
      }
    }

    const cssId = 'maplibre-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
      document.head.appendChild(link)
    }

    const scriptId = 'maplibre-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
      script.addEventListener('load', initMap)
      script.onerror = () => setMapError(true)
      document.head.appendChild(script)
    } else {
      // @ts-ignore
      if (window.maplibregl) {
        initMap()
      } else {
        script.addEventListener('load', initMap)
      }
    }

    return () => {
      script?.removeEventListener('load', initMap)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Empty dependency array so map is only created once

  // 2. Manage Checkpoints
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    // @ts-ignore
    const maplibregl = window.maplibregl
    if (!maplibregl) return

    checkpoints.forEach((cp) => {
      const el = document.createElement('div')
      el.className = 'w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow-md'
      el.title = cp.name
      
      new maplibregl.Marker({ element: el })
        .setLngLat([cp.longitude, cp.latitude])
        .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(`<strong>${cp.code}</strong><br/>${cp.name}`))
        .addTo(mapRef.current)
    })
  }, [checkpoints, mapLoaded])

  // 3. Manage Teams (Dynamic)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    // @ts-ignore
    const maplibregl = window.maplibregl
    if (!maplibregl) return

    const STALE_THRESHOLD = 15 * 60 * 1000 // 15 minutes

    const coordMap = new Map<string, number>()

    teams.forEach((team) => {
      if (team.last_known_longitude && team.last_known_latitude) {
        let lng = team.last_known_longitude
        let lat = team.last_known_latitude
        
        // Deteksi apakah ada koordinat yang persis sama (bertumpuk/overlap)
        const coordKey = `${lng},${lat}`
        const overlapCount = coordMap.get(coordKey) || 0
        coordMap.set(coordKey, overlapCount + 1)

        // Jika bertumpuk, geser sedikit posisinya membentuk formasi melingkar
        if (overlapCount > 0) {
          const angle = overlapCount * (Math.PI / 4) // 45 derajat
          const offset = 0.00015 // Sekitar 15 meter offset
          lng += Math.cos(angle) * offset
          lat += Math.sin(angle) * offset
        }

        const isStale = team.last_location_at && (new Date().getTime() - new Date(team.last_location_at).getTime() > STALE_THRESHOLD)
        
        let marker = teamMarkersRef.current.get(team.id)
        let el: HTMLElement

        if (!marker) {
          el = document.createElement('div')
          el.className = 'w-6 h-6 rounded-full border-2 shadow-lg flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300'
          marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(mapRef.current)
          teamMarkersRef.current.set(team.id, marker)
        } else {
          el = marker.getElement()
          marker.setLngLat([lng, lat])
        }

        // Apply colors based on status and stale condition
        const baseColor = getStatusColor(team.status)
        if (isStale && team.status === 'running') {
          el.style.backgroundColor = '#9ca3af' // Gray
          el.style.borderColor = '#ef4444' // Red border
          el.style.opacity = '0.8'
        } else {
          el.style.backgroundColor = baseColor
          el.style.borderColor = 'white'
          el.style.opacity = '1'
        }
        
        // Determine which runner to show based on team status
        const runners = team.runners || []
        const runningRunner = runners.filter((r) => r.status === 'running').sort((a, b) => a.relay_order - b.relay_order)[0]
        const nextRunner = runners.filter((r) => r.status === 'not_started').sort((a, b) => a.relay_order - b.relay_order)[0]
        const finishedRunner = runners.filter((r) => r.status === 'finished' || r.status === 'completed_leg').sort((a, b) => b.relay_order - a.relay_order)[0]

        let displayRunnerName = ''
        let runnerStatusLabel = ''

        if (runningRunner) {
          displayRunnerName = runningRunner.full_name
          runnerStatusLabel = 'Running'
        } else if (nextRunner && team.status === 'waiting_relay') {
          displayRunnerName = nextRunner.full_name
          runnerStatusLabel = 'Waiting Relay'
        } else if (finishedRunner && team.status === 'finished') {
          displayRunnerName = finishedRunner.full_name
          runnerStatusLabel = 'Finished'
        } else if (finishedRunner) {
          displayRunnerName = finishedRunner.full_name
          runnerStatusLabel = 'Completed Leg'
        }

        const code = team.team_code.replace(/[^0-9]/g, '').slice(-2)
        el.textContent = code
        
        if (displayRunnerName) {
          const label = document.createElement('span')
          // Tampilkan nama pelari, dan status jika bukan sedang lari
          label.textContent = runnerStatusLabel === 'Running' ? displayRunnerName : `${displayRunnerName} (${runnerStatusLabel})`
          label.style.cssText =
            'position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:2px;' +
            'white-space:nowrap;font-size:11px;font-weight:600;color:#111827;background:rgba(255,255,255,0.9);' +
            'padding:1px 6px;border-radius:9999px;box-shadow:0 1px 3px rgba(0,0,0,0.3);pointer-events:none;'
          el.appendChild(label)
        }

        const popupHtml = `
          <div class="p-2">
            <strong>Team: ${team.team_code}</strong><br/>
            ${displayRunnerName ? `Pelari: ${displayRunnerName} <span class="text-[10px] text-gray-500">(${runnerStatusLabel})</span><br/>` : ''}
            Status Tim: <span class="uppercase text-xs font-bold text-gray-700">${team.status.replace('_', ' ')}</span><br/>
            Last Update: ${team.last_location_at ? new Date(team.last_location_at).toLocaleTimeString() : 'N/A'}
            ${isStale && team.status === 'running' ? '<br/><span class="text-red-500 font-semibold text-xs mt-1 block">⚠️ Stale Location (>15m)</span>' : ''}
          </div>
        `
        marker.setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupHtml))
      }
    })
  }, [teams, mapLoaded])

  return (
    <>
      {mapError ? (
        <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg border border-dashed">
          <div className="text-gray-500 flex flex-col items-center">
            <p>Unable to load the map.</p>
          </div>
        </div>
      ) : (
        <div
          className="w-full rounded-lg overflow-hidden border shadow-sm"
          style={{ height: 600 }}
        >
          {/* Inline size: maplibre-gl.css forces position:relative on this element */}
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </>
  )
}
