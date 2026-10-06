'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Activity, AlertCircle, Battery, Send, RefreshCw, XCircle, Camera, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { use } from 'react'

export default function WebGpsTrackingPage(props: { params: Promise<{ token: string }> }) {
  const params = use(props.params)
  const token = params.token
  
  const [isTracking, setIsTracking] = useState(false)
  const [statusMsg, setStatusMsg] = useState('Tekan "Kirim Posisi Saya" untuk mengirimkan lokasi.')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // SOS State
  const [isSosOpen, setIsSosOpen] = useState(false)
  const [sosMessage, setSosMessage] = useState('')
  const [sosPhoto, setSosPhoto] = useState<File | null>(null)
  const [isSubmittingSos, setIsSubmittingSos] = useState(false)

  
  const [lastLocation, setLastLocation] = useState<{
    lat: number;
    lng: number;
    acc: number;
    time: string;
  } | null>(null)
  
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const startTracking = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser Anda tidak mendukung Geolocation API.')
      return
    }

    setErrorMsg(null)
    setStatusMsg('Meminta izin lokasi...')
    setIsTracking(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords
        
        // Coba baca level baterai jika API tersedia (contoh: Chrome Android)
        let batteryLevel = null
        try {
          if ('getBattery' in navigator) {
            const battery: any = await (navigator as any).getBattery()
            batteryLevel = Math.round(battery.level * 100)
          }
        } catch (e) {
          // ignore
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
        }

        setStatusMsg('Mengirim data koordinat...')

        try {
          const res = await fetch('/api/tracking/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (!res.ok) {
            const errBody = await res.json()
            throw new Error(errBody.error || 'Server menolak data')
          }

          setLastLocation({
            lat: latitude,
            lng: longitude,
            acc: accuracy,
            time: new Date().toLocaleTimeString('id-ID')
          })
          setStatusMsg('Lokasi terkirim.')
          setErrorMsg(null)
        } catch (err: any) {
          setErrorMsg(err.message || 'Gagal mengirim lokasi')
          setStatusMsg('Gagal mengirim data. Akan dicoba lagi otomatis...')
        }
      },
      (error) => {
        let msg = 'Gagal mendeteksi lokasi.'
        if (error.code === error.PERMISSION_DENIED) msg = 'Izin akses lokasi ditolak.'
        if (error.code === error.POSITION_UNAVAILABLE) msg = 'Informasi lokasi tidak tersedia dari perangkat.'
        if (error.code === error.TIMEOUT) msg = 'Waktu permintaan lokasi habis (timeout).'
        
        setErrorMsg(msg)
        setStatusMsg('Terjadi kesalahan.')
        stopTracking()
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 20000,
      }
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
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
        () => resolve(false),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
      if (sosPhoto) {
        formData.append('photo', sosPhoto)
      }

      const res = await fetch('/api/tracking/sos', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Gagal mengirim pesan SOS.')
      
      setIsSosOpen(false)
      setSosMessage('')
      setSosPhoto(null)
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
        setStatusMsg('Mengambil posisi awal...')
        await sendSingleLocationPing()
      }

      alert(`Status berhasil diperbarui! Posisi telah dicatat.`)
      setStatusMsg('Status berhasil diperbarui.')
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
                disabled={isUpdatingStatus}
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
                Kirim Posisi Saya
              </Button>
            ) : (
              <Button 
                onClick={stopTracking} 
                variant="outline"
                className="w-full h-12 text-base font-bold shadow-md border-slate-300 text-slate-700"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Hentikan Kirim Posisi
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
              Pastikan browser tidak dalam mode hemat baterai (battery saver) agar lokasi tetap dikirim.
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
            
            <form onSubmit={handleSosSubmit} className="p-4 space-y-4 flex-1 flex flex-col">
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

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 flex items-center space-x-1">
                  <Camera className="h-4 w-4" /> <span>Lampirkan Foto</span>
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSosPhoto(e.target.files[0])
                    }
                  }}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
                {sosPhoto && (
                  <p className="text-xs text-green-600 mt-1 font-medium">Foto dipilih: {sosPhoto.name}</p>
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
