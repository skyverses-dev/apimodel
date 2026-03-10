export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-white/10 rounded skeleton-shimmer" />
                <div className="h-8 w-8 bg-white/10 rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-8 w-20 bg-white/10 rounded mb-2 skeleton-shimmer" />
            <div className="h-3 w-32 bg-white/5 rounded skeleton-shimmer" />
        </div>
    )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex gap-4 px-6 py-4 border-b border-white/10">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-3 bg-white/10 rounded flex-1 skeleton-shimmer" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 px-6 py-4 border-b border-white/5">
                    {[1, 2, 3, 4].map(j => (
                        <div key={j} className="h-4 bg-white/5 rounded flex-1 skeleton-shimmer" />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function SkeletonPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="h-8 w-48 bg-white/10 rounded mb-3 skeleton-shimmer" />
                <div className="h-4 w-72 bg-white/5 rounded skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
            <SkeletonTable rows={5} />
        </div>
    )
}
