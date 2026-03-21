"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PrescriptionPageData } from "@/lib/types";

/* ─── Inline styles kept deliberately for print reliability ─── */

const PAGE_STYLE = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }
    .no-print, .no-print-bg {
      all: unset !important;
      display: contents !important;
      background: none !important;
      padding: 0 !important;
      min-height: 0 !important;
    }
    .no-print {
      display: none !important;
    }
    .rx-page {
      width: 100% !important;
      min-height: auto !important;
      margin: 0 !important;
      box-shadow: none !important;
      background: white !important;
      /* Keep padding — since @page margin is 0, the content padding provides the margins */
      padding: 15mm 20mm 25mm 20mm !important;
    }
  }
`;

export default function PrescriptionPage() {
    const params = useParams();
    const supabase = createClient();
    const [data, setData] = useState<PrescriptionPageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: consultation, error } = await supabase
                    .from("consultations")
                    .select(`
                        created_at,
                        chief_complaint,
                        history_of_present_illness,
                        diagnosis,
                        prescription,
                        instructions,
                        patient:patients(name, age, gender, dob, patient_number),
                        doctor:doctors(full_name, registration_number, specialization, clinic_name, clinic_address)
                    `)
                    .eq("id", params.id)
                    .single();

                if (error) throw error;

                const transformed = {
                    ...consultation,
                    patient: Array.isArray(consultation.patient) ? consultation.patient[0] : consultation.patient,
                    doctor: Array.isArray(consultation.doctor) ? consultation.doctor[0] : consultation.doctor,
                    prescription: consultation.prescription || [],
                    history_of_present_illness: consultation.history_of_present_illness || [],
                };

                setData(transformed as PrescriptionPageData);
            } catch (err) {
                console.error("Error fetching prescription data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id, supabase]);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f3f4f6" }}>
                <p style={{ color: "#888", fontFamily: "system-ui, sans-serif" }}>Loading prescription…</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f3f4f6" }}>
                <p style={{ color: "#888", fontFamily: "system-ui, sans-serif" }}>Consultation not found</p>
            </div>
        );
    }

    const consultationDate = new Date(data.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Build the auto-filename for PDF export
    const fileDate = new Date(data.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).replace(/ /g, "-");
    const patientName = (data.patient?.name || "Patient").replace(/\s+/g, "_");
    const pdfFilename = `Rx_${patientName}_${fileDate}`;
    document.title = pdfFilename;

    const handleSavePdf = async () => {
        const html2pdf = (await import("html2pdf.js")).default;
        const element = document.querySelector(".rx-page") as HTMLElement;
        if (!element) return;

        html2pdf()
            .set({
                margin: 0,
                filename: `${pdfFilename}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            })
            .from(element)
            .save();
    };

    return (
        <>
            {/* Print styles — injected via dangerouslySetInnerHTML for cross-browser reliability */}
            <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />

            {/* Screen background */}
            <div style={{ background: "#e5e7eb", minHeight: "100vh", padding: "20px 0" }} className="no-print-bg">

                {/* Action buttons — hidden when printing */}
                <div className="no-print" style={{
                    position: "fixed", top: 16, right: 16, display: "flex", gap: 8, zIndex: 50,
                }}>
                    <button
                        onClick={handleSavePdf}
                        style={{
                            padding: "12px 24px", background: "#000", color: "#fff",
                            fontSize: "13px", fontWeight: 700, textTransform: "uppercase" as const,
                            letterSpacing: "1px", border: "none", cursor: "pointer",
                        }}
                    >
                        Save PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        style={{
                            padding: "12px 24px", background: "#fff", color: "#000",
                            fontSize: "13px", fontWeight: 700, textTransform: "uppercase" as const,
                            letterSpacing: "1px", border: "2px solid #000", cursor: "pointer",
                        }}
                    >
                        Print
                    </button>
                    <button
                        onClick={() => window.close()}
                        style={{
                            padding: "12px 24px", background: "#fff", color: "#000",
                            fontSize: "13px", fontWeight: 700, textTransform: "uppercase" as const,
                            letterSpacing: "1px", border: "2px solid #000", cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════
                    A4 PAGE — locked dimensions
                    On screen: 210mm wide, min-height 297mm, centered with shadow
                    On print: fills page, @page margins control spacing
                ═══════════════════════════════════════════════ */}
                <div
                    className="rx-page"
                    style={{
                        width: "210mm",
                        minHeight: "297mm",
                        margin: "0 auto",
                        padding: "15mm 20mm 25mm 20mm",
                        background: "#fff",
                        color: "#000",
                        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                        boxShadow: "0 0 24px rgba(0,0,0,0.12)",
                        display: "flex",
                        flexDirection: "column" as const,
                    }}
                >
                    {/* ─── Content area (flex: 1 pushes signature down) ─── */}
                    <div style={{ flex: 1 }}>

                        {/* Doctor Header */}
                        <div style={{ borderBottom: "3px solid #000", paddingBottom: "12px", marginBottom: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                                        Dr. {data.doctor?.full_name || "—"}
                                    </h1>
                                    <p style={{ fontSize: "13px", color: "#555", margin: "3px 0 0 0" }}>
                                        {data.doctor?.specialization || "—"}
                                    </p>
                                    <p style={{ fontSize: "11px", color: "#777", margin: "2px 0 0 0" }}>
                                        Reg. No: {data.doctor?.registration_number || "—"}
                                    </p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    {data.doctor?.clinic_name && (
                                        <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                                            {data.doctor.clinic_name}
                                        </p>
                                    )}
                                    {data.doctor?.clinic_address && (
                                        <p style={{ fontSize: "11px", color: "#555", margin: "2px 0 0 0", maxWidth: "250px" }}>
                                            {data.doctor.clinic_address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Patient Info + Date */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "13px" }}>
                            <div>
                                <table style={{ borderCollapse: "collapse" }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: 700, paddingRight: "12px", paddingBottom: "4px" }}>Patient</td>
                                            <td style={{ paddingBottom: "4px" }}>{data.patient?.name || "—"}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 700, paddingRight: "12px", paddingBottom: "4px" }}>Age / Gender</td>
                                            <td style={{ paddingBottom: "4px" }}>
                                                {data.patient?.age || "—"} years / {data.patient?.gender || "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 700, paddingRight: "12px", paddingBottom: "4px" }}>DOB</td>
                                            <td style={{ paddingBottom: "4px" }}>
                                                {data.patient?.dob
                                                    ? new Date(data.patient.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                                                    : "—"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 700, paddingRight: "12px" }}>Patient ID</td>
                                            <td>{data.patient?.patient_number || "—"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ fontWeight: 700, margin: 0 }}>Date</p>
                                <p style={{ margin: "2px 0 0 0" }}>{consultationDate}</p>
                            </div>
                        </div>

                        {/* Chief Complaint */}
                        {data.chief_complaint && (
                            <div style={{ marginBottom: "12px", breakInside: "avoid" as const }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#888", margin: "0 0 4px 0" }}>
                                    Chief Complaint
                                </p>
                                <p style={{ fontSize: "13px", margin: 0, padding: "6px 10px", border: "1px solid #ddd" }}>
                                    {data.chief_complaint}
                                </p>
                            </div>
                        )}

                        {/* History of Present Illness */}
                        {data.history_of_present_illness.length > 0 && (
                            <div style={{ marginBottom: "12px", breakInside: "avoid" as const }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#888", margin: "0 0 4px 0" }}>
                                    History of Present Illness
                                </p>
                                <ul style={{ fontSize: "13px", margin: 0, padding: "6px 10px 6px 28px", border: "1px solid #ddd", listStyle: "disc" }}>
                                    {data.history_of_present_illness.map((item: string, i: number) => (
                                        <li key={i} style={{ marginBottom: "3px" }}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Diagnosis */}
                        {data.diagnosis && (
                            <div style={{ marginBottom: "16px", breakInside: "avoid" as const }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#888", margin: "0 0 4px 0" }}>
                                    Diagnosis
                                </p>
                                <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, padding: "8px 12px", border: "2px solid #000" }}>
                                    {data.diagnosis}
                                </p>
                            </div>
                        )}

                        {/* Rx Symbol */}
                        <div style={{ marginBottom: "10px" }}>
                            <span style={{ fontSize: "28px", fontWeight: 800, fontStyle: "italic" }}>℞</span>
                        </div>

                        {/* Prescription Table */}
                        {data.prescription.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #000" }}>
                                        <th style={{ textAlign: "left", padding: "8px 8px 8px 0", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px" }}>#</th>
                                        <th style={{ textAlign: "left", padding: "8px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Medication</th>
                                        <th style={{ textAlign: "center", padding: "8px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Dosage (M-A-N)</th>
                                        <th style={{ textAlign: "left", padding: "8px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Timing</th>
                                        <th style={{ textAlign: "left", padding: "8px 0 8px 8px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px" }}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.prescription.map((med: PrescriptionPageData["prescription"][number], i: number) => (
                                        <tr key={i} style={{ borderBottom: "1px solid #ddd", breakInside: "avoid" as const }}>
                                            <td style={{ padding: "8px 8px 8px 0", color: "#888" }}>{i + 1}</td>
                                            <td style={{ padding: "8px", fontWeight: 600 }}>{med.name}</td>
                                            <td style={{ padding: "8px", textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>
                                                {med.morning || "0"} - {med.noon || "0"} - {med.night || "0"}
                                            </td>
                                            <td style={{ padding: "8px" }}>{med.timing}</td>
                                            <td style={{ padding: "8px 0 8px 8px" }}>{med.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ fontSize: "13px", color: "#888", marginBottom: "20px" }}>No medications prescribed</p>
                        )}

                        {/* Instructions */}
                        {data.instructions && (
                            <div style={{ marginBottom: "16px", breakInside: "avoid" as const }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#888", margin: "0 0 6px 0" }}>
                                    Advice / Instructions
                                </p>
                                <p style={{ fontSize: "13px", margin: 0, whiteSpace: "pre-wrap", padding: "8px 12px", border: "1px solid #ddd", lineHeight: 1.6 }}>
                                    {data.instructions}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ─── Signature — anchored to bottom via flex marginTop:auto ─── */}
                    <div style={{
                        marginTop: "auto",
                        paddingTop: "40px",
                        display: "flex",
                        justifyContent: "flex-end",
                        breakBefore: "avoid" as const,
                    }}>
                        <div style={{ textAlign: "center", minWidth: "200px" }}>
                            <div style={{ borderTop: "2px solid #000", paddingTop: "8px" }}>
                                <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                                    Dr. {data.doctor?.full_name || "—"}
                                </p>
                                <p style={{ fontSize: "11px", color: "#555", margin: "2px 0 0 0" }}>
                                    {data.doctor?.specialization}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
