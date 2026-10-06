import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b h-16 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="font-bold text-lg text-slate-800">Ultra Marathon Live</div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
