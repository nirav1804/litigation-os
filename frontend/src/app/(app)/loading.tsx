export default function AppLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-10 bg-muted rounded-xl w-1/3" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-xl" />
      <div className="h-48 bg-muted rounded-xl" />
    </div>
  )
}
