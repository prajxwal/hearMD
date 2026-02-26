"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    required?: boolean;
}

export function Input({ label, required, className = "", id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
        <div className="space-y-2">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wide">
                    {label}{required && " *"}
                </label>
            )}
            <input
                id={inputId}
                className={`w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none ${className}`}
                {...props}
            />
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export function Textarea({ label, className = "", ...props }: TextareaProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-xs font-bold uppercase tracking-wide">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full px-4 py-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none resize-none ${className}`}
                {...props}
            />
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    required?: boolean;
}

export function Select({ label, required, children, className = "", ...props }: SelectProps) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-xs font-bold uppercase tracking-wide">
                    {label}{required && " *"}
                </label>
            )}
            <select
                className={`w-full h-12 px-4 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none ${className}`}
                {...props}
            >
                {children}
            </select>
        </div>
    );
}
