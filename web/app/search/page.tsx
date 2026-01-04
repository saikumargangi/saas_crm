"use client";

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { Users, Building, DollarSign } from 'lucide-react';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [loading, setLoading] = useState(false);

    const [contacts, setContacts] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);

    useEffect(() => {
        if (query) {
            performSearch(query);
        }
    }, [query]);

    const performSearch = async (q: string) => {
        setLoading(true);
        try {
            // Execute searches in parallel
            const [contactsRes, companiesRes, dealsRes] = await Promise.all([
                api.get(`/crm/search?q=${q}&index_type=contacts`),
                api.get(`/crm/search?q=${q}&index_type=companies`),
                api.get(`/crm/search?q=${q}&index_type=deals`)
            ]);

            setContacts(contactsRes.data);
            setCompanies(companiesRes.data);
            setDeals(dealsRes.data);

        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (!query) {
        return (
            <div className="min-h-screen bg-background flex">
                <Sidebar />
                <div className="flex-1 p-8 flex items-center justify-center text-text-tertiary">
                    Enter a search term to begin.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-2xl font-serif font-bold text-text-primary mb-6">
                    Search Results for "{query}"
                </h1>

                {loading ? (
                    <div className="text-text-secondary">Searching...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Contacts Results */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" /> Contacts ({contacts.length})
                            </h2>
                            {contacts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {contacts.map((contact: any) => (
                                        <div key={contact.id} className="card hover:shadow-md transition-shadow">
                                            <div className="font-medium text-text-primary">{contact.first_name} {contact.last_name}</div>
                                            <div className="text-sm text-text-secondary mb-2">{contact.email}</div>
                                            <div className="text-xs text-text-tertiary">
                                                Status: {contact.lead_status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-tertiary text-sm">No contacts found.</p>
                            )}
                        </section>

                        {/* Companies Results */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5 text-purple-600" /> Companies ({companies.length})
                            </h2>
                            {companies.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {companies.map((company: any) => (
                                        <Link href={`/companies/${company.id}`} key={company.id} className="card hover:shadow-md transition-shadow block">
                                            <div className="font-medium text-text-primary">{company.name}</div>
                                            <div className="text-sm text-text-secondary mb-2">{company.industry || 'No Industry'}</div>
                                            <div className="text-xs text-text-tertiary">
                                                {company.website && new URL(company.website).hostname}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-tertiary text-sm">No companies found.</p>
                            )}
                        </section>

                        {/* Deals Results */}
                        <section>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" /> Deals ({deals.length})
                            </h2>
                            {deals.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {deals.map((deal: any) => (
                                        <div key={deal.id} className="card hover:shadow-md transition-shadow">
                                            <div className="font-medium text-text-primary">{deal.title}</div>
                                            <div className="text-sm text-text-secondary mb-2 font-mono">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.amount)}
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full">{deal.stage}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-tertiary text-sm">No deals found.</p>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
