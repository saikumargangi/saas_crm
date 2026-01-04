'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, TrendingUp, Building } from 'lucide-react';
import api from '@/lib/api';

interface Deal {
    id?: string;
    title: string;
    amount: number;
    currency?: string;
    stage: string;
    probability?: number;
    expected_close_date?: string;
    contact_id?: string;
    company_id?: string;
    description?: string;
}

interface DealModalProps {
    isOpen: boolean;
    onClose: () => void;
    deal?: Deal | null;
    onSave: () => void;
    initialStage?: string;
}

const STAGES = ['prospect', 'negotiation', 'committed', 'won', 'lost'];

export default function DealModal({ isOpen, onClose, deal, onSave, initialStage }: DealModalProps) {
    const [formData, setFormData] = useState<Deal>({
        title: '',
        amount: 0,
        currency: 'USD',
        stage: initialStage || 'prospect',
        probability: 50,
        expected_close_date: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (deal) {
            setFormData({
                ...deal,
                expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date).toISOString().split('T')[0] : '',
            });
        } else {
            setFormData({
                title: '',
                amount: 0,
                currency: 'USD',
                stage: initialStage || 'prospect',
                probability: 50,
                expected_close_date: '',
                description: '',
            });
        }
    }, [deal, initialStage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (deal?.id) {
                await api.put(`/crm/deals/${deal.id}`, formData);
            } else {
                await api.post('/crm/deals', formData);
            }

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save deal');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

            <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <h2 className="text-2xl font-serif font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {deal ? 'Edit Deal' : 'New Deal'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-md" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Deal Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Enterprise Plan - Acme Corp"
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

                    {/* Amount and Currency */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                <span className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Amount <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                placeholder="50000"
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
                                Currency
                            </label>
                            <select
                                name="currency"
                                value={formData.currency}
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
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                    </div>

                    {/* Stage */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Stage
                        </label>
                        <select
                            name="stage"
                            value={formData.stage}
                            onChange={handleChange}
                            className="w-full capitalize"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                            }}
                        >
                            {STAGES.map(stage => (
                                <option key={stage} value={stage} className="capitalize">
                                    {stage}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Probability */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Probability ({formData.probability}%)
                            </span>
                        </label>
                        <input
                            type="range"
                            name="probability"
                            value={formData.probability}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="5"
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Expected Close Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Expected Close Date
                            </span>
                        </label>
                        <input
                            type="date"
                            name="expected_close_date"
                            value={formData.expected_close_date}
                            onChange={handleChange}
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Add notes about this deal..."
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
                            {loading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
