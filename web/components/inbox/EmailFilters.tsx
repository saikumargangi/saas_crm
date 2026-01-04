'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface EmailFiltersProps {
    onFilterChange: (filters: EmailFilterState) => void;
}

export interface EmailFilterState {
    classification?: string;
    sentiment?: string;
    isRead?: boolean;
    hasAttachment?: boolean;
    labels?: string[];
}

export default function EmailFilters({ onFilterChange }: EmailFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<EmailFilterState>({});

    const handleFilterChange = (key: keyof EmailFilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        setFilters({});
        onFilterChange({});
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-secondary flex items-center gap-2"
                style={{
                    backgroundColor: activeFilterCount > 0 ? 'var(--color-link)' : 'white',
                    color: activeFilterCount > 0 ? 'white' : 'var(--color-text-primary)',
                }}
            >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                    <span className="bg-white text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 p-4"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Filter Emails</h3>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Classification */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Classification</label>
                                <select
                                    value={filters.classification || ''}
                                    onChange={(e) => handleFilterChange('classification', e.target.value || undefined)}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="inquiry">Inquiry</option>
                                    <option value="proposal">Proposal</option>
                                    <option value="objection">Objection</option>
                                    <option value="meeting_request">Meeting Request</option>
                                    <option value="thank_you">Thank You</option>
                                    <option value="complaint">Complaint</option>
                                </select>
                            </div>

                            {/* Sentiment */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Sentiment</label>
                                <select
                                    value={filters.sentiment || ''}
                                    onChange={(e) => handleFilterChange('sentiment', e.target.value || undefined)}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="positive">Positive</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Negative</option>
                                </select>
                            </div>

                            {/* Read Status */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Read Status</label>
                                <select
                                    value={filters.isRead === undefined ? '' : filters.isRead ? 'read' : 'unread'}
                                    onChange={(e) => handleFilterChange('isRead', e.target.value === '' ? undefined : e.target.value === 'read')}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                    }}
                                >
                                    <option value="">All</option>
                                    <option value="unread">Unread</option>
                                    <option value="read">Read</option>
                                </select>
                            </div>

                            {/* Has Attachment */}
                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.hasAttachment || false}
                                        onChange={(e) => handleFilterChange('hasAttachment', e.target.checked || undefined)}
                                    />
                                    <span className="text-sm">Has Attachments</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <button
                                    onClick={clearFilters}
                                    className="flex-1 btn-secondary text-sm py-2"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 btn-primary text-sm py-2"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
