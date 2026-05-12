export default function MarketingLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-brand-500" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  )
}
