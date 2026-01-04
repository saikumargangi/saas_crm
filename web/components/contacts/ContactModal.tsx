'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Phone, Building, Calendar, Tag } from 'lucide-react';
import api from '@/lib/api';

interface Contact {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company_id?: string;
    lead_status?: string;
    lead_score?: number;
    source?: string;
    custom_fields?: Record<string, any>;
}

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: Contact | null;
    onSave: () => void;
}

export default function ContactModal({ isOpen, onClose, contact, onSave }: ContactModalProps) {
    const [formData, setFormData] = useState<Contact>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_id: '',
        lead_status: 'new',
        source: 'manual',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (contact) {
            setFormData(contact);
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                company_id: '',
                lead_status: 'new',
                source: 'manual',
            });
        }
    }, [contact]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (contact?.id) {
                // Update existing contact
                await api.put(`/crm/contacts/${contact.id}`, formData);
            } else {
                // Create new contact
                await api.post('/crm/contacts', formData);
            }

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save contact');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h2 className="text-2xl font-serif font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {contact ? 'Edit Contact' : 'New Contact'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-md" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                <span className="flex items-center gap-2">
                                    First Name <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                placeholder="John"
                                className="w-full"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    padding: '10px 12px',
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                placeholder="Doe"
                                className="w-full"
                                style={{
                                    backgroundColor: 'var(--color-surface)',
                                    color: 'var(--color-text-primary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    padding: '10px 12px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email <span className="text-red-500">*</span>
                            </span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="john.doe@company.com"
                            className="w-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                            }}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone
                            </span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            placeholder="+1 (555) 123-4567"
                            className="w-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                            }}
                        />
                    </div>

                    {/* Lead Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Lead Status
                            </span>
                        </label>
                        <select
                            name="lead_status"
                            value={formData.lead_status}
                            onChange={handleChange}
                            className="w-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                            }}
                        >
                            <option value="new">New</option>
                            <option value="qualified">Qualified</option>
                            <option value="contacted">Contacted</option>
                            <option value="converted">Converted</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Source
                        </label>
                        <select
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            className="w-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                            }}
                        >
                            <option value="manual">Manual Entry</option>
                            <option value="email">Email</option>
                            <option value="import">Import</option>
                            <option value="api">API</option>
                            <option value="website">Website</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-6 py-2"
                            style={{
                                backgroundColor: 'var(--color-button-primary)',
                                color: 'white',
                                borderRadius: '6px',
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
