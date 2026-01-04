'use client';

import { useState } from 'react';
import { User, Users, Key, Bell, Shield } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'api', label: 'API Keys', icon: Key },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await api.put('/auth/profile', profile);
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-3xl font-serif font-bold text-text-primary mb-8">Settings</h1>

                <div className="flex gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-64 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                            : 'hover:bg-gray-50 text-text-secondary'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {activeTab === 'profile' && (
                            <div className="card max-w-2xl">
                                <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={profile.first_name}
                                                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                                className="w-full p-3 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={profile.last_name}
                                                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                                className="w-full p-3 border rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            className="w-full p-3 border rounded-lg"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                        className="btn-primary"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'team' && (
                            <div className="card max-w-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold">Team Members</h2>
                                    <button className="btn-primary text-sm">Invite Member</button>
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="font-semibold text-blue-600">JD</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">John Doe</p>
                                                    <p className="text-sm text-text-secondary">john@example.com</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                Admin
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'api' && (
                            <div className="card max-w-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold">API Keys</h2>
                                    <button className="btn-primary text-sm">Generate New Key</button>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">Production API Key</span>
                                            <button className="text-sm text-red-600 hover:underline">Revoke</button>
                                        </div>
                                        <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
                                            sk_live_••••••••••••••••1234
                                        </code>
                                        <p className="text-xs text-text-tertiary mt-2">Created on Jan 1, 2024</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="card max-w-2xl">
                                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Email notifications for new leads', checked: true },
                                        { label: 'Deal stage changes', checked: true },
                                        { label: 'Weekly summary reports', checked: false },
                                        { label: 'Team activity updates', checked: true },
                                    ].map((pref, i) => (
                                        <label key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                            <input type="checkbox" defaultChecked={pref.checked} />
                                            <span>{pref.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="card max-w-2xl">
                                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-medium mb-3">Change Password</h3>
                                        <div className="space-y-3">
                                            <input type="password" placeholder="Current password" className="w-full p-3 border rounded-lg" />
                                            <input type="password" placeholder="New password" className="w-full p-3 border rounded-lg" />
                                            <input type="password" placeholder="Confirm new password" className="w-full p-3 border rounded-lg" />
                                            <button className="btn-primary">Update Password</button>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <h3 className="font-medium mb-3">Two-Factor Authentication</h3>
                                        <p className="text-sm text-text-secondary mb-4">
                                            Add an extra layer of security to your account
                                        </p>
                                        <button className="btn-secondary">Enable 2FA</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
