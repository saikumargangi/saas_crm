"use client";

import { Phone, Mail, Calendar, CheckCircle } from 'lucide-react';

interface ActivityMetrics {
    calls_count: number;
    meetings_count: number;
    emails_count: number;
    recent_activities: any[]; // Assuming backend returns list
}

export default function ActivityWidget({ metrics }: { metrics?: ActivityMetrics }) {
    // If no real data for feed yet, fall back to mock or empty. 
    // Backend analytics engine currently returns aggregate counts, 
    // we might need to update backend to return recent items list or just show counts.
    // For now, let's visualize the counts.

    if (!metrics) return <div className="card h-full p-4 animate-pulse bg-gray-100"></div>;

    const stats = [
        { label: 'Calls', count: metrics.calls_count, icon: Phone, color: 'text-blue-600 bg-blue-100' },
        { label: 'Emails', count: metrics.emails_count, icon: Mail, color: 'text-yellow-600 bg-yellow-100' },
        { label: 'Meetings', count: metrics.meetings_count, icon: Calendar, color: 'text-purple-600 bg-purple-100' },
    ];

    return (
        <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-serif font-semibold text-text-primary">Engagement (30 Days)</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {stats.map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1 ${s.color}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-xl">{s.count}</div>
                        <div className="text-xs text-text-secondary">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-text-secondary">Recent Logs</h4>
                <div className="text-sm text-text-tertiary italic text-center p-4">
                    Activity feed integration pending backend update.
                </div>
            </div>
        </div>
    );
}
