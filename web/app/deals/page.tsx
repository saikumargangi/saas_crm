"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MoreHorizontal, Plus, RefreshCw } from 'lucide-react';

interface Deal {
    id: string;
    title: string;
    amount: number;
    currency: string;
    stage: string;
    company_id?: string;
    updated_at: string;
}

const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed'];

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/crm/deals')
            .then(res => setDeals(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/crm/deals');
            setDeals(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            {/* Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-text-primary">Deals Board</h1>
                            <p className="text-text-secondary">Track your sales pipeline.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn-secondary" onClick={fetchDeals}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button className="btn-primary">+ Add Deal</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
                    <div className="flex h-full overflow-x-auto pb-4 gap-6">
                        {STAGES.map(stage => (
                            <div key={stage} className="flex-none w-80 bg-background rounded-lg flex flex-col h-full max-h-full">
                                {/* Column Header */}
                                <div className="flex items-center justify-between p-3 border-b border-border bg-gray-50 rounded-t-lg sticky top-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${stage === 'Closed' ? 'bg-green-500' :
                                            stage === 'Negotiation' ? 'bg-purple-500' :
                                                'bg-blue-400'
                                            }`} />
                                        <h3 className="font-semibold text-sm text-text-primary uppercase tracking-wide">{stage}</h3>
                                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                            {deals.filter(d => d.stage === stage).length}
                                        </span>
                                    </div>
                                    <button className="text-text-tertiary hover:text-text-secondary">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Cards Container */}
                                <div className="p-3 space-y-3 overflow-y-auto flex-1 bg-gray-50/50">
                                    {deals.filter(d => d.stage === stage).map(deal => (
                                        <div key={deal.id} className="card bg-surface hover:shadow-md cursor-grab active:cursor-grabbing group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-sm">Acme Corp</span>
                                                <button className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <h4 className="text-sm font-semibold text-text-primary mb-1">{deal.title}</h4>
                                            <div className="text-lg font-bold text-text-primary mb-3">${deal.amount.toLocaleString()}</div>

                                            <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                                                <span className="text-[10px] text-text-tertiary">
                                                    {new Date(deal.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
