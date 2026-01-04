export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Loading...
                </p>
            </div>
        </div>
    );
}
