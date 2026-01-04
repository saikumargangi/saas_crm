"use client";

import { MoreHorizontal, Plus } from 'lucide-react';

interface Deal {
    id: string;
    title: string;
    value: string;
    company: string;
    owner: string;
    stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed';
}

const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed'];

const MOCK_DEALS: Deal[] = [
    { id: '1', title: 'Enterprise License', value: '$120,000', company: 'Acme Corp', owner: 'John', stage: 'Negotiation' },
    { id: '2', title: 'Q1 Consulting', value: '$45,000', company: 'TechStart', owner: 'Sarah', stage: 'Prospecting' },
    { id: '3', title: 'Maintenance Contract', value: '$12,000', company: 'SmallBiz', owner: 'Mike', stage: 'Qualification' },
    { id: '4', title: 'Global Expansion', value: '$1,500,000', company: 'GlobalInc', owner: 'John', stage: 'Proposal' },
    { id: '5', title: 'Renewals', value: '$85,000', company: 'OldClient', owner: 'Sarah', stage: 'Closed' },
];

export default function KanbanBoard() {
    return (
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
                                {MOCK_DEALS.filter(d => d.stage === stage).length}
                            </span>
                        </div>
                        <button className="text-text-tertiary hover:text-text-secondary">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Cards Container */}
                    <div className="p-3 space-y-3 overflow-y-auto flex-1 bg-gray-50/50">
                        {MOCK_DEALS.filter(d => d.stage === stage).map(deal => (
                            <div key={deal.id} className="card bg-surface hover:shadow-md cursor-grab active:cursor-grabbing group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-sm">{deal.company}</span>
                                    <button className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                                <h4 className="text-sm font-semibold text-text-primary mb-1">{deal.title}</h4>
                                <div className="text-lg font-bold text-text-primary mb-3">{deal.value}</div>

                                <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-avatar-pink flex items-center justify-center text-[10px] font-bold">
                                            {deal.owner[0]}
                                        </div>
                                        <span className="text-xs text-text-secondary">{deal.owner}</span>
                                    </div>
                                    <span className="text-[10px] text-text-tertiary">2 days ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
