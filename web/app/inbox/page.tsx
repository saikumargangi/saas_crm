"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import EmailList from '@/components/inbox/EmailList';
import EmailDetail from '@/components/inbox/EmailDetail';
import { RefreshCw } from 'lucide-react';

import Sidebar from '@/components/Sidebar';

export default function InboxPage() {
    const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const res = await api.get('/email/messages');
            setEmails(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    return (
        <div className="flex h-screen bg-background text-text-primary font-sans overflow-hidden">
            <Sidebar />

            {/* Email List */}
            <div className="w-full md:w-80 lg:w-96 border-r border-border bg-surface flex flex-col">
                <div className="p-2 border-b border-border flex justify-between items-center">
                    <h2 className="font-semibold px-2">Messages</h2>
                    <button onClick={fetchEmails} className="p-2 hover:bg-gray-100 rounded-full">
                        <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <EmailList
                    emails={emails}
                    onSelect={setSelectedEmailId}
                    selectedId={selectedEmailId}
                />
            </div>

            {/* Email Detail */}
            <div className="flex-1 flex flex-col bg-background min-w-0">
                {selectedEmail ? (
                    <EmailDetail email={selectedEmail} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-text-tertiary">
                        Select an email to view
                    </div>
                )}
            </div>
        </div>
    );
}

