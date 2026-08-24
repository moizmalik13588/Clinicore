// Loading skeleton components

function SkeletonBox({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-dark-border rounded-lg ${className}`} />
    );
}

export function StatCardSkeleton() {
    return (
        <div className="card">
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <SkeletonBox className="h-3 w-24" />
                    <SkeletonBox className="h-8 w-16" />
                    <SkeletonBox className="h-3 w-20" />
                </div>
                <SkeletonBox className="w-10 h-10 rounded-xl" />
            </div>
        </div>
    );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
    return (
        <div className="flex items-center gap-4 px-4 py-3.5 border-b border-dark-border/50">
            <SkeletonBox className="w-8 h-8 rounded-lg flex-shrink-0" />
            {Array.from({ length: cols - 1 }).map((_, i) => (
                <SkeletonBox
                    key={i}
                    className={`h-4 ${i === 0 ? 'flex-1' : 'w-20'}`}
                />
            ))}
        </div>
    );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="card space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
                <SkeletonBox
                    key={i}
                    className={`h-4 ${i === 0 ? 'w-1/3' : i === lines - 1 ? 'w-1/2' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
    return (
        <div className="card">
            <SkeletonBox className="h-4 w-32 mb-4" />
            <div
                className="animate-pulse bg-dark-border/50 rounded-xl flex items-end
                   justify-around px-4 pb-4 gap-2"
                style={{ height }}
            >
                {[60, 80, 45, 90, 70, 55, 85, 65, 75, 50].map((h, i) => (
                    <div
                        key={i}
                        className="bg-dark-border rounded-t-sm flex-1"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function PatientRowSkeleton() {
    return (
        <div className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-dark-border/50
                    items-center">
            <div className="col-span-3 flex items-center gap-2.5">
                <SkeletonBox className="w-8 h-8 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                    <SkeletonBox className="h-3.5 w-24" />
                    <SkeletonBox className="h-3 w-16" />
                </div>
            </div>
            <SkeletonBox className="col-span-2 h-3.5 w-28" />
            <SkeletonBox className="col-span-1 h-7 w-7 rounded-full mx-auto" />
            <SkeletonBox className="col-span-2 h-3.5 w-20" />
            <SkeletonBox className="col-span-2 h-5 w-16 rounded-full" />
            <SkeletonBox className="col-span-2 h-5 w-14 rounded-full" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <SkeletonBox className="h-6 w-56" />
                    <SkeletonBox className="h-4 w-40" />
                </div>
                <SkeletonBox className="h-9 w-24 rounded-lg" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartSkeleton height={220} />
                <div className="card space-y-3">
                    <SkeletonBox className="h-4 w-24" />
                    <SkeletonBox className="h-44 w-44 rounded-full mx-auto" />
                </div>
            </div>
        </div>
    );
}

export default SkeletonBox;