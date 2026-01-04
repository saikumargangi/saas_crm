'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/v1/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Registration failed');
            }

            // Auto-login after registration
            const loginFormData = new URLSearchParams();
            loginFormData.append('username', formData.email);
            loginFormData.append('password', formData.password);

            const loginResponse = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: loginFormData,
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                localStorage.setItem('access_token', loginData.access_token);
                localStorage.setItem('refresh_token', loginData.refresh_token);

                // Redirect to onboarding
                router.push('/onboarding');
            } else {
                // Registration succeeded but login failed, redirect to login
                router.push('/login');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
            <div className="card max-w-md w-full p-8">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        Create Account
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Start managing your customer relationships
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                First Name
                            </label>
                            <input
                                id="first_name"
                                name="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                placeholder="John"
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
                            <label htmlFor="last_name" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Last Name
                            </label>
                            <input
                                id="last_name"
                                name="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                placeholder="Doe"
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

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="you@company.com"
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
                        <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            minLength={8}
                            className="w-full"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                            }}
                        />
                        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                            Must be at least 8 characters
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
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

                    <div className="flex items-start">
                        <input type="checkbox" required className="mt-1 mr-2" />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            I agree to the{' '}
                            <Link href="/terms" style={{ color: 'var(--color-link)' }}>Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" style={{ color: 'var(--color-link)' }}>Privacy Policy</Link>
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                        style={{
                            backgroundColor: 'var(--color-button-primary)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '6px',
                            fontWeight: '500',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--color-link)', fontWeight: '500' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
