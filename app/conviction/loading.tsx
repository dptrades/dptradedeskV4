export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-950 p-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-56 bg-gray-800 rounded-lg" />
                    <div className="h-4 w-80 bg-gray-800/60 rounded" />
                </div>
                <div className="h-10 w-36 bg-gray-800 rounded-lg" />
            </div>

            {/* Score summary bar */}
            <div className="h-16 w-full bg-gray-900/80 border border-gray-800/50 rounded-2xl mb-6" />

            {/* Stock list skeletons */}
            <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-900/80 border border-gray-800/50 rounded-xl p-4 flex items-center gap-4">
                        <div className="h-10 w-14 bg-gray-800 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-gray-800/70 rounded" />
                            <div className="h-3 w-48 bg-gray-800/40 rounded" />
                        </div>
                        <div className="h-8 w-20 bg-gray-800/60 rounded-full" />
                        <div className="h-8 w-28 bg-blue-900/20 border border-blue-800/20 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
