"use client";

import React from "react";

interface EditableListProps {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
}

/**
 * Reusable editable list component for clinical notes fields
 * (HPI, Past Medical History, Examination).
 *
 * Each item is an input with a remove button, plus an "Add item" button.
 */
export function EditableList({ label, items, onChange }: EditableListProps) {
    const updateItem = (index: number, value: string) => {
        const updated = [...items];
        updated[index] = value;
        onChange(updated);
    };

    const removeItem = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const addItem = () => {
        onChange([...items, ""]);
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                {label}
            </h3>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(i, e.target.value)}
                            className="flex-1 h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                        <button
                            onClick={() => removeItem(i)}
                            className="px-3 border-2 border-[var(--border)] hover:opacity-70"
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button
                    onClick={addItem}
                    className="text-xs font-bold uppercase tracking-wide hover:underline"
                >
                    + Add item
                </button>
            </div>
        </div>
    );
}
