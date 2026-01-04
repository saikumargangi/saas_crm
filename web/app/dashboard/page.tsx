'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { RevenueChart, PipelineFunnel, LeadDistribution, MetricCard, ConversionFunnel } from '@/components/dashboard/Charts';

export default function EnhancedDashboardPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data } = await api.get('/analytics/dashboard/summary');
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    // Mock data for charts (replace with real data from API)
    const revenueData = [
        { month: 'Jan', revenue: 45000, forecast: 48000 },
        { month: 'Feb', revenue: 52000, forecast: 55000 },
        { month: 'Mar', revenue: 61000, forecast: 63000 },
        { month: 'Apr', revenue: 58000, forecast: 67000 },
        { month: 'May', revenue: 70000, forecast: 72000 },
        { month: 'Jun', revenue: 0, forecast: 78000 },
    ];

    const pipelineData = [
        { stage: 'Prospect', count: 45, value: 450000 },
        { stage: 'Qualified', count: 32, value: 640000 },
        { stage: 'Proposal', count: 18, value: 540000 },
        { stage: 'Negotiation', count: 12, value: 480000 },
        { stage: 'Won', count: 8, value: 400000 },
    ];

    const leadDistData = [
        { name: 'New', value: 45 },
        { name: 'Qualified', value: 32 },
        { name: 'Contacted', value: 28 },
        { name: 'Converted', value: 15 },
        { name: 'Lost', value: 10 },
    ];

    const conversionData = [
        { stage: 'Leads', count: 130, percentage: 100 },
        { stage: 'Qualified', count: 75, percentage: 58 },
        { stage: 'Proposal Sent', count: 45, percentage: 35 },
        { stage: 'Negotiation', count: 25, percentage: 19 },
        { stage: 'Closed Won', count: 15, percentage: 12 },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary">Welcome back! Here's your business overview.</p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Revenue"
                        value={`$${(metrics?.total_pipeline_value || 286000).toLocaleString()}`}
                        change={12.5}
                        icon={<DollarSign className="w-5 h-5" />}
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={`${metrics?.lead_conversion_rate || 12}%`}
                        change={2.3}
                        icon={<Target className="w-5 h-5" />}
                    />
                    <MetricCard
                        title="Total Contacts"
                        value={metrics?.total_contacts || 130}
                        change={8.1}
                        icon={<Users className="w-5 h-5" />}
                    />
                    <MetricCard
                        title="Avg Sales Cycle"
                        value={`${metrics?.average_sales_cycle_days || 45} days`}
                        change={-5.2}
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <RevenueChart data={revenueData} />
                    <PipelineFunnel data={pipelineData} />
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <LeadDistribution data={leadDistData} />
                    <ConversionFunnel data={conversionData} />
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">New deal created: Enterprise Plan - Acme Corp</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                        2 hours ago
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
