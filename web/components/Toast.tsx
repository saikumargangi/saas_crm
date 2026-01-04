'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const colors = {
        success: 'bg-green-50 border-green-500 text-green-900',
        error: 'bg-red-50 border-red-500 text-red-900',
        warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
        info: 'bg-blue-50 border-blue-500 text-blue-900',
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg border-l-4 shadow-lg ${colors[type]} animate-slide-up`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icons[type]}</span>
                <p className="font-medium">{message}</p>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        onClose?.();
                    }}
                    className="ml-4 text-xl hover:opacity-70"
                    aria-label="Close notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<Array<ToastProps & { id: number }>>([]);

    const showToast = (props: ToastProps) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { ...props, id }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return {
        showToast,
        toasts,
        removeToast,
    };
}
