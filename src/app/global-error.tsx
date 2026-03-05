"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily: "monospace",
                    background: "#0a0a0a",
                    color: "#fafafa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    padding: "2rem",
                }}
            >
                <div style={{ maxWidth: "480px", textAlign: "center" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                        Something went wrong
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1.5rem" }}>
                        An unexpected error occurred. Your data is safe.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "0.75rem 2rem",
                            border: "2px solid #fafafa",
                            background: "#fafafa",
                            color: "#0a0a0a",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            cursor: "pointer",
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </body>
        </html>
    );
}
