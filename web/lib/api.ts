/**
 * API Client Utility
 * Handles authentication, token refresh, and API requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class APIClient {
    private getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }

    private getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refresh_token');
    }

    private setTokens(accessToken: string, refreshToken: string) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    private clearTokens() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    private async refreshAccessToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.access_token, data.refresh_token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        return false;
    }

    async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<{ data: T; status: number }> {
        const accessToken = this.getAccessToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // If unauthorized, try to refresh token
        if (response.status === 401) {
            const refreshed = await this.refreshAccessToken();

            if (refreshed) {
                // Retry request with new token
                const newAccessToken = this.getAccessToken();
                if (newAccessToken) {
                    headers['Authorization'] = `Bearer ${newAccessToken}`;
                }

                response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...options,
                    headers,
                });
            } else {
                // Refresh failed, clear tokens and redirect to login
                this.clearTokens();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                throw new Error('Authentication failed');
            }
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        return { data, status: response.status };
    }

    async get<T = any>(endpoint: string): Promise<{ data: T; status: number }> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T = any>(endpoint: string, body?: any): Promise<{ data: T; status: number }> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put<T = any>(endpoint: string, body?: any): Promise<{ data: T; status: number }> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete<T = any>(endpoint: string): Promise<{ data: T; status: number }> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    logout() {
        this.clearTokens();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
}

export const api = new APIClient();
export default api;
