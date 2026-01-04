"use client";

import { DollarSign, Briefcase, TrendingUp } from 'lucide-react';

interface PipelineMetrics {
    total_value: number;
    deal_count: number;
    win_rate: number;
    by_stage: Record<string, { count: number; value: number }>;
}

export default function PipelineWidget({ metrics }: { metrics?: PipelineMetrics }) {
    if (!metrics) return <div className="card p-4 animate-pulse h-64 bg-gray-100"></div>;

    const stages = Object.entries(metrics.by_stage).map(([stage, data]) => ({
        label: stage,
        count: data.count,
        value: `$${(data.value / 1000).toFixed(1)}k`,
        color: stage === 'Closed' ? 'bg-green-500' : 'bg-blue-500', // simplified logic
        width: 'w-1/2' // simplified for now
    }));

    return (
        <div className="card">
            <h3 className="text-lg font-serif font-semibold mb-4 text-text-primary">Pipeline Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-full text-green-700">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">Total Value</span>
                    </div>
                    <div className="text-2xl font-bold font-serif">${metrics.total_value.toLocaleString()}</div>
                    <div className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Live Data
                    </div>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-full text-blue-700">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">Open Deals</span>
                    </div>
                    <div className="text-2xl font-bold font-serif">{metrics.deal_count}</div>
                    <div className="text-xs text-text-tertiary mt-1">
                        Active Pipeline
                    </div>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-full text-purple-700">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">Win Rate</span>
                    </div>
                    <div className="text-2xl font-bold font-serif">{metrics.win_rate}%</div>
                    <div className="text-xs text-text-tertiary mt-1">
                        Conversion
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3 text-text-secondary">Stage Breakdown</h4>
                <div className="space-y-3">
                    {stages.map((s: any) => (
                        <StageRow key={s.label} {...s} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StageRow({ label, count, value, color, width }: any) {
    return (
        <div className="flex items-center text-sm">
            <div className="w-24 text-text-secondary">{label}</div>
            <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} ${width}`} />
            </div>
            <div className="w-24 text-right">
                <span className="font-semibold">{value}</span>
                <span className="text-xs text-text-tertiary ml-1">({count})</span>
            </div>
        </div>
    )
}
