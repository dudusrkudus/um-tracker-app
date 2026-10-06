'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 border rounded-lg bg-red-50 p-6">
      <h2 className="text-xl font-bold text-red-800">Something went wrong!</h2>
      <p className="text-red-600">{error.message || 'Failed to load events.'}</p>
      <Button
        onClick={() => reset()}
        variant="outline"
        className="bg-white"
      >
        Try again
      </Button>
    </div>
  )
}
