"use client";

import { useState } from 'react';
import { Mail, Search, Star, Trash2 } from 'lucide-react';

interface Email {
    id: string;
    from_address: string;
    subject: string;
    snippet: string;
    received_at: string;
    is_read: boolean;
    has_attachment?: boolean;
}

interface EmailListProps {
    emails: Email[];
    onSelect: (id: string) => void;
    selectedId?: string;
}

export default function EmailList({ emails, onSelect, selectedId }: EmailListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = emails.filter(e =>
        (e.from_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-surface border-r border-border">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.map(email => (
                    <div
                        key={email.id}
                        onClick={() => onSelect(email.id)}
                        className={`flex flex-col p-4 border-b border-border cursor-pointer hover:bg-row-hover ${selectedId === email.id ? 'bg-row-selected border-l-4 border-l-active' : 'border-l-4 border-l-transparent'
                            } ${!email.is_read ? 'font-semibold' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm truncate max-w-[70%]">{email.from_address || 'Unknown'}</span>
                            <span className="text-xs text-text-tertiary">{new Date(email.received_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm mb-1 truncate">{email.subject}</div>
                        <div className="text-xs text-text-secondary truncate">{email.snippet}</div>
                        {/* Read status styling */}
                        {!email.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1/2 right-2 transform -translate-y-1/2"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
}
