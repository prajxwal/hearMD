"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PrescriptionPageData } from "@/lib/types";

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
                        patient:patients(name, age, gender, patient_number),
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

    // No auto-print — let user view first, then print manually

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Loading prescription...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Consultation not found</p>
            </div>
        );
    }

    const consultationDate = new Date(data.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <>
            <style jsx global>{`
                @media print {
                    body { margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    @page { margin: 15mm; size: A4; }
                }
                @media screen {
                    body { background: #f3f4f6; }
                }
            `}</style>

            {/* Print button (hidden when printing) */}
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-black text-white text-sm font-bold uppercase tracking-wide hover:opacity-90"
                >
                    Print / Save PDF
                </button>
                <button
                    onClick={() => window.close()}
                    className="px-6 py-3 border-2 border-black text-sm font-bold uppercase tracking-wide hover:opacity-70"
                >
                    Close
                </button>
            </div>

            {/* Prescription Document */}
            <div
                className="max-w-[210mm] mx-auto bg-white"
                style={{
                    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                    color: "#000",
                    padding: "40px",
                    minHeight: "297mm",
                }}
            >
                {/* Header — Doctor Info */}
                <div style={{ borderBottom: "3px solid #000", paddingBottom: "16px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                                Dr. {data.doctor?.full_name || "—"}
                            </h1>
                            <p style={{ fontSize: "14px", color: "#555", margin: "4px 0 0 0" }}>
                                {data.doctor?.specialization || "—"}
                            </p>
                            <p style={{ fontSize: "12px", color: "#777", margin: "2px 0 0 0" }}>
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
                                <p style={{ fontSize: "12px", color: "#555", margin: "2px 0 0 0", maxWidth: "250px" }}>
                                    {data.doctor.clinic_address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Patient Info + Date */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", fontSize: "13px" }}>
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
                    <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#888", margin: "0 0 6px 0" }}>
                            Chief Complaint
                        </p>
                        <p style={{ fontSize: "13px", margin: 0, padding: "8px 12px", border: "1px solid #ddd" }}>
                            {data.chief_complaint}
                        </p>
                    </div>
                )}

                {/* History of Present Illness */}
                {data.history_of_present_illness.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#888", margin: "0 0 6px 0" }}>
                            History of Present Illness
                        </p>
                        <ul style={{ fontSize: "13px", margin: 0, padding: "8px 12px 8px 28px", border: "1px solid #ddd", listStyle: "disc" }}>
                            {data.history_of_present_illness.map((item: string, i: number) => (
                                <li key={i} style={{ marginBottom: "4px" }}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Diagnosis */}
                {data.diagnosis && (
                    <div style={{ marginBottom: "24px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#888", margin: "0 0 6px 0" }}>
                            Diagnosis
                        </p>
                        <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, padding: "8px 12px", border: "2px solid #000" }}>
                            {data.diagnosis}
                        </p>
                    </div>
                )}

                {/* Rx Symbol */}
                <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, fontStyle: "italic" }}>℞</span>
                </div>

                {/* Prescription Table */}
                {data.prescription.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "32px", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #000" }}>
                                <th style={{ textAlign: "left", padding: "8px 8px 8px 0", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>#</th>
                                <th style={{ textAlign: "left", padding: "8px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Medication</th>
                                <th style={{ textAlign: "center", padding: "8px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Dosage (M-N-N)</th>
                                <th style={{ textAlign: "left", padding: "8px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Timing</th>
                                <th style={{ textAlign: "left", padding: "8px 0 8px 8px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px" }}>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.prescription.map((med: PrescriptionPageData["prescription"][number], i: number) => (
                                <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                                    <td style={{ padding: "10px 8px 10px 0", color: "#888" }}>{i + 1}</td>
                                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>{med.name}</td>
                                    <td style={{ padding: "10px 8px", textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>
                                        {med.morning || "0"} - {med.noon || "0"} - {med.night || "0"}
                                    </td>
                                    <td style={{ padding: "10px 8px" }}>{med.timing}</td>
                                    <td style={{ padding: "10px 0 10px 8px" }}>{med.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ fontSize: "13px", color: "#888", marginBottom: "32px" }}>No medications prescribed</p>
                )}

                {/* Instructions */}
                {data.instructions && (
                    <div style={{ marginBottom: "32px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#888", margin: "0 0 8px 0" }}>
                            Advice / Instructions
                        </p>
                        <p style={{ fontSize: "13px", margin: 0, whiteSpace: "pre-wrap", padding: "8px 12px", border: "1px solid #ddd", lineHeight: 1.6 }}>
                            {data.instructions}
                        </p>
                    </div>
                )}

                {/* Signature */}
                <div style={{ marginTop: "80px", display: "flex", justifyContent: "flex-end" }}>
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
        </>
    );
}
