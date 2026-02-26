"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface MedicationResult {
    name: string;
    rxcui: string;
}

interface MedicationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

/**
 * Autocomplete input for medication names.
 * Searches via /api/medications which proxies RxNorm + Indian aliases.
 * Supports keyboard navigation, free-text entry, and click-outside dismiss.
 */
export function MedicationAutocomplete({
    value,
    onChange,
    placeholder = "Search medication or type custom...",
}: MedicationAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<MedicationResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    // Sync external value changes
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/medications?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data: MedicationResult[] = await res.json();
                setResults(data);
                setIsOpen(data.length > 0);
                setActiveIndex(-1);
            }
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val); // Always update parent (free-text)

        // Debounced API search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(val), 300);
    };

    const selectResult = (result: MedicationResult) => {
        setQuery(result.name);
        onChange(result.name);
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
                break;
            case "ArrowUp":
                e.preventDefault();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
                break;
            case "Enter":
                e.preventDefault();
                if (activeIndex >= 0 && activeIndex < results.length) {
                    selectResult(results[activeIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                setActiveIndex(-1);
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-10 px-4 pr-10 border-2 border-[var(--border)] bg-transparent text-sm font-bold focus:outline-none"
                    autoComplete="off"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--muted)]" />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 border-2 border-[var(--border)] bg-[var(--background)] max-h-60 overflow-y-auto shadow-lg">
                    {results.map((result, i) => (
                        <button
                            key={`${result.rxcui}-${i}`}
                            onClick={() => selectResult(result)}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${i === activeIndex
                                ? "bg-[var(--foreground)] text-[var(--background)]"
                                : "hover:bg-[var(--foreground)]/5"
                                }`}
                        >
                            <span className="font-bold">{result.name}</span>
                            <span className="text-xs ml-2 opacity-50">RxCUI: {result.rxcui}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
