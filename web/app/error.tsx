'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <div className="text-9xl font-bold mb-4 text-red-500">
                    500
                </div>
                <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    Something Went Wrong
                </h1>
                <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                    We encountered an unexpected error. Our team has been notified and we're working on a fix.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    <button
                        onClick={reset}
                        className="btn-primary"
                    >
                        Try Again
                    </button>
                    <Link href="/dashboard" className="btn-secondary inline-block">
                        Go to Dashboard
                    </Link>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <details className="text-left bg-gray-100 p-4 rounded-lg">
                        <summary className="cursor-pointer font-semibold mb-2">
                            Error Details (Development Only)
                        </summary>
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">
                            {error.message}
                            {'\n\n'}
                            {error.stack}
                        </pre>
                    </details>
                )}

                <div className="mt-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    {error.digest && (
                        <p>Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{error.digest}</code></p>
                    )}
                </div>
            </div>
        </div>
    );
}
