"use client";

/**
 * AgentOutputPanel — Displays the post-consultation agent results.
 *
 * Shows: drug interactions, completeness flags, formatted prescription,
 * lab order sheet, referral letter, and escalation controls.
 */

import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    FileText,
    FlaskConical,
    Send,
    Loader2,
    RotateCcw,
    Printer,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import type { AgentOutput } from "@/lib/agent/types";

interface AgentOutputPanelProps {
    agentOutput: AgentOutput | null;
    consultationId: string;
    threadId: string | null;
    onRerun: () => void;
    onAgentUpdate: (output: AgentOutput) => void;
    isRunning?: boolean;
}

export function AgentOutputPanel({
    agentOutput,
    consultationId,
    threadId,
    onRerun,
    onAgentUpdate,
    isRunning = false,
}: AgentOutputPanelProps) {
    const [resuming, setResuming] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        interactions: true,
        completeness: true,
        prescription: false,
        labOrders: false,
        referral: false,
    });

    const toggleSection = (key: string) => {
        setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // ── Loading state ──────────────────────────────────────
    if (isRunning || agentOutput?.status === "running") {
        return (
            <div className="border-2 border-[var(--border)] p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <h2 className="text-lg font-bold">Post-Consultation Agent</h2>
                </div>
                <div className="flex flex-col items-center py-12 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
                    <p className="text-sm font-bold uppercase tracking-wide">
                        Agent is analyzing the consultation…
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                        Checking drug interactions, note completeness, and referral needs
                    </p>
                </div>
            </div>
        );
    }

    if (!agentOutput) return null;

    // ── Escalation Handler ─────────────────────────────────
    const handleEscalationAcknowledge = async (action: "acknowledged" | "override") => {
        if (!threadId) {
            toast.error("Cannot resume — no thread ID found");
            return;
        }

        setResuming(true);
        try {
            const res = await fetch("/api/agent/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    consultationId,
                    threadId,
                    action,
                }),
            });

            if (res.ok) {
                const result = await res.json();
                onAgentUpdate(result);
                toast.success("Escalation acknowledged — artifacts generated");
            } else {
                toast.error("Failed to resume agent");
            }
        } catch {
            toast.error("Failed to resume agent");
        } finally {
            setResuming(false);
        }
    };

    // ── Severity helpers ───────────────────────────────────
    const severityColor = (severity: string) => {
        switch (severity) {
            case "major":
                return "text-red-500 border-red-500 bg-red-500/10";
            case "moderate":
                return "text-amber-500 border-amber-500 bg-amber-500/10";
            case "minor":
                return "text-green-500 border-green-500 bg-green-500/10";
            default:
                return "text-[var(--muted)] border-[var(--border)]";
        }
    };

    const severityIcon = (severity: string) => {
        switch (severity) {
            case "major":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "moderate":
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case "minor":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return null;
        }
    };

    const hasInteractions = agentOutput.drugInteractions.length > 0;
    const hasCompletenessIssues =
        agentOutput.completenessResult &&
        agentOutput.completenessResult.missingFields.length > 0;
    const hasReferral = agentOutput.referralResult?.detected;
    const hasPrescription = agentOutput.formattedPrescription.length > 0;
    const hasLabOrders = agentOutput.labOrderSheet.length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border-2 border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5" />
                        <div>
                            <h2 className="text-lg font-bold">Post-Consultation Agent</h2>
                            <p className="text-xs text-[var(--muted)]">
                                {agentOutput.status === "completed" && "✅ All checks complete"}
                                {agentOutput.status === "escalated" && "⚠️ Escalation — review required"}
                                {agentOutput.status === "error" && `❌ Error: ${agentOutput.error}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={onRerun}
                        icon={<RotateCcw className="h-4 w-4" />}
                    >
                        Re-run
                    </Button>
                </div>
            </div>

            {/* Escalation Banner */}
            {agentOutput.status === "escalated" && !agentOutput.escalationAcknowledged && (
                <div className="border-2 border-red-500 bg-red-500/10 p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-red-500">
                                Major Drug Interaction Detected
                            </h3>
                            <p className="text-sm">
                                Artifact delivery is blocked. Review the interaction below and acknowledge to continue.
                            </p>
                        </div>
                    </div>

                    {/* Show major interactions */}
                    <div className="space-y-2">
                        {agentOutput.drugInteractions
                            .filter((i) => i.severity === "major")
                            .map((interaction, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 border-2 border-red-500/50 bg-red-500/5 space-y-1"
                                >
                                    <p className="text-sm font-bold">
                                        {interaction.drug1} ↔ {interaction.drug2}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {interaction.description}
                                    </p>
                                </div>
                            ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleEscalationAcknowledge("acknowledged")}
                            disabled={resuming}
                            className="flex-1 h-12 flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 text-sm font-bold uppercase tracking-wide hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {resuming ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4" />
                            )}
                            Acknowledge & Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Drug Interactions */}
            {hasInteractions && (
                <CollapsibleSection
                    title="Drug Interactions"
                    icon={<AlertTriangle className="h-4 w-4" />}
                    badge={`${agentOutput.drugInteractions.length} found`}
                    expanded={expandedSections.interactions}
                    onToggle={() => toggleSection("interactions")}
                >
                    <div className="space-y-2">
                        {agentOutput.drugInteractions.map((interaction, idx) => (
                            <div
                                key={idx}
                                className={`p-3 border-2 space-y-1 ${severityColor(interaction.severity)}`}
                            >
                                <div className="flex items-center gap-2">
                                    {severityIcon(interaction.severity)}
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        {interaction.severity}
                                    </span>
                                </div>
                                <p className="text-sm font-bold">
                                    {interaction.drug1} ↔ {interaction.drug2}
                                </p>
                                <p className="text-xs">{interaction.description}</p>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Note Completeness */}
            {agentOutput.completenessResult && (
                <CollapsibleSection
                    title="Note Completeness"
                    icon={
                        agentOutput.completenessResult.overallComplete ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )
                    }
                    badge={
                        agentOutput.completenessResult.overallComplete
                            ? "✅ Complete"
                            : `⚠️ ${agentOutput.completenessResult.missingFields.length} issue(s)`
                    }
                    expanded={expandedSections.completeness}
                    onToggle={() => toggleSection("completeness")}
                >
                    {hasCompletenessIssues ? (
                        <div className="space-y-2">
                            {agentOutput.completenessResult.missingFields.map((field, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 border-2 space-y-1 ${
                                        field.severity === "required"
                                            ? "border-amber-500 bg-amber-500/10"
                                            : "border-[var(--border)]"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-xs font-bold uppercase tracking-wide ${
                                                field.severity === "required"
                                                    ? "text-amber-500"
                                                    : "text-[var(--muted)]"
                                            }`}
                                        >
                                            {field.severity}
                                        </span>
                                        <span className="text-sm font-bold">{field.field}</span>
                                    </div>
                                    <p className="text-xs text-[var(--muted)]">{field.suggestion}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-green-500 py-2">
                            All required fields are complete ✅
                        </p>
                    )}
                </CollapsibleSection>
            )}

            {/* Formatted Prescription */}
            {hasPrescription && agentOutput.status !== "escalated" && (
                <CollapsibleSection
                    title="Pharmacy Prescription"
                    icon={<FileText className="h-4 w-4" />}
                    badge={`${agentOutput.formattedPrescription.length} medication(s)`}
                    expanded={expandedSections.prescription}
                    onToggle={() => toggleSection("prescription")}
                    printable
                    printId="pharmacy-prescription"
                >
                    <div id="pharmacy-prescription" className="space-y-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-[var(--foreground)]">
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        #
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Drug
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Dosage
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Frequency
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Duration
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Route
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentOutput.formattedPrescription.map((med, idx) => (
                                    <tr key={idx} className="border-b border-[var(--border)]">
                                        <td className="py-2 text-[var(--muted)]">{idx + 1}</td>
                                        <td className="py-2 font-bold">{med.drugName}</td>
                                        <td className="py-2">{med.dosage}</td>
                                        <td className="py-2 font-mono">{med.frequency}</td>
                                        <td className="py-2">{med.duration}</td>
                                        <td className="py-2">{med.route}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            )}

            {/* Lab Order Sheet */}
            {hasLabOrders && agentOutput.status !== "escalated" && (
                <CollapsibleSection
                    title="Lab Order Sheet"
                    icon={<FlaskConical className="h-4 w-4" />}
                    badge={`${agentOutput.labOrderSheet.length} test(s)`}
                    expanded={expandedSections.labOrders}
                    onToggle={() => toggleSection("labOrders")}
                    printable
                    printId="lab-order-sheet"
                >
                    <div id="lab-order-sheet" className="space-y-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-[var(--foreground)]">
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        #
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Test
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Priority
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Fasting
                                    </th>
                                    <th className="text-left py-2 text-xs font-bold uppercase tracking-wide">
                                        Instructions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentOutput.labOrderSheet.map((item, idx) => (
                                    <tr key={idx} className="border-b border-[var(--border)]">
                                        <td className="py-2 text-[var(--muted)]">{idx + 1}</td>
                                        <td className="py-2 font-bold">{item.testName}</td>
                                        <td className="py-2">
                                            <span
                                                className={`text-xs font-bold uppercase px-2 py-0.5 border ${
                                                    item.priority === "urgent"
                                                        ? "border-red-500 text-red-500"
                                                        : "border-[var(--border)] text-[var(--muted)]"
                                                }`}
                                            >
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td className="py-2">
                                            {item.fastingRequired ? (
                                                <span className="text-amber-500 text-xs font-bold">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-[var(--muted)] text-xs">No</span>
                                            )}
                                        </td>
                                        <td className="py-2 text-xs text-[var(--muted)]">
                                            {item.specialInstructions || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleSection>
            )}

            {/* Referral Letter */}
            {hasReferral && agentOutput.referralResult && agentOutput.status !== "escalated" && (
                <CollapsibleSection
                    title="Referral Letter"
                    icon={<Send className="h-4 w-4" />}
                    badge={`→ ${agentOutput.referralResult.specialist || "Specialist"}`}
                    expanded={expandedSections.referral}
                    onToggle={() => toggleSection("referral")}
                    printable
                    printId="referral-letter"
                >
                    <div id="referral-letter" className="space-y-3">
                        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                            <span>
                                <strong>Specialist:</strong>{" "}
                                {agentOutput.referralResult.specialist || "—"}
                            </span>
                            <span
                                className={`font-bold uppercase px-2 py-0.5 border ${
                                    agentOutput.referralResult.urgency === "urgent" ||
                                    agentOutput.referralResult.urgency === "emergency"
                                        ? "border-red-500 text-red-500"
                                        : "border-[var(--border)]"
                                }`}
                            >
                                {agentOutput.referralResult.urgency || "routine"}
                            </span>
                        </div>
                        <div className="p-4 border-2 border-[var(--border)] font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                            {agentOutput.referralResult.referralLetter || "No letter generated"}
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            {/* No issues found */}
            {!hasInteractions &&
                !hasCompletenessIssues &&
                !hasReferral &&
                agentOutput.status === "completed" && (
                    <div className="border-2 border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="text-sm">
                            No issues detected. All safety checks passed.
                        </p>
                    </div>
                )}
        </div>
    );
}

// ── Collapsible Section Component ───────────────────────────

function CollapsibleSection({
    title,
    icon,
    badge,
    expanded,
    onToggle,
    printable,
    printId,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    badge?: string;
    expanded: boolean;
    onToggle: () => void;
    printable?: boolean;
    printId?: string;
    children: React.ReactNode;
}) {
    const handlePrint = () => {
        if (!printId) return;
        const el = document.getElementById(printId);
        if (!el) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; color: #000; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #000; }
                    pre { white-space: pre-wrap; font-family: monospace; }
                </style>
            </head>
            <body>
                <h1 style="font-size: 18px; margin-bottom: 16px;">${title}</h1>
                ${el.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="border-2 border-[var(--border)]">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-[var(--foreground)]/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm font-bold uppercase tracking-wide">{title}</span>
                    {badge && (
                        <span className="text-xs text-[var(--muted)]">{badge}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {printable && expanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrint();
                            }}
                            className="p-1.5 hover:bg-[var(--foreground)]/10 transition-colors"
                            title="Print"
                        >
                            <Printer className="h-4 w-4 text-[var(--muted)]" />
                        </button>
                    )}
                    {expanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--muted)]" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                    )}
                </div>
            </button>
            {expanded && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}
