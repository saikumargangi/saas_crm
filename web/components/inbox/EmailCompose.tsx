'use client';

import { useState } from 'react';
import { X, Send, Paperclip, Bold, Italic, Link as LinkIcon } from 'lucide-react';
import api from '@/lib/api';

interface EmailComposeProps {
    isOpen: boolean;
    onClose: () => void;
    replyTo?: {
        to: string;
        subject: string;
        body?: string;
    };
    onSent?: () => void;
}

export default function EmailCompose({ isOpen, onClose, replyTo, onSent }: EmailComposeProps) {
    const [formData, setFormData] = useState({
        to: replyTo?.to || '',
        subject: replyTo?.subject || '',
        body: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSend = async () => {
        setLoading(true);
        setError('');

        try {
            await api.post('/email/send', formData);

            if (onSent) onSent();
            onClose();

            // Reset form
            setFormData({ to: '', subject: '', body: '' });
        } catch (err: any) {
            setError(err.message || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

            <div className="relative bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {replyTo ? 'Reply' : 'New Message'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-4 mt-4 p-3 rounded-md" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* To */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium w-16" style={{ color: 'var(--color-text-secondary)' }}>
                            To:
                        </label>
                        <input
                            type="email"
                            name="to"
                            value={formData.to}
                            onChange={handleChange}
                            required
                            placeholder="recipient@example.com"
                            className="flex-1"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                            }}
                        />
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium w-16" style={{ color: 'var(--color-text-secondary)' }}>
                            Subject:
                        </label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            placeholder="Email subject"
                            className="flex-1"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                            }}
                        />
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-2 py-2 border-y" style={{ borderColor: 'var(--color-border)' }}>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Bold">
                            <Bold className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Italic">
                            <Italic className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Insert Link">
                            <LinkIcon className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                        <div className="flex-1" />
                        <button className="p-2 hover:bg-gray-100 rounded" title="Attach File">
                            <Paperclip className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                        </button>
                    </div>

                    {/* Body */}
                    <textarea
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        required
                        placeholder="Write your message..."
                        rows={12}
                        className="w-full resize-none"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '12px',
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> to send
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary px-6 py-2"
                            style={{
                                backgroundColor: 'white',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                            }}
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={loading || !formData.to || !formData.subject || !formData.body}
                            className="btn-primary px-6 py-2 flex items-center gap-2"
                            style={{
                                backgroundColor: 'var(--color-button-primary)',
                                color: 'white',
                                borderRadius: '6px',
                                opacity: (loading || !formData.to || !formData.subject || !formData.body) ? 0.6 : 1,
                            }}
                        >
                            <Send className="w-4 h-4" />
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
