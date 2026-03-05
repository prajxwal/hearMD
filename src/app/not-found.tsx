import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-6">
                <p className="text-6xl font-bold tracking-tighter">404</p>
                <div className="space-y-2">
                    <h1 className="text-xl font-bold">Page not found</h1>
                    <p className="text-sm text-[var(--muted)]">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Link
                    href="/dashboard"
                    className="inline-block h-10 px-6 leading-10 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
