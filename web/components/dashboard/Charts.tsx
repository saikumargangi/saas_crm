'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
    data: Array<{ month: string; revenue: number; forecast?: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#666666" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#666666" style={{ fontSize: '12px' }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            padding: '8px 12px'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8B9AFF"
                        strokeWidth={2}
                        dot={{ fill: '#8B9AFF', r: 4 }}
                        name="Actual Revenue"
                    />
                    {data.some(d => d.forecast) && (
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#FFBD2E"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#FFBD2E', r: 4 }}
                            name="Forecast"
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

interface PipelineFunnelProps {
    data: Array<{ stage: string; count: number; value: number }>;
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
    const COLORS = ['#8B9AFF', '#A8B5FF', '#C5D0FF', '#E2E8FF', '#28CA42', '#FF5F57'];

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4">Pipeline by Stage</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#666666" style={{ fontSize: '12px' }} />
                    <YAxis dataKey="stage" type="category" stroke="#666666" style={{ fontSize: '12px' }} width={100} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            padding: '8px 12px'
                        }}
                        formatter={(value: any, name: string) => {
                            if (name === 'value') return [`$${value.toLocaleString()}`, 'Total Value'];
                            return [value, 'Count'];
                        }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#8B9AFF" name="Deals" />
                    <Bar dataKey="value" fill="#28CA42" name="Value ($)" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

interface LeadDistributionProps {
    data: Array<{ name: string; value: number }>;
}

export function LeadDistribution({ data }: LeadDistributionProps) {
    const COLORS = ['#8B9AFF', '#28CA42', '#FFBD2E', '#FF5F57', '#00D084'];

    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4">Lead Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            padding: '8px 12px'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
}

export function MetricCard({ title, value, change, icon }: MetricCardProps) {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <div className="card">
            <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {title}
                </p>
                {icon && <div style={{ color: 'var(--color-text-tertiary)' }}>{icon}</div>}
            </div>
            <p className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {value}
            </p>
            {change !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                    <span className={isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}>
                        {isPositive && '↑'}{isNegative && '↓'} {Math.abs(change)}%
                    </span>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>vs last month</span>
                </div>
            )}
        </div>
    );
}

interface ConversionFunnelProps {
    data: Array<{ stage: string; count: number; percentage: number }>;
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
    return (
        <div className="card">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <div className="space-y-3">
                {data.map((stage, index) => (
                    <div key={stage.stage}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{stage.stage}</span>
                            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {stage.count} ({stage.percentage}%)
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="h-3 rounded-full transition-all"
                                style={{
                                    width: `${stage.percentage}%`,
                                    backgroundColor: index === 0 ? '#8B9AFF' :
                                        index === data.length - 1 ? '#28CA42' : '#A8B5FF'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
