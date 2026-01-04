'use client';

import { TrendingUp, Lightbulb, Target, Calendar } from 'lucide-react';

interface AIInsight {
    type: 'lead_score' | 'suggestion' | 'prediction';
    title: string;
    description: string;
    confidence: number;
    action?: string;
}

interface AIInsightsPanelProps {
    contactId?: string;
    dealId?: string;
}

export default function AIInsightsPanel({ contactId, dealId }: AIInsightsPanelProps) {
    // Mock insights - replace with real API data
    const insights: AIInsight[] = [
        {
            type: 'lead_score',
            title: 'High-Value Lead Detected',
            description: 'This contact has a lead score of 85/100 based on email engagement and company size.',
            confidence: 0.85,
            action: 'Schedule a call',
        },
        {
            type: 'suggestion',
            title: 'Follow-up Recommended',
            description: 'It\'s been 5 days since last contact. Send a follow-up email to maintain engagement.',
            confidence: 0.92,
            action: 'Send email',
        },
        {
            type: 'prediction',
            title: '78% Conversion Probability',
            description: 'Based on historical data, this lead has a high likelihood of converting within 30 days.',
            confidence: 0.78,
        },
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'lead_score':
                return <Target className="w-5 h-5" />;
            case 'suggestion':
                return <Lightbulb className="w-5 h-5" />;
            case 'prediction':
                return <TrendingUp className="w-5 h-5" />;
            default:
                return <Lightbulb className="w-5 h-5" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'lead_score':
                return 'text-blue-600 bg-blue-50';
            case 'suggestion':
                return 'text-yellow-600 bg-yellow-50';
            case 'prediction':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="card">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                </div>
                <h3 className="text-lg font-semibold">AI Insights</h3>
            </div>

            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getColor(insight.type)}`}>
                                {getIcon(insight.type)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                        {Math.round(insight.confidence * 100)}% confident
                                    </span>
                                </div>

                                <p className="text-sm text-text-secondary mb-3">{insight.description}</p>

                                {insight.action && (
                                    <button className="text-sm text-blue-600 hover:underline font-medium">
                                        {insight.action} →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lead Score Breakdown */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="font-semibold text-sm mb-3">Lead Score Breakdown</h4>
                <div className="space-y-2">
                    {[
                        { factor: 'Email Engagement', score: 30, max: 30 },
                        { factor: 'Response Time', score: 18, max: 20 },
                        { factor: 'Sentiment', score: 15, max: 20 },
                        { factor: 'Company Size', score: 12, max: 15 },
                        { factor: 'Industry Match', score: 10, max: 15 },
                    ].map((factor) => (
                        <div key={factor.factor}>
                            <div className="flex justify-between text-xs mb-1">
                                <span>{factor.factor}</span>
                                <span className="text-text-secondary">{factor.score}/{factor.max}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-blue-500"
                                    style={{ width: `${(factor.score / factor.max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
