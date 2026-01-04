'use client';

import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Settings as SettingsIcon } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

interface Integration {
    id: string;
    name: string;
    provider: string;
    status: 'connected' | 'disconnected';
    config?: any;
}

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);

    const availableIntegrations = [
        {
            name: 'Google Sheets',
            provider: 'google_sheets',
            description: 'Export contacts and deals to Google Sheets',
            icon: '📊',
        },
        {
            name: 'Slack',
            provider: 'slack',
            description: 'Get notifications in Slack channels',
            icon: '💬',
        },
        {
            name: 'Webhooks',
            provider: 'webhooks',
            description: 'Send data to external services via webhooks',
            icon: '🔗',
        },
        {
            name: 'Zapier',
            provider: 'zapier',
            description: 'Connect with 3000+ apps via Zapier',
            icon: '⚡',
        },
    ];

    const handleConnect = async (provider: string) => {
        try {
            const { data } = await api.post('/integrations', { provider });
            if (data.auth_url) {
                window.location.href = data.auth_url;
            }
        } catch (error) {
            console.error('Failed to connect integration:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-serif font-bold text-text-primary">Integrations</h1>
                    <p className="text-text-secondary">Connect your CRM with other tools</p>
                </div>

                {/* Available Integrations */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Available Integrations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableIntegrations.map((integration) => {
                            const isConnected = integrations.some(i => i.provider === integration.provider && i.status === 'connected');

                            return (
                                <div key={integration.provider} className="card">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="text-4xl">{integration.icon}</div>
                                        {isConnected ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600">
                                                <CheckCircle className="w-4 h-4" />
                                                Connected
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <XCircle className="w-4 h-4" />
                                                Not connected
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold mb-2">{integration.name}</h3>
                                    <p className="text-sm text-text-secondary mb-4">{integration.description}</p>

                                    {isConnected ? (
                                        <div className="flex gap-2">
                                            <button className="flex-1 btn-secondary text-sm">
                                                <SettingsIcon className="w-4 h-4 mr-1 inline" />
                                                Configure
                                            </button>
                                            <button className="flex-1 btn-secondary text-sm text-red-600">
                                                Disconnect
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(integration.provider)}
                                            className="w-full btn-primary text-sm"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Webhooks Section */}
                <div className="card">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-semibold">Webhooks</h2>
                            <p className="text-sm text-text-secondary">Send real-time data to external services</p>
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Webhook
                        </button>
                    </div>

                    <div className="space-y-3">
                        {[
                            { url: 'https://api.example.com/webhook', events: ['contact.created', 'deal.updated'], status: 'active' },
                            { url: 'https://hooks.slack.com/services/...', events: ['email.received'], status: 'active' },
                        ].map((webhook, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{webhook.url}</code>
                                    <div className="flex gap-2 mt-2">
                                        {webhook.events.map((event) => (
                                            <span key={event} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                                {event}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                        {webhook.status}
                                    </span>
                                    <button className="p-2 hover:bg-gray-100 rounded">
                                        <SettingsIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
