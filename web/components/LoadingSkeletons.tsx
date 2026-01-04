export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="card p-0 overflow-hidden">
            <div className="animate-pulse">
                {/* Header */}
                <div className="bg-gray-100 p-4 border-b border-border">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-4 bg-gray-300 rounded flex-1" />
                        ))}
                    </div>
                </div>

                {/* Rows */}
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="p-4 border-b border-border last:border-b-0">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full" />
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="h-4 bg-gray-300 rounded flex-1" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="card">
            <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-300 rounded w-1/3" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded" />
                    <div className="h-4 bg-gray-300 rounded w-5/6" />
                </div>
                <div className="flex gap-2">
                    <div className="h-8 bg-gray-300 rounded w-20" />
                    <div className="h-8 bg-gray-300 rounded w-20" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="p-8 space-y-6">
            <div className="animate-pulse">
                {/* Header */}
                <div className="h-8 bg-gray-300 rounded w-1/4 mb-8" />

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card">
                            <div className="h-4 bg-gray-300 rounded w-1/2 mb-3" />
                            <div className="h-8 bg-gray-300 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-300 rounded w-1/3" />
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="card">
                            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4" />
                            <div className="h-64 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="card">
                    <div className="animate-pulse flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-1/3" />
                            <div className="h-3 bg-gray-300 rounded w-1/2" />
                        </div>
                        <div className="h-8 w-8 bg-gray-300 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="card max-w-2xl">
            <div className="animate-pulse space-y-6">
                <div className="h-6 bg-gray-300 rounded w-1/4" />

                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/6" />
                        <div className="h-10 bg-gray-200 rounded" />
                    </div>
                ))}

                <div className="flex gap-3 pt-4">
                    <div className="h-10 bg-gray-300 rounded w-24" />
                    <div className="h-10 bg-gray-300 rounded w-24" />
                </div>
            </div>
        </div>
    );
}
