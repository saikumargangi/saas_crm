"use client";

import { useState } from 'react';
import { Search, Loader2, Mail, CheckSquare, Square } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    email_count: number;
    last_email_date: string;
}

export default function CampaignsPage() {
    const [productSearch, setProductSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [campaignName, setCampaignName] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [creating, setCreating] = useState(false);

    const searchByProduct = async () => {
        if (!productSearch.trim()) return;

        setSearching(true);
        setContacts([]);
        setSelectedContacts(new Set());

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/campaigns/search`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        product: productSearch
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                setContacts(data.contacts || []);
                setCampaignName(`${productSearch} Campaign`);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    };

    const toggleContact = (contactId: string) => {
        const newSelected = new Set(selectedContacts);
        if (newSelected.has(contactId)) {
            newSelected.delete(contactId);
        } else {
            newSelected.add(contactId);
        }
        setSelectedContacts(newSelected);
    };

    const toggleAll = () => {
        if (selectedContacts.size === contacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(contacts.map(c => c.id)));
        }
    };

    const createCampaign = async () => {
        if (selectedContacts.size === 0) {
            alert('Please select at least one contact');
            return;
        }

        if (!emailSubject || !emailBody) {
            alert('Please provide email subject and body');
            return;
        }

        setCreating(true);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/campaigns/resend`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        campaign_name: campaignName,
                        product: productSearch,
                        contact_ids: Array.from(selectedContacts),
                        email_template: {
                            subject: emailSubject,
                            body: emailBody
                        }
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                alert(`Campaign created! ${data.contacts_added} contacts added.`);
                // Reset form
                setContacts([]);
                setSelectedContacts(new Set());
                setProductSearch('');
                setCampaignName('');
                setEmailSubject('');
                setEmailBody('');
            }
        } catch (error) {
            console.error('Failed to create campaign:', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
                <p className="text-gray-600 mt-2">
                    Search for people contacted about specific products and resend emails
                </p>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Search by Product</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchByProduct()}
                        placeholder="Enter product name (e.g., 'Product X')"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={searchByProduct}
                        disabled={searching || !productSearch.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {searching ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                        Search
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {contacts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Contact Selection */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Found {contacts.length} contacts
                            </h2>
                            <button
                                onClick={toggleAll}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                {selectedContacts.size === contacts.length ? (
                                    <>
                                        <CheckSquare className="w-4 h-4" />
                                        Deselect All
                                    </>
                                ) : (
                                    <>
                                        <Square className="w-4 h-4" />
                                        Select All
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="divide-y max-h-[500px] overflow-y-auto">
                            {contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                                    onClick={() => toggleContact(contact.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {selectedContacts.has(contact.id) ? (
                                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                            ) : (
                                                <Square className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                                            <p className="text-sm text-gray-600">{contact.email}</p>
                                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                <span>{contact.email_count} emails about {productSearch}</span>
                                                <span>Last: {new Date(contact.last_email_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email Template */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Email Template</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {selectedContacts.size} contacts selected
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Campaign Name
                                </label>
                                <input
                                    type="text"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Product X Launch"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Email subject line"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Body
                                </label>
                                <textarea
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    rows={8}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Email body..."
                                />
                            </div>

                            <button
                                onClick={createCampaign}
                                disabled={creating || selectedContacts.size === 0}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating Campaign...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-5 h-5" />
                                        Create Campaign ({selectedContacts.size} contacts)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
