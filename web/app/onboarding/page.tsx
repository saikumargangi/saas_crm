'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Users, Target, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [companyData, setCompanyData] = useState({
        name: '',
        industry: '',
        size: '',
        website: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCompanyData({
            ...companyData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/crm/companies', companyData);
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to create company:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="card max-w-2xl w-full p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-1/3 h-2 rounded-full mx-1 ${s <= step ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                        Step {step} of 3
                    </p>
                </div>

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            Welcome to Your CRM
                        </h1>
                        <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                            Let's set up your workspace in just a few steps
                        </p>
                        <button
                            onClick={() => setStep(2)}
                            className="btn-primary px-8 py-3"
                            style={{
                                backgroundColor: 'var(--color-button-primary)',
                                color: 'white',
                                borderRadius: '6px',
                            }}
                        >
                            Get Started <ArrowRight className="inline w-5 h-5 ml-2" />
                        </button>
                    </div>
                )}

                {/* Step 2: Company Info */}
                {step === 2 && (
                    <div>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Tell us about your company
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                This helps us personalize your experience
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={companyData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Acme Corporation"
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                    Industry
                                </label>
                                <select
                                    name="industry"
                                    value={companyData.industry}
                                    onChange={handleChange}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                    }}
                                >
                                    <option value="">Select industry</option>
                                    <option value="technology">Technology</option>
                                    <option value="finance">Finance</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="retail">Retail</option>
                                    <option value="manufacturing">Manufacturing</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                    Company Size
                                </label>
                                <select
                                    name="size"
                                    value={companyData.size}
                                    onChange={handleChange}
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                    }}
                                >
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="500+">500+ employees</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                    Website
                                </label>
                                <input
                                    type="url"
                                    name="website"
                                    value={companyData.website}
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                    className="w-full"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        padding: '10px 12px',
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="btn-secondary px-6 py-2"
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!companyData.name}
                                className="btn-primary px-6 py-2"
                                style={{
                                    backgroundColor: 'var(--color-button-primary)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    opacity: !companyData.name ? 0.6 : 1,
                                }}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                            You're all set!
                        </h2>
                        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                            Ready to start managing your customer relationships
                        </p>

                        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                                What's next?
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        Connect your Gmail account to sync emails
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        Import your existing contacts
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500">✓</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                        Create your first deal
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep(2)}
                                className="btn-secondary px-6 py-2"
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-primary px-8 py-3"
                                style={{
                                    backgroundColor: 'var(--color-button-primary)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? 'Setting up...' : 'Go to Dashboard'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
