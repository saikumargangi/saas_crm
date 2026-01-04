'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash, Save } from 'lucide-react';
import api from '@/lib/api';

interface WorkflowNode {
    id: string;
    type: 'trigger' | 'condition' | 'action';
    config: any;
}

export default function WorkflowBuilderPage() {
    const router = useRouter();
    const [workflowName, setWorkflowName] = useState('');
    const [trigger, setTrigger] = useState<any>(null);
    const [conditions, setConditions] = useState<any[]>([]);
    const [actions, setActions] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    const triggerTypes = [
        { value: 'email_received', label: 'Email Received', icon: '📧' },
        { value: 'contact_updated', label: 'Contact Updated', icon: '👤' },
        { value: 'deal_stage_changed', label: 'Deal Stage Changed', icon: '💼' },
        { value: 'scheduled', label: 'Scheduled', icon: '⏰' },
    ];

    const conditionTypes = [
        { value: 'email_contains', label: 'Email Contains', icon: '🔍' },
        { value: 'contact_field_equals', label: 'Contact Field Equals', icon: '=' },
        { value: 'deal_amount_greater', label: 'Deal Amount Greater Than', icon: '💰' },
    ];

    const actionTypes = [
        { value: 'classify_email', label: 'Classify Email (AI)', icon: '🤖' },
        { value: 'update_contact', label: 'Update Contact', icon: '✏️' },
        { value: 'send_notification', label: 'Send Notification', icon: '🔔' },
        { value: 'create_task', label: 'Create Task', icon: '✅' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/automation/workflows', {
                name: workflowName,
                trigger_type: trigger?.type,
                trigger_config: trigger?.config || {},
                conditions: conditions.map(c => ({ type: c.type, config: c.config })),
                actions: actions.map(a => ({ type: a.type, config: a.config })),
                is_active: true,
            });
            router.push('/workflows');
        } catch (error) {
            console.error('Failed to save workflow:', error);
        } finally {
            setSaving(false);
        }
    };

    const addCondition = () => {
        setConditions([...conditions, { type: 'email_contains', config: {} }]);
    };

    const addAction = () => {
        setActions([...actions, { type: 'classify_email', config: {} }]);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.push('/workflows')}
                    className="flex items-center gap-2 text-sm mb-6 hover:opacity-80"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Workflows
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-text-primary mb-2">Workflow Builder</h1>
                        <p className="text-text-secondary">Create automated workflows for your CRM</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !workflowName || !trigger}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Workflow'}
                    </button>
                </div>

                {/* Workflow Name */}
                <div className="card mb-6">
                    <label className="block text-sm font-medium mb-2">Workflow Name</label>
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        placeholder="e.g., Auto-classify incoming emails"
                        className="w-full p-3 border rounded-lg"
                    />
                </div>

                {/* Trigger */}
                <div className="card mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            1
                        </div>
                        <h2 className="text-lg font-semibold">When this happens...</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {triggerTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setTrigger({ type: type.value, config: {} })}
                                className={`p-4 border-2 rounded-lg text-left transition-all ${trigger?.type === type.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-2xl mb-2">{type.icon}</div>
                                <div className="font-medium">{type.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conditions */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                2
                            </div>
                            <h2 className="text-lg font-semibold">If these conditions are met...</h2>
                        </div>
                        <button onClick={addCondition} className="btn-secondary text-sm flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            Add Condition
                        </button>
                    </div>

                    {conditions.length === 0 ? (
                        <p className="text-center py-8 text-text-secondary">
                            No conditions added. Click "Add Condition" to add filters.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {conditions.map((condition, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                                    <select
                                        value={condition.type}
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[index].type = e.target.value;
                                            setConditions(newConditions);
                                        }}
                                        className="flex-1 p-2 border rounded"
                                    >
                                        {conditionTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Value..."
                                        className="flex-1 p-2 border rounded"
                                        onChange={(e) => {
                                            const newConditions = [...conditions];
                                            newConditions[index].config = { value: e.target.value };
                                            setConditions(newConditions);
                                        }}
                                    />
                                    <button
                                        onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                                        className="p-2 hover:bg-gray-100 rounded text-red-600"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                3
                            </div>
                            <h2 className="text-lg font-semibold">Do these actions...</h2>
                        </div>
                        <button onClick={addAction} className="btn-secondary text-sm flex items-center gap-1">
                            <Plus className="w-4 h-4" />
                            Add Action
                        </button>
                    </div>

                    {actions.length === 0 ? (
                        <p className="text-center py-8 text-text-secondary">
                            No actions added. Click "Add Action" to define what happens.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {actions.map((action, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                                    <select
                                        value={action.type}
                                        onChange={(e) => {
                                            const newActions = [...actions];
                                            newActions[index].type = e.target.value;
                                            setActions(newActions);
                                        }}
                                        className="flex-1 p-2 border rounded"
                                    >
                                        {actionTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setActions(actions.filter((_, i) => i !== index))}
                                        className="p-2 hover:bg-gray-100 rounded text-red-600"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Summary */}
                {trigger && (
                    <div className="card bg-blue-50 border-blue-200">
                        <h3 className="font-semibold mb-3">Workflow Summary</h3>
                        <div className="space-y-2 text-sm">
                            <p>
                                <strong>When:</strong> {triggerTypes.find(t => t.value === trigger.type)?.label}
                            </p>
                            {conditions.length > 0 && (
                                <p>
                                    <strong>If:</strong> {conditions.length} condition(s) are met
                                </p>
                            )}
                            <p>
                                <strong>Then:</strong> Execute {actions.length} action(s)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
