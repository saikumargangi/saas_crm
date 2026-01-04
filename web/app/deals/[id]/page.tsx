"use client";

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { DollarSign, Layout, Calendar, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [deal, setDeal] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [contact, setContact] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const dealRes = await api.get(`/crm/deals/${id}`);
            const dealData = dealRes.data;
            setDeal(dealData);

            // Fetch related entities
            if (dealData.company_id) {
                api.get(`/crm/companies/${dealData.company_id}`)
                    .then(res => setCompany(res.data))
                    .catch(e => console.error(e));
            }
            if (dealData.contact_id) {
                api.get(`/crm/contacts/${dealData.contact_id}`)
                    .then(res => setContact(res.data))
                    .catch(e => console.error(e));
            }

            // Get AI Suggestions
            // We mock a classification based on the stage to get relevant suggestions from our simple AI service.
            // In a real flow, this would come from analyzing the last interaction.
            let mockClassification: Record<string, number> = {};

            if (['lead', 'negotiation', 'proposal'].includes(dealData.stage)) {
                mockClassification = { 'sales_inquiry': 0.9, 'support': 0.1 };
            } else if (dealData.stage === 'closed_lost') {
                mockClassification = { 'complaint': 0.6, 'sales_inquiry': 0.1 };
            } else {
                mockClassification = { 'other': 0.8 };
            }

            const context = {
                stage: dealData.stage,
                amount: dealData.amount,
                closed_date: dealData.expected_close_date,
            };

            const actionsRes = await api.post('/ai/suggest/actions', {
                classification: mockClassification,
                context: context
            });
            setSuggestions(actionsRes.data.actions || []);

        } catch (err) {
            console.error("Failed to fetch deal details", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!deal) return <div className="p-8">Deal not found</div>;

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    });

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase rounded-full tracking-wide">
                                {deal.stage}
                            </span>
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">{deal.title}</h1>
                        <div className="text-2xl text-text-secondary font-mono">
                            {formatter.format(deal.amount)}
                        </div>
                    </div>

                    {/* AI Suggestions Widget */}
                    <div className="card p-5 border-l-4 border-l-indigo-500 w-80 shadow-md bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3 text-indigo-700 font-semibold border-b border-indigo-100 pb-2">
                            <AlertCircle className="w-4 h-4" /> AI Suggested Actions
                        </div>
                        <div className="space-y-2">
                            {suggestions.length > 0 ? (
                                suggestions.map((action, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                                        <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                        <span>{action}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-text-tertiary">No specific actions suggested.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="card">
                            <h3 className="font-semibold text-lg mb-4">Deal Information</h3>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <span className="text-text-secondary block mb-1">Company</span>
                                    {company ? (
                                        <Link href={`/companies/${company.id}`} className="font-medium text-blue-600 hover:underline">
                                            {company.name}
                                        </Link>
                                    ) : '-'}
                                </div>
                                <div>
                                    <span className="text-text-secondary block mb-1">Main Contact</span>
                                    {contact ? (
                                        <Link href={`/contacts/${contact.id}`} className="font-medium text-blue-600 hover:underline">
                                            {contact.first_name} {contact.last_name}
                                        </Link>
                                    ) : '-'}
                                </div>
                                <div>
                                    <span className="text-text-secondary block mb-1">Expected Close Date</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-text-tertiary" />
                                        {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-text-secondary block mb-1">Probability</span>
                                    {/* Mock probability based on stage */}
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                                    </div>
                                    <span className="text-xs text-text-tertiary mt-1 block">60% Estimate</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="font-semibold text-lg mb-4">Timeline</h3>
                            <div className="relative border-l border-border ml-2 space-y-6 pb-2">
                                <div className="ml-6 relative">
                                    <span className="absolute -left-[31px] bg-green-500 w-3 h-3 rounded-full border-2 border-white ring-1 ring-gray-200"></span>
                                    <h4 className="text-sm font-semibold text-text-primary">Deal Created</h4>
                                    <p className="text-xs text-text-tertiary">{new Date(deal.created_at).toLocaleString()}</p>
                                </div>
                                {/* Placeholder for more timeline events */}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <div className="card bg-gray-50 border-gray-200">
                            <h3 className="font-semibold text-sm mb-3 text-text-primary">Stage Progression</h3>
                            <div className="space-y-1">
                                {['lead', 'negotiation', 'closed'].map((s, i) => (
                                    <div key={s} className={`flex items-center gap-2 text-sm p-2 rounded-md ${deal.stage === s ? 'bg-white shadow-sm font-medium border border-gray-200' : 'text-text-tertiary'}`}>
                                        {deal.stage === s ? <CheckCircle className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300"></div>}
                                        <span className="capitalize">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
