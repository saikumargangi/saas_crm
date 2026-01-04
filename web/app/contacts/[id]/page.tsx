"use client";

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { User, Mail, Phone, Building, Briefcase, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [contact, setContact] = useState<any>(null);
    const [company, setCompany] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [leadScore, setLeadScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const contactRes = await api.get(`/crm/contacts/${id}`);
            setContact(contactRes.data);

            if (contactRes.data.company_id) {
                api.get(`/crm/companies/${contactRes.data.company_id}`)
                    .then(res => setCompany(res.data))
                    .catch(e => console.error("No company found", e));
            }

            const activitiesRes = await api.get(`/crm/activities?contact_id=${id}`);
            setActivities(activitiesRes.data);

            // Fetch Summary
            api.get(`/crm/contacts/${id}/summary`)
                .then(res => setSummary(res.data))
                .catch(e => console.error("No summary found", e));

            const profile = {
                title: contactRes.data.title || 'Unknown',
                industry: 'Technology',
            };

            const activityHistory = activitiesRes.data.map((a: any) => ({
                type: a.type,
                timestamp: a.created_at
            }));

            const scoreRes = await api.post('/ai/score/lead', {
                profile: profile,
                activities: activityHistory
            });
            setLeadScore(scoreRes.data.score);

        } catch (err) {
            console.error("Failed to fetch contact details", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!contact) return <div className="p-8">Contact not found</div>;

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                            {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-text-primary mb-1">{contact.first_name} {contact.last_name}</h1>
                            <div className="flex gap-4 text-text-secondary text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> {contact.email}
                                </div>
                                {contact.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> {contact.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Score Widget */}
                    <div className="card p-4 border-l-4 border-l-purple-500 w-64 shadow-md bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold">
                            <Star className="w-4 h-4" /> AI Lead Score
                        </div>
                        <div className="text-3xl font-bold text-text-primary mb-1">
                            {leadScore !== null ? Math.round(leadScore * 100) : '-'} / 100
                        </div>
                        <div className="text-xs text-text-tertiary">
                            Based on profile and activity
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="card">
                            <h3 className="font-semibold text-lg mb-4">Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-text-secondary block mb-1">Lead Status</span>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">{contact.lead_status}</span>
                                </div>
                                <div>
                                    <span className="text-text-secondary block mb-1">Source</span>
                                    <span className="capitalize">{contact.source || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="text-text-secondary block mb-1">Company</span>
                                    {company ? (
                                        <Link href={`/companies/${company.id}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                            <Building className="w-3 h-3" /> {company.name}
                                        </Link>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Relationship Summary */}
                        {summary && (
                            <div className="card border-l-4 border-l-blue-500">
                                <h3 className="font-semibold text-lg mb-4">Relationship Summary</h3>
                                <p className="text-sm text-text-secondary mb-4 italic">{summary.summary_text}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-text-secondary block mb-1">First Contact</span>
                                        <span className="font-medium">{summary.first_interaction ? new Date(summary.first_interaction).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-text-secondary block mb-1">Last Interaction</span>
                                        <span className="font-medium">{summary.last_interaction ? new Date(summary.last_interaction).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-text-secondary block mb-1">Latest Email Snippet</span>
                                        <div className="bg-gray-50 p-2 rounded text-xs text-text-primary italic">
                                            "{summary.last_email_snippet || 'No snippet available'}"
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <h3 className="font-semibold text-lg mb-4">Activity History</h3>
                            <div className="space-y-4">
                                {activities.length > 0 ? (
                                    activities.map((activity: any) => (
                                        <div key={activity.id} className="flex gap-4 p-3 border-b border-border last:border-0 hover:bg-gray-50/50 rounded-md transition-colors">
                                            <div className="mt-1">
                                                <MessageSquare className="w-4 h-4 text-text-tertiary" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-text-primary capitalize">{activity.type}</div>
                                                <div className="text-sm text-text-secondary">{activity.subject || activity.description || 'No details'}</div>
                                                <div className="text-xs text-text-tertiary mt-1">
                                                    {new Date(activity.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-text-tertiary text-sm py-4 text-center">No activities recorded.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="card bg-blue-50/50 border-blue-100">
                            <h3 className="font-semibold text-sm mb-2 text-blue-800">Quick Actions</h3>
                            <div className="space-y-2">
                                <button className="btn-secondary w-full justify-start text-xs bg-white">Log Call</button>
                                <button className="btn-secondary w-full justify-start text-xs bg-white">Send Email</button>
                                <button className="btn-secondary w-full justify-start text-xs bg-white">Create Task</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
