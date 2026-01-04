'use client';

import { useState } from 'react';
import { Calendar, Download, Filter } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { RevenueChart, PipelineFunnel } from '@/components/dashboard/Charts';

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    const [loading, setLoading] = useState(false);

    const metrics = [
        { id: 'revenue', label: 'Revenue Analysis', icon: '💰' },
        { id: 'pipeline', label: 'Pipeline Performance', icon: '📊' },
        { id: 'conversion', label: 'Conversion Rates', icon: '🎯' },
        { id: 'email', label: 'Email Metrics', icon: '📧' },
    ];

    const exportReport = async () => {
        try {
            const { data } = await api.get(`/analytics/export?metric=${selectedMetric}&start=${dateRange.start}&end=${dateRange.end}`);
            // Trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${selectedMetric}-${Date.now()}.json`;
            a.click();
        } catch (error) {
            console.error('Failed to export report:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-text-primary">Analytics</h1>
                        <p className="text-text-secondary">Deep dive into your CRM data</p>
                    </div>
                    <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Date Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="flex-1 p-2 border rounded"
                                />
                                <span className="flex items-center">to</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="flex-1 p-2 border rounded"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">Metric</label>
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                className="w-full p-2 border rounded"
                            >
                                {metrics.map((metric) => (
                                    <option key={metric.id} value={metric.id}>
                                        {metric.icon} {metric.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Deals', value: '156', change: '+12%' },
                        { label: 'Win Rate', value: '32%', change: '+5%' },
                        { label: 'Avg Deal Size', value: '$45K', change: '+8%' },
                        { label: 'Sales Velocity', value: '18 days', change: '-3 days' },
                    ].map((stat, i) => (
                        <div key={i} className="card">
                            <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold mb-1">{stat.value}</p>
                            <p className="text-sm text-green-600">{stat.change}</p>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <RevenueChart
                        data={[
                            { month: 'Jan', revenue: 45000 },
                            { month: 'Feb', revenue: 52000 },
                            { month: 'Mar', revenue: 61000 },
                            { month: 'Apr', revenue: 58000 },
                            { month: 'May', revenue: 70000 },
                        ]}
                    />
                    <PipelineFunnel
                        data={[
                            { stage: 'Prospect', count: 45, value: 450000 },
                            { stage: 'Qualified', count: 32, value: 640000 },
                            { stage: 'Proposal', count: 18, value: 540000 },
                            { stage: 'Negotiation', count: 12, value: 480000 },
                            { stage: 'Won', count: 8, value: 400000 },
                        ]}
                    />
                </div>

                {/* Detailed Table */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b">
                                <tr>
                                    <th className="p-3 text-sm font-semibold">Period</th>
                                    <th className="p-3 text-sm font-semibold">Deals</th>
                                    <th className="p-3 text-sm font-semibold">Revenue</th>
                                    <th className="p-3 text-sm font-semibold">Win Rate</th>
                                    <th className="p-3 text-sm font-semibold">Avg Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { period: 'Jan 2024', deals: 28, revenue: '$45,000', winRate: '28%', avgSize: '$1,607' },
                                    { period: 'Feb 2024', deals: 32, revenue: '$52,000', winRate: '31%', avgSize: '$1,625' },
                                    { period: 'Mar 2024', deals: 38, revenue: '$61,000', winRate: '34%', avgSize: '$1,605' },
                                    { period: 'Apr 2024', deals: 35, revenue: '$58,000', winRate: '32%', avgSize: '$1,657' },
                                    { period: 'May 2024', deals: 42, revenue: '$70,000', winRate: '36%', avgSize: '$1,667' },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{row.period}</td>
                                        <td className="p-3">{row.deals}</td>
                                        <td className="p-3 font-semibold">{row.revenue}</td>
                                        <td className="p-3">{row.winRate}</td>
                                        <td className="p-3">{row.avgSize}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
