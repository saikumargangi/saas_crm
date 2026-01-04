import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <div className="text-9xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    404
                </div>
                <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Page Not Found
                </h1>
                <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                    Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/dashboard" className="btn-primary inline-block">
                        Go to Dashboard
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary"
                    >
                        Go Back
                    </button>
                </div>

                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold mb-3 text-blue-900">Quick Links</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <Link href="/contacts" className="text-blue-600 hover:underline">
                            Contacts
                        </Link>
                        <Link href="/deals" className="text-blue-600 hover:underline">
                            Deals
                        </Link>
                        <Link href="/inbox" className="text-blue-600 hover:underline">
                            Inbox
                        </Link>
                        <Link href="/settings" className="text-blue-600 hover:underline">
                            Settings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
