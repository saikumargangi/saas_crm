'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Building, Users, Globe } from 'lucide-react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';

interface Company {
    id: string;
    name: string;
    industry?: string;
    size?: string;
    website?: string;
    created_at: string;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', industry: '', size: '', website: '' });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/crm/companies');
            setCompanies(data || []);
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/crm/companies', formData);
            setIsModalOpen(false);
            setFormData({ name: '', industry: '', size: '', website: '' });
            fetchCompanies();
        } catch (error) {
            console.error('Failed to create company:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-text-primary">Companies</h1>
                    <div className="flex gap-3">
                        <button className="btn-secondary" onClick={fetchCompanies}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Company
                        </button>
                    </div>
                </div>

                <div className="card overflow-hidden p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Company</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Industry</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Size</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Website</th>
                                <th className="p-4 font-semibold text-sm text-text-secondary">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-text-tertiary">
                                        No companies found. Create your first company!
                                    </td>
                                </tr>
                            )}
                            {companies.map((company) => (
                                <tr key={company.id} className="border-b border-border hover:bg-row-hover transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Building className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <span className="font-medium">{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-text-secondary capitalize">{company.industry || '-'}</td>
                                    <td className="p-4 text-sm text-text-secondary">{company.size || '-'}</td>
                                    <td className="p-4 text-sm">
                                        {company.website ? (
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                <Globe className="w-3 h-3" />
                                                Visit
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-sm text-text-tertiary">
                                        {new Date(company.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Simple Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)} />
                        <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
                            <h2 className="text-xl font-semibold mb-4">Add Company</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Company Name *"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full p-3 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Industry"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full p-3 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Size (e.g., 1-10)"
                                    value={formData.size}
                                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                    className="w-full p-3 border rounded"
                                />
                                <input
                                    type="url"
                                    placeholder="Website"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full p-3 border rounded"
                                />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
