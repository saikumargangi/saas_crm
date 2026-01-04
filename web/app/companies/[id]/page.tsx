"use client";

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Building, Globe, Users, ArrowLeft, Mail, Phone, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Company {
    id: string;
    name: string;
    website: string;
    industry: string;
    employee_count: number;
    annual_revenue: number;
    created_at: string;
}

interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    lead_status: string;
}

interface Deal {
    id: string;
    title: string;
    amount: number;
    stage: string;
    probability: number;
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [company, setCompany] = useState<Company | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals'>('overview');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [companyRes, contactsRes, dealsRes] = await Promise.all([
                api.get(`/crm/companies/${id}`),
                api.get(`/crm/contacts?company_id=${id}`),
                api.get(`/crm/deals?company_id=${id}`)
            ]);
            setCompany(companyRes.data);
            setContacts(contactsRes.data);
            setDeals(dealsRes.data);
        } catch (err) {
            console.error("Failed to fetch company details", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!company) return <div className="p-8">Company not found</div>;

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/companies" className="flex items-center text-text-secondary hover:text-text-primary mb-4 gap-2 text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Companies
                    </Link>
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Building className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-text-primary mb-2">{company.name}</h1>
                            <div className="flex gap-6 text-text-secondary text-sm">
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                                        <Globe className="w-4 h-4" /> {new URL(company.website).hostname}
                                    </a>
                                )}
                                <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4" /> {company.industry || 'No Industry'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" /> {company.employee_count} Employees
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border mb-6">
                    <div
                        className={`px-4 py-2 cursor-pointer font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-button-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </div>
                    <div
                        className={`px-4 py-2 cursor-pointer font-medium text-sm border-b-2 transition-colors ${activeTab === 'contacts' ? 'border-button-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setActiveTab('contacts')}
                    >
                        Contacts ({contacts.length})
                    </div>
                    <div
                        className={`px-4 py-2 cursor-pointer font-medium text-sm border-b-2 transition-colors ${activeTab === 'deals' ? 'border-button-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        onClick={() => setActiveTab('deals')}
                    >
                        Deals ({deals.length})
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="card">
                                <h3 className="font-semibold text-lg mb-4">Financials</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Annual Revenue</span>
                                        <span className="font-medium">
                                            {company.annual_revenue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(company.annual_revenue) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Open Deals Value</span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deals.reduce((acc, d) => acc + Number(d.amount), 0))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <h3 className="font-semibold text-lg mb-4">About</h3>
                                <p className="text-text-secondary">
                                    No description available.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        <th className="p-4 font-semibold text-sm text-text-secondary">Name</th>
                                        <th className="p-4 font-semibold text-sm text-text-secondary">Email</th>
                                        <th className="p-4 font-semibold text-sm text-text-secondary">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map(contact => (
                                        <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-row-hover">
                                            <td className="p-4 font-medium text-text-primary">{contact.first_name} {contact.last_name}</td>
                                            <td className="p-4 text-text-secondary">{contact.email}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{contact.lead_status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {contacts.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-text-tertiary">No contacts associated.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'deals' && (
                        <div className="card p-0 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-background border-b border-border">
                                    <tr>
                                        <th className="p-4 font-semibold text-sm text-text-secondary">Deal Name</th>
                                        <th className="p-4 font-semibold text-sm text-text-secondary">Stage</th>
                                        <th className="p-4 font-semibold text-sm text-text-secondary">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deals.map(deal => (
                                        <tr key={deal.id} className="border-b border-border last:border-0 hover:bg-row-hover">
                                            <td className="p-4 font-medium text-text-primary">{deal.title}</td>
                                            <td className="p-4 text-text-secondary capitalize">{deal.stage}</td>
                                            <td className="p-4 font-medium">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    {deals.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-text-tertiary">No deals associated.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
