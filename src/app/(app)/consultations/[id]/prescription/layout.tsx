/**
 * Standalone layout for the prescription page.
 * Strips the app shell (sidebar, header, footer) so the prescription
 * renders as a clean, full-page, print-ready document.
 */
export default function PrescriptionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="fixed inset-0 z-[100] overflow-auto prescription-layout-wrapper"
            style={{ background: "#f3f4f6" }}
        >
            {children}
        </div>
    );
}
