'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(
        error.message === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak sesuai.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto h-screen">
      <form
        onSubmit={handleSignIn}
        className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground"
      >
        <h1 className="text-2xl font-bold mb-4">Login to Race Control</h1>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-md mb-2">
            {errorMsg}
          </div>
        )}

        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-md px-4 py-2 mb-2 transition-colors flex items-center justify-center cursor-pointer"
        >
          {loading ? 'Memproses...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
