"use client";

import { useState } from 'react';
import { Search, Inbox, Users, Building, DollarSign, BarChart2, Settings, Workflow, TrendingUp, Plug } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const NavItem = ({ href, label, icon: Icon }: any) => {
        const isActive = pathname.startsWith(href);
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors ${isActive ? 'bg-button-primary/10 text-button-primary font-medium' : 'text-text-secondary hover:bg-row-hover hover:text-text-primary'}`}
            >
                <Icon className="w-4 h-4" />
                {label}
            </Link>
        );
    };

    return (
        <div className="w-64 bg-surface border-r border-border p-4 hidden md:flex flex-col h-full">
            <div className="mb-6 px-2">
                <Link href="/dashboard" className="text-xl font-serif font-bold text-text-primary block mb-6">
                    CRM System
                </Link>

                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-button-primary transition-shadow"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            <nav className="flex-1 space-y-1">
                <NavItem href="/dashboard" label="Dashboard" icon={BarChart2} />
                <NavItem href="/inbox" label="Inbox" icon={Inbox} />

                {/* MVP Features */}
                <div className="pt-2 pb-2">
                    <div className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                        Email Intelligence
                    </div>
                    <NavItem href="/people" label="People" icon={Users} />
                    <NavItem href="/follow-ups" label="Follow-Ups" icon={Workflow} />
                    <NavItem href="/campaigns" label="Campaigns" icon={TrendingUp} />
                </div>

                {/* Standard CRM */}
                <div className="pt-2">
                    <div className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                        CRM
                    </div>
                    <NavItem href="/contacts" label="Contacts" icon={Users} />
                    <NavItem href="/companies" label="Companies" icon={Building} />
                    <NavItem href="/deals" label="Deals" icon={DollarSign} />
                    <NavItem href="/analytics" label="Analytics" icon={BarChart2} />
                    <NavItem href="/integrations" label="Integrations" icon={Plug} />
                </div>
            </nav>

            <div className="mt-auto pt-4 border-t border-border">
                <NavItem href="/settings" label="Settings" icon={Settings} />
            </div>
        </div>
    );
}
