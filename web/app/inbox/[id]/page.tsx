'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Reply, Forward, Trash, Archive, Tag } from 'lucide-react';
import api from '@/lib/api';
import EmailCompose from '@/components/inbox/EmailCompose';

interface Email {
    id: string;
    from_address: string;
    to_addresses: string[];
    subject: string;
    body_text?: string;
    body_html?: string;
    received_at: string;
    is_read: boolean;
    classification?: string;
    sentiment?: string;
    gmail_labels?: string[];
}

export default function EmailDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const emailId = searchParams.get('id');

    const [email, setEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);

    useEffect(() => {
        if (emailId) {
            fetchEmail();
        }
    }, [emailId]);

    const fetchEmail = async () => {
        try {
            const { data } = await api.get(`/email/messages/${emailId}`);
            setEmail(data);

            // Mark as read
            if (!data.is_read) {
                await api.put(`/email/messages/${emailId}/read`);
            }
        } catch (error) {
            console.error('Failed to fetch email:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = () => {
        setIsComposeOpen(true);
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!email) return <div className="p-8">Email not found</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.push('/inbox')}
                    className="flex items-center gap-2 text-sm mb-6 hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Inbox
                </button>

                {/* Email Card */}
                <div className="card">
                    {/* Subject */}
                    <h1 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                        {email.subject || '(No Subject)'}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="font-semibold text-blue-600">
                                        {email.from_address.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium">{email.from_address}</p>
                                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                        to {email.to_addresses?.join(', ')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                                {new Date(email.received_at).toLocaleString()}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleReply}
                                className="p-2 hover:bg-gray-100 rounded-full"
                                title="Reply"
                            >
                                <Reply className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full" title="Forward">
                                <Forward className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full" title="Archive">
                                <Archive className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full text-red-600" title="Delete">
                                <Trash className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Labels */}
                    {(email.classification || email.sentiment || email.gmail_labels) && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {email.classification && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {email.classification}
                                </span>
                            )}
                            {email.sentiment && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${email.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                        email.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {email.sentiment}
                                </span>
                            )}
                            {email.gmail_labels?.map((label) => (
                                <span key={label} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Body */}
                    <div className="prose max-w-none">
                        {email.body_html ? (
                            <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                        ) : (
                            <pre className="whitespace-pre-wrap font-sans">{email.body_text}</pre>
                        )}
                    </div>
                </div>

                {/* Reply Compose */}
                <EmailCompose
                    isOpen={isComposeOpen}
                    onClose={() => setIsComposeOpen(false)}
                    replyTo={{
                        to: email.from_address,
                        subject: `Re: ${email.subject}`,
                        body: email.body_text,
                    }}
                    onSent={() => {
                        setIsComposeOpen(false);
                        router.push('/inbox');
                    }}
                />
            </div>
        </div>
    );
}
