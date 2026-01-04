'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

interface ContactFiltersProps {
    onFilterChange: (filters: ContactFilterState) => void;
}

export interface ContactFilterState {
    lead_status?: string;
    lead_score_min?: number;
    lead_score_max?: number;
    source?: string;
    company_id?: string;
}

export default function ContactFilters({ onFilterChange }: ContactFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<ContactFilterState>({});

    const handleFilterChange = (key: keyof ContactFilterState, value: any) => {
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
                            <h3 className="font-semibold">Filter Contacts</h3>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Lead Status */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Lead Status</label>
                                <select
                                    value={filters.lead_status || ''}
                                    onChange={(e) => handleFilterChange('lead_status', e.target.value || undefined)}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                    }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="new">New</option>
                                    <option value="qualified">Qualified</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="converted">Converted</option>
                                    <option value="lost">Lost</option>
                                </select>
                            </div>

                            {/* Lead Score Range */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Lead Score</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.lead_score_min || ''}
                                        onChange={(e) => handleFilterChange('lead_score_min', e.target.value ? parseInt(e.target.value) : undefined)}
                                        min="0"
                                        max="100"
                                        className="w-full"
                                        style={{
                                            backgroundColor: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                        }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.lead_score_max || ''}
                                        onChange={(e) => handleFilterChange('lead_score_max', e.target.value ? parseInt(e.target.value) : undefined)}
                                        min="0"
                                        max="100"
                                        className="w-full"
                                        style={{
                                            backgroundColor: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Source */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Source</label>
                                <select
                                    value={filters.source || ''}
                                    onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                    }}
                                >
                                    <option value="">All Sources</option>
                                    <option value="manual">Manual Entry</option>
                                    <option value="email">Email</option>
                                    <option value="import">Import</option>
                                    <option value="api">API</option>
                                    <option value="website">Website</option>
                                </select>
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
