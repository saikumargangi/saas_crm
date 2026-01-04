'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface SearchResult {
    id: string;
    _index: string;
    _score: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    subject?: string;
    from_address?: string;
    title?: string;
    amount?: number;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/crm/search?q=${encodeURIComponent(query)}`);
                setResults(data || []);
            } catch (error) {
                console.error('Search failed:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        setIsOpen(false);
        setQuery('');

        // Navigate based on result type
        if (result._index === 'contacts') {
            router.push(`/contacts?id=${result.id}`);
        } else if (result._index === 'emails') {
            router.push(`/inbox?id=${result.id}`);
        } else if (result._index === 'deals') {
            router.push(`/deals?id=${result.id}`);
        }
    };

    const getResultIcon = (index: string) => {
        switch (index) {
            case 'contacts':
                return '👤';
            case 'emails':
                return '📧';
            case 'deals':
                return '💼';
            default:
                return '📄';
        }
    };

    const getResultTitle = (result: SearchResult) => {
        if (result._index === 'contacts') {
            return `${result.first_name || ''} ${result.last_name || ''}`.trim() || result.email;
        } else if (result._index === 'emails') {
            return result.subject || 'No Subject';
        } else if (result._index === 'deals') {
            return result.title || 'Untitled Deal';
        }
        return 'Unknown';
    };

    const getResultSubtitle = (result: SearchResult) => {
        if (result._index === 'contacts') {
            return result.email;
        } else if (result._index === 'emails') {
            return result.from_address;
        } else if (result._index === 'deals') {
            return result.amount ? `$${result.amount.toLocaleString()}` : '';
        }
        return '';
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl">
            {/* Search Input */}
            <div className="relative">
                <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: 'var(--color-text-tertiary)' }}
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search contacts, emails, deals..."
                    className="w-full pl-10 pr-10"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                    }}
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div
                    className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border overflow-hidden z-50"
                    style={{ borderColor: 'var(--color-border)' }}
                >
                    {loading ? (
                        <div className="p-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2 text-sm">Searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                            {results.map((result, index) => (
                                <button
                                    key={`${result._index}-${result.id}-${index}`}
                                    onClick={() => handleResultClick(result)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                    style={{ borderColor: 'var(--color-border)' }}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{getResultIcon(result._index)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                    {getResultTitle(result)}
                                                </p>
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                                                    style={{
                                                        backgroundColor: 'var(--color-label-bg)',
                                                        color: 'var(--color-label-text)',
                                                    }}
                                                >
                                                    {result._index}
                                                </span>
                                            </div>
                                            {getResultSubtitle(result) && (
                                                <p className="text-sm truncate mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {getResultSubtitle(result)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    )}

                    {/* Search Tips */}
                    <div className="px-4 py-2 bg-gray-50 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                        <p>💡 Tip: Search by name, email, company, or deal title</p>
                    </div>
                </div>
            )}
        </div>
    );
}
