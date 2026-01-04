"use client";

import { Reply, Forward, MoreHorizontal, Star, Trash2, Archive, Paperclip } from 'lucide-react';

interface Email {
    id: string;
    from_address: string;
    to_addresses: string[];
    cc_addresses?: string[];
    subject: string;
    body_html: string;
    body_text: string;
    received_at: string;
    attachments?: Array<{ name: string; size: string; type: string }>;
}

interface EmailDetailProps {
    email: Email | null;
}

export default function EmailDetail({ email }: EmailDetailProps) {
    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <p>Select an email to read</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex space-x-2">
                    <button className="p-2 hover:bg-row-hover rounded-full text-text-secondary" title="Archive">
                        <Archive className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-row-hover rounded-full text-text-secondary" title="Delete">
                        <Trash2 className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-border mx-2" />
                    <button className="p-2 hover:bg-row-hover rounded-full text-text-secondary" title="Mark Unread">
                        <MailIcon className="h-5 w-5" />
                    </button>
                </div>
                <div>
                    <button className="p-2 hover:bg-row-hover rounded-full text-text-secondary">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-serif text-text-primary mb-4">{email.subject}</h1>

                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-avatar-purple flex items-center justify-center text-lg font-bold text-text-primary">
                                {(email.from_address || '?')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-semibold text-text-primary">{email.from_address || 'Unknown Sender'}</div>
                                <div className="text-sm text-text-secondary">to {(email.to_addresses || []).join(', ')}</div>
                            </div>
                        </div>
                        <div className="text-sm text-text-tertiary">{new Date(email.received_at).toLocaleString()}</div>
                    </div>
                </div>

                <div className="prose max-w-none text-text-primary mb-8" dangerouslySetInnerHTML={{ __html: email.body_html || email.body_text || '<div>No content</div>' }} />

                {email.attachments && (
                    <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            {email.attachments.length} Attachments
                        </h4>
                        <div className="flex gap-4">
                            {email.attachments.map((att, i) => (
                                <div key={i} className="flex items-center p-3 border border-border rounded-lg bg-background hover:bg-row-hover cursor-pointer max-w-xs">
                                    <div className="mr-3 p-2 bg-gray-100 rounded">
                                        <div className="w-6 h-6 bg-gray-300 rounded" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-sm font-medium truncate">{att.name}</div>
                                        <div className="text-xs text-text-tertiary">{att.size}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Reply Area */}
            <div className="p-4 border-t border-border bg-gray-50">
                <div className="flex gap-4">
                    <button className="btn-secondary flex items-center gap-2">
                        <Reply className="h-4 w-4" /> Reply
                    </button>
                    <button className="btn-secondary flex items-center gap-2">
                        <Forward className="h-4 w-4" /> Forward
                    </button>
                </div>
            </div>
        </div>
    );
}

function MailIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    )
}
