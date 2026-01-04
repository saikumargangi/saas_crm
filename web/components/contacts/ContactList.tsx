"use client";

import { MoreHorizontal, Mail, Phone } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    status: 'Lead' | 'Qualified' | 'Customer';
    lastActive: string;
}

const MOCK_CONTACTS: Contact[] = [
    { id: '1', name: 'John Doe', email: 'john@acme.com', phone: '+1 555-0101', company: 'Acme Corp', role: 'CEO', status: 'Customer', lastActive: '2 days ago' },
    { id: '2', name: 'Sarah Smith', email: 'sarah@techstart.io', phone: '+1 555-0102', company: 'TechStart', role: 'CTO', status: 'Qualified', lastActive: '5 hours ago' },
    { id: '3', name: 'Mike Brown', email: 'mike@consulting.com', phone: '+1 555-0103', company: 'Brown & Co', role: 'Director', status: 'Lead', lastActive: '1 week ago' },
];

export default function ContactList() {
    return (
        <div className="card overflow-hidden p-0">
            <table className="w-full text-left border-collapse">
                <thead className="bg-background border-b border-border">
                    <tr>
                        <th className="p-4 font-semibold text-sm text-text-secondary">Name</th>
                        <th className="p-4 font-semibold text-sm text-text-secondary">Company</th>
                        <th className="p-4 font-semibold text-sm text-text-secondary">Status</th>
                        <th className="p-4 font-semibold text-sm text-text-secondary">Last Active</th>
                        <th className="p-4 font-semibold text-sm text-text-secondary">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {MOCK_CONTACTS.map(contact => (
                        <tr key={contact.id} className="border-b border-border hover:bg-row-hover transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-avatar-green flex items-center justify-center text-sm font-bold text-text-primary">
                                        {contact.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium text-text-primary">{contact.name}</div>
                                        <div className="text-xs text-text-tertiary">{contact.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="text-sm text-text-primary">{contact.company}</div>
                                <div className="text-xs text-text-tertiary">{contact.role}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${contact.status === 'Customer' ? 'bg-green-100 text-green-700' :
                                        contact.status === 'Qualified' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {contact.status}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-text-tertiary">
                                {contact.lastActive}
                            </td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-gray-100 rounded-full text-text-secondary" title="Email">
                                        <Mail className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-full text-text-secondary" title="Call">
                                        <Phone className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
