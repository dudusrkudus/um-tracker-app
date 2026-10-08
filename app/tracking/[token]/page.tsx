'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Activity, AlertCircle, Battery, Send, RefreshCw, XCircle, Camera, TriangleAlert, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { use } from 'react'

export default function WebGpsTrackingPage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params)
  const token = params.token
  
  const [isTracking, setIsTracking] = useState(false)
  const [statusMsg, setStatusMsg] = useState('Tekan "Mulai Lari (START)" untuk memulai pelacakan.')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // Runner State
  const [runnerName, setRunnerName] = useState<string | null>(null)

  // SOS State
  const [isSosOpen, setIsSosOpen] = useState(false)
  const [sosMessage, setSosMessage] = useState('')
  const [sosPhotos, setSosPhotos] = useState<File[]>([])
  const [isSubmittingSos, setIsSubmittingSos] = useState(false)

  const [lastLocation, setLastLocation] = useState<{
    lat: number;
    lng: number;
    acc: number;
    time: string;
  } | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<any>(null)

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        console.log('Screen Wake Lock is active')
      }
    } catch (err: any) {
      console.error(`Wake Lock error: ${err.message}`)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
      console.log('Screen Wake Lock is released')
    }
  }

  useEffect(() => {
    // Fetch Runner Info
    const fetchRunner = async () => {
      try {
        const res = await fetch(`/api/tracking/runner?token=${token}`)
        if (res.ok) {
          const data = await res.json()
          setRunnerName(data.runner.full_name)
        }
      } catch (err) {
        console.error('Failed to fetch runner data', err)
      }
    }
    fetchRunner()

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current)
      }
      releaseWakeLock()
    }
  }, [token])

  // Re-request wake lock on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTracking) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTracking])

  const startTracking = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser Anda tidak mendukung Geolocation API.')
      return
    }

    setErrorMsg(null)
    setStatusMsg('Memulai pelacakan otomatis (interval 5 menit)...')
    setIsTracking(true)

    // Kirim posisi pertama kali
    sendSingleLocationPing().then((success) => {
      if (success) {
        setStatusMsg('Lokasi awal terkirim. Tracking aktif (5 menit).')
      } else {
        setStatusMsg('Gagal mengirim lokasi awal. Akan dicoba lagi otomatis...')
      }
    })
    
    // Cegah layar mati (Screen Wake Lock API)
    requestWakeLock()

    // Setup interval 5 menit
    intervalIdRef.current = setInterval(() => {
      setStatusMsg('Mengirim data koordinat otomatis...')
      sendSingleLocationPing().then((success) => {
        if (success) setStatusMsg('Lokasi otomatis terkirim.')
        else setStatusMsg('Gagal mengirim lokasi otomatis. Menunggu interval berikutnya...')
      })
    }, 5 * 60 * 1000) // 5 menit

    // Kita juga bisa tetap pakai watchPosition untuk update UI lokal (tidak dikirim ke server)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
         // Hanya update state lokal untuk UI jika perlu, tapi karena interval sudah mengirim, 
         // kita bisa biarkan kosong atau hapus watchPosition.
         // Untuk hemat baterai, kita tidak perlu watchPosition jika sudah ada interval.
      },
      (error) => {
        console.warn('GPS Watch error', error)
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current)
      intervalIdRef.current = null
    }
    releaseWakeLock()
    setIsTracking(false)
    setStatusMsg('Tracking dihentikan.')
  }

  const sendSingleLocationPing = async (): Promise<boolean> => {
    if (!navigator.geolocation) return false;
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy, speed, heading } = position.coords;
            let batteryLevel = null;
            if ('getBattery' in navigator) {
              try {
                const battery: any = await (navigator as any).getBattery();
                batteryLevel = Math.round(battery.level * 100);
              } catch (e) {}
            }

            const payload = {
              token,
              latitude,
              longitude,
              accuracyM: accuracy,
              speedKmh: speed ? speed * 3.6 : null,
              heading,
              batteryLevel,
              recordedAt: new Date(position.timestamp).toISOString()
            };

            const res = await fetch('/api/tracking/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            
            if (res.ok) {
              setLastLocation({
                lat: latitude,
                lng: longitude,
                acc: accuracy,
                time: new Date().toLocaleTimeString('id-ID')
              });
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (e) {
            resolve(false);
          }
        },
        (err) => { console.warn('GPS Error:', err.message); resolve(false); },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );
    });
  };

  const handleSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingSos(true)
    setErrorMsg(null)
    
    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('message', sosMessage)
      if (lastLocation) {
        formData.append('latitude', lastLocation.lat.toString())
        formData.append('longitude', lastLocation.lng.toString())
      }
      
      // Compress photos before appending
      if (sosPhotos.length > 0) {
        setStatusMsg('Mengkompresi gambar...')
        for (const photo of sosPhotos) {
          const compressed = await compressImage(photo)
          formData.append('photo', compressed)
        }
      }

      setStatusMsg('Mengirim laporan SOS...')
      const res = await fetch('/api/tracking/sos', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Server error response:', errorText)
        if (res.status === 413) {
          throw new Error('Ukuran file terlalu besar. Harap kurangi jumlah atau ukuran foto.')
        }
        throw new Error(`Gagal mengirim pesan SOS: ${res.statusText}`)
      }
      
      setIsSosOpen(false)
      setSosMessage('')
      setSosPhotos([])
      alert('Pesan SOS berhasil dikirim!')
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setIsSubmittingSos(false)
    }
  }

  const updateStatus = async (statusToSet: 'running' | 'completed_leg' | 'finished') => {
    setIsUpdatingStatus(true)
    setErrorMsg(null)
    setStatusMsg('Memperbarui status...')
    try {
      // Jika FINISH, kirim posisi terakhir SEBELUM status berubah (karena API menolak lokasi jika tidak 'running')
      if (statusToSet === 'completed_leg') {
        setStatusMsg('Mengambil posisi terakhir...')
        await sendSingleLocationPing()
      }

      const res = await fetch('/api/tracking/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status: statusToSet })
      })

      if (!res.ok) {
        const errBody = await res.json()
        throw new Error(errBody.error || 'Gagal mengubah status')
      }
      
      // Jika START, kirim posisi awal SETELAH status berubah (karena baru boleh mengirim lokasi jika 'running')
      if (statusToSet === 'running') {
        setStatusMsg('Memulai auto-tracking...')
        startTracking()
      }

      // alert removed to prevent JS block
      setStatusMsg('Status berhasil diperbarui.')

      // Redirect ke pelari selanjutnya jika ada
      const resData = await res.json()
      if (statusToSet === 'completed_leg' && resData.nextRunnerToken) {
        setStatusMsg('Mengalihkan ke pelari selanjutnya...')
        window.location.href = `/tracking/${resData.nextRunnerToken}`
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah status')
      setStatusMsg('Gagal memperbarui status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-black uppercase tracking-wider text-slate-800">
            Web GPS
          </CardTitle>
          <CardDescription>
            Sistem Pelacakan Lokasi Pelari
            {runnerName && (
              <div className="mt-2 font-bold text-lg text-slate-800">
                {runnerName}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-slate-100 p-4 flex items-center justify-center min-h-[120px] text-center">
            {isTracking ? (
              <div className="flex flex-col items-center animate-in fade-in">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Activity className="h-6 w-6 text-green-600 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-slate-700">{statusMsg}</p>
                {lastLocation && (
                  <p className="text-xs text-slate-500 mt-2 font-mono">
                    Update terakhir: {lastLocation.time}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
                  <MapPin className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">{statusMsg}</p>
              </div>
            )}
          </div>

          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Kesalahan</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs bg-white border rounded-lg p-3">
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Latitude</span>
              <span className="font-mono font-medium">{lastLocation?.lat?.toFixed(5) || '-'}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Longitude</span>
              <span className="font-mono font-medium">{lastLocation?.lng?.toFixed(5) || '-'}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Akurasi GPS</span>
              <span className="font-mono font-medium">
                {lastLocation?.acc ? `±${Math.round(lastLocation.acc)} m` : '-'}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-slate-500 uppercase font-semibold">Status API</span>
              <span className="font-mono font-medium text-green-600">
                {isTracking ? 'Active' : 'Standby'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => updateStatus('running')}
                disabled={isUpdatingStatus || isTracking}
                className="w-full h-12 text-sm font-bold shadow-md bg-blue-600 hover:bg-blue-700"
              >
                Mulai Lari (START)
              </Button>
              <Button 
                onClick={() => {
                  if(confirm('Apakah Anda yakin sudah selesai/sampai checkpoint?')) {
                    stopTracking();
                    updateStatus('completed_leg')
                  }
                }}
                disabled={isUpdatingStatus}
                variant="outline"
                className="w-full h-12 text-sm font-bold shadow-md border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Selesai (FINISH)
              </Button>
            </div>

            {!isTracking ? (
              <Button 
                onClick={startTracking} 
                className="w-full h-12 text-base font-bold shadow-md bg-green-600 hover:bg-green-700"
              >
                <Send className="mr-2 h-5 w-5" />
                Kirim Posisi Sekarang
              </Button>
            ) : (
              <Button 
                onClick={stopTracking} 
                variant="outline"
                className="w-full h-12 text-base font-bold shadow-md border-slate-300 text-slate-700"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Hentikan Tracking
              </Button>
            )}

            <Button 
              onClick={() => setIsSosOpen(true)}
              variant="destructive"
              className="w-full h-12 text-base font-bold shadow-md bg-red-600 hover:bg-red-700 text-white animate-pulse"
            >
              <TriangleAlert className="mr-2 h-5 w-5" />
              Kirim SOS / Laporan
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-400">
              Pastikan browser terbuka dan jangan kunci layar HP Anda agar lokasi tetap terkirim.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SOS Modal */}
      {isSosOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-red-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TriangleAlert className="h-5 w-5" />
                <h3 className="font-bold text-lg">Kirim SOS / Laporan</h3>
              </div>
              <button onClick={() => setIsSosOpen(false)} className="text-white/80 hover:text-white font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSosSubmit} className="p-4 space-y-4 flex-1 flex flex-col overflow-y-auto">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-semibold flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Pesan Laporan</label>
                <textarea 
                  required
                  placeholder="Ceritakan kondisi Anda atau masalah yang terjadi..."
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                  <span>Lampirkan Bantuan (Opsional)</span>
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-red-300 rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer transition-colors text-red-700">
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs font-bold text-center">Buka Kamera</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSosPhotos((prev) => [...prev, ...Array.from(e.target.files!)])
                        }
                      }}
                    />
                  </label>

                  <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-slate-700">
                    <FolderOpen className="h-6 w-6 mb-1" />
                    <span className="text-xs font-bold text-center">Pilih Galeri/File</span>
                    <input 
                      type="file" 
                      accept="image/*, application/pdf, .doc, .docx, .xls, .xlsx, .txt"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSosPhotos((prev) => [...prev, ...Array.from(e.target.files!)])
                        }
                      }}
                    />
                  </label>
                </div>
                {sosPhotos.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-700 font-bold mb-1">File siap dikirim ({sosPhotos.length}):</p>
                    <ul className="text-xs text-green-700 list-disc list-inside">
                      {sosPhotos.map((f, i) => (
                        <li key={i}>{f.name}</li>
                      ))}
                    </ul>
                    <button 
                      type="button" 
                      onClick={() => setSosPhotos([])}
                      className="text-xs text-red-600 mt-2 font-semibold hover:underline"
                    >
                      Hapus Semua
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsSosOpen(false)}
                  disabled={isSubmittingSos}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                  disabled={isSubmittingSos}
                >
                  {isSubmittingSos ? 'Mengirim...' : 'Kirim SOS'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// --- IMAGE COMPRESSION HELPER ---
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file) // Skip non-images
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}
