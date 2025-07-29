export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>

      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  )
}
