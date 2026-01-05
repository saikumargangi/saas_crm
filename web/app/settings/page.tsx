'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface OAuthStatus {
    connected: boolean;
    email?: string;
    provider?: string;
    last_sync?: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [gmailStatus, setGmailStatus] = useState<OAuthStatus>({ connected: false });
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkGmailConnection();
        checkSyncStatus();

        // Check for OAuth callback success
        const params = new URLSearchParams(window.location.search);
        if (params.get('gmail_connected') === 'true') {
            setGmailStatus({ connected: true });
            checkSyncStatus();
        }
    }, []);

    const checkGmailConnection = async () => {
        try {
            // Check if user has OAuth token
            const { data } = await api.get('/auth/user/profile');
            // You might want to add an endpoint to check OAuth status
            setLoading(false);
        } catch (err) {
            console.error('Failed to check Gmail connection:', err);
            setLoading(false);
        }
    };

    const checkSyncStatus = async () => {
        try {
            const { data } = await api.get('/email/sync/status');
            setSyncStatus(data);
            if (data.status === 'active') {
                setGmailStatus({ connected: true, email: data.email });
            }
        } catch (err) {
            console.error('Failed to check sync status:', err);
        }
    };

    const connectGmail = async () => {
        setConnecting(true);
        setError(null);

        try {
            const { data } = await api.get('/auth/oauth/gmail');

            if (data.auth_url) {
                // Redirect to Google OAuth
                window.location.href = data.auth_url;
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initiate Gmail connection');
            setConnecting(false);
        }
    };

    const disconnectGmail = async () => {
        if (!confirm('Are you sure you want to disconnect Gmail? This will stop email syncing.')) {
            return;
        }

        try {
            // You might want to add a disconnect endpoint
            await api.post('/email/sync/stop');
            setGmailStatus({ connected: false });
            setSyncStatus(null);
        } catch (err: any) {
            setError(err.message || 'Failed to disconnect Gmail');
        }
    };

    const triggerSync = async () => {
        try {
            await api.post('/email/sync/start');
            alert('Email sync started! This may take a few minutes.');
            checkSyncStatus();
        } catch (err: any) {
            setError(err.message || 'Failed to start sync');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="mt-2 text-gray-600">Manage your account and integrations</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                                    <span className="sr-only">Dismiss</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Gmail Integration Card */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Email Integration</h2>
                        <p className="mt-1 text-sm text-gray-500">Connect your Gmail account to sync emails and contacts</p>
                    </div>

                    <div className="px-6 py-6">
                        {gmailStatus.connected ? (
                            <div className="space-y-6">
                                {/* Connected Status */}
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-900">Gmail Connected</p>
                                            {gmailStatus.email && (
                                                <p className="text-sm text-green-700">{gmailStatus.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={disconnectGmail}
                                        className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Disconnect
                                    </button>
                                </div>

                                {/* Sync Status */}
                                {syncStatus && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Sync Status</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Status</p>
                                                <p className="text-sm font-medium text-gray-900 capitalize">{syncStatus.sync_status || 'Active'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Last Sync</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {syncStatus.last_sync_at ? new Date(syncStatus.last_sync_at).toLocaleString() : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={triggerSync}
                                            className="mt-4 w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Sync Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Connect Your Gmail</h3>
                                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                                    Connect your Gmail account to automatically sync emails, extract contacts, and enable AI-powered insights.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={connectGmail}
                                        disabled={connecting}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {connecting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="-ml-1 mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                                Connect Gmail Account
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="mt-4 text-xs text-gray-500">
                                    We'll redirect you to Google to authorize access. Your credentials are never stored.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Settings Sections (Placeholder) */}
                <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                    </div>
                    <div className="px-6 py-6">
                        <p className="text-sm text-gray-500">Additional account settings coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
