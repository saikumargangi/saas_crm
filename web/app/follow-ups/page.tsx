"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Mail, Loader2, Sparkles } from 'lucide-react';

interface FollowUpContact {
    id: string;
    name: string;
    email: string;
    follow_up_note: string;
    follow_up_priority: string;
    follow_up_date: string;
    last_email_date: string;
}

export default function FollowUpsPage() {
    const router = useRouter();
    const [contacts, setContacts] = useState<FollowUpContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<string | null>(null);
    const [draftingEmail, setDraftingEmail] = useState(false);

    useEffect(() => {
        fetchFollowUps();
    }, []);

    const fetchFollowUps = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/crm/contacts/needs-follow-up`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts || []);
            }
        } catch (error) {
            console.error('Failed to fetch follow-ups:', error);
        } finally {
            setLoading(false);
        }
    };

    const markComplete = async (contactId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/crm/contacts/${contactId}/follow-up/complete`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                // Remove from list
                setContacts(contacts.filter(c => c.id !== contactId));
            }
        } catch (error) {
            console.error('Failed to mark complete:', error);
        }
    };

    const draftEmail = async (contactId: string, context: string) => {
        setDraftingEmail(true);
        setSelectedContact(contactId);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/ai/draft-email`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contact_id: contactId,
                        context: context,
                        tone: 'professional'
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                // Show draft in modal (to be implemented)
                alert(`Subject: ${data.draft.subject}\n\nBody:\n${data.draft.body}`);
            }
        } catch (error) {
            console.error('Failed to draft email:', error);
        } finally {
            setDraftingEmail(false);
            setSelectedContact(null);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Follow-Ups</h1>
                <p className="text-gray-600 mt-2">
                    People who need your attention - {contacts.length} pending
                </p>
            </div>

            {contacts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
                    <p className="text-gray-600">No pending follow-ups at the moment.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Note
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Email
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {contacts.map((contact) => (
                                <tr
                                    key={contact.id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {contact.name}
                                            </div>
                                            <div className="text-sm text-gray-500">{contact.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(
                                                contact.follow_up_priority
                                            )}`}
                                        >
                                            {contact.follow_up_priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate">
                                            {contact.follow_up_note || 'No note'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {contact.last_email_date
                                            ? new Date(contact.last_email_date).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => draftEmail(contact.id, contact.follow_up_note)}
                                                disabled={draftingEmail && selectedContact === contact.id}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {draftingEmail && selectedContact === contact.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-4 h-4" />
                                                )}
                                                Draft Email
                                            </button>
                                            <button
                                                onClick={() => markComplete(contact.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Done
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
