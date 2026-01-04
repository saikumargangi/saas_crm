'use client';

import { useState } from 'react';
import { Plus, Play, Pause, Trash, Edit } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

interface Workflow {
    id: string;
    name: string;
    description?: string;
    trigger_type: string;
    is_active: boolean;
    created_at: string;
}

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleWorkflow = async (id: string, isActive: boolean) => {
        try {
            await api.put(`/automation/workflows/${id}`, { is_active: !isActive });
            setWorkflows(workflows.map(w => w.id === id ? { ...w, is_active: !isActive } : w));
        } catch (error) {
            console.error('Failed to toggle workflow:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-text-primary">Workflows</h1>
                        <p className="text-text-secondary">Automate your CRM processes</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Workflow
                    </button>
                </div>

                {/* Workflow Templates */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Quick Start Templates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { name: 'Auto-classify Emails', desc: 'Automatically classify incoming emails using AI' },
                            { name: 'Lead Scoring', desc: 'Update lead scores when contacts are updated' },
                            { name: 'Follow-up Reminders', desc: 'Send notifications for follow-up actions' },
                        ].map((template, i) => (
                            <div key={i} className="card hover:shadow-md transition-shadow cursor-pointer">
                                <h3 className="font-semibold mb-2">{template.name}</h3>
                                <p className="text-sm text-text-secondary mb-4">{template.desc}</p>
                                <button className="btn-secondary text-sm w-full">Use Template</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Workflows */}
                <div className="card">
                    <h2 className="text-lg font-semibold mb-4">Your Workflows</h2>

                    {workflows.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-text-secondary mb-4">No workflows yet</p>
                            <button className="btn-primary">Create Your First Workflow</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workflows.map((workflow) => (
                                <div
                                    key={workflow.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-row-hover transition-colors"
                                    style={{ borderColor: 'var(--color-border)' }}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-semibold">{workflow.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${workflow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {workflow.is_active ? 'Active' : 'Paused'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary">{workflow.description}</p>
                                        <p className="text-xs text-text-tertiary mt-1">
                                            Trigger: {workflow.trigger_type}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                                            className="p-2 hover:bg-gray-100 rounded-full"
                                            title={workflow.is_active ? 'Pause' : 'Activate'}
                                        >
                                            {workflow.is_active ? (
                                                <Pause className="w-4 h-4" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full" title="Edit">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-full text-red-600" title="Delete">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
