"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';

interface Person {
    email: string;
    name: string;
    email_count: number;
    last_email_date: string;
    first_email_date: string;
    contact_id: string | null;
    needs_follow_up: boolean;
}

interface PersonSummary {
    email: string;
    summary: string;
    total_emails: number;
    first_email_date: string;
    last_email_date: string;
}

export default function PeoplePage() {
    const router = useRouter();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
    const [summary, setSummary] = useState<PersonSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        fetchPeople();
    }, []);

    const fetchPeople = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/email/by-person`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPeople(data.people || []);
            }
        } catch (error) {
            console.error('Failed to fetch people:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async (email: string) => {
        setLoadingSummary(true);
        setSummary(null);
        setSelectedPerson(email);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/email/person/${encodeURIComponent(email)}/summary`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        } finally {
            setLoadingSummary(false);
        }
    };

    const viewThread = (email: string) => {
        router.push(`/people/${encodeURIComponent(email)}/thread`);
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
                <h1 className="text-3xl font-bold text-gray-900">People</h1>
                <p className="text-gray-600 mt-2">
                    All people you've emailed, grouped with AI-powered insights
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* People List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Contacts ({people.length})</h2>
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                        {people.map((person) => (
                            <div
                                key={person.email}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${selectedPerson === person.email ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => fetchSummary(person.email)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <h3 className="font-semibold text-gray-900">{person.name}</h3>
                                            {person.needs_follow_up && (
                                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                                    Follow-up
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{person.email}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {person.email_count} emails
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(person.last_email_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Summary Panel */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">AI Summary</h2>
                    </div>
                    <div className="p-6">
                        {!selectedPerson && (
                            <div className="text-center text-gray-500 py-12">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Select a person to view AI-generated summary</p>
                            </div>
                        )}

                        {loadingSummary && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        )}

                        {summary && !loadingSummary && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                                        {summary.email}
                                    </h3>
                                    <div className="flex gap-4 text-sm text-gray-600 mb-4">
                                        <span>{summary.total_emails} emails</span>
                                        <span>•</span>
                                        <span>
                                            {new Date(summary.first_email_date).toLocaleDateString()} -{' '}
                                            {new Date(summary.last_email_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-sm text-blue-900 mb-2">
                                        AI-Generated Summary
                                    </h4>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">
                                        {summary.summary}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => viewThread(summary.email)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        View Full Thread
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Navigate to follow-ups with this contact
                                            router.push(`/follow-ups?email=${encodeURIComponent(summary.email)}`);
                                        }}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Mark for Follow-Up
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
