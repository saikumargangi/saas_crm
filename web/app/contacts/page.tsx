"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MoreHorizontal, Mail, Phone, RefreshCw } from 'lucide-react';

interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company_id?: string;
    lead_status: string;
    created_at: string;
}

import Sidebar from '@/components/Sidebar';

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true); // Ensure loading is true on refresh
        api.get('/crm/contacts')
            .then(res => setContacts(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/crm/contacts');
            setContacts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && contacts.length === 0) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-text-primary">Contacts</h1>
                    <div className="flex gap-3">
                        <button className="btn-secondary" onClick={fetchContacts}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="btn-primary">+ Add Contact</button>
                    </div>
                </div>

                <div className="card overflow-hidden p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Name</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Email</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Status</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Added</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-text-tertiary">No contacts found.</td>
                                </tr>
                            )}
                            {contacts.map(contact => (
                                <tr key={contact.id} className="border-b border-border hover:bg-row-hover transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-avatar-green flex items-center justify-center text-sm font-bold text-text-primary">
                                                {contact.first_name[0]}
                                            </div>
                                            <div className="font-medium text-text-primary">{contact.first_name} {contact.last_name}</div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-text-secondary">{contact.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700`}>
                                            {contact.lead_status || 'New'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-text-tertiary">
                                        {new Date(contact.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-gray-100 rounded-full text-text-secondary" title="Email">
                                                <Mail className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
