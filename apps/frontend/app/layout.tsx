import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Booking Sanitizer",
  description: "Analyze and find anomalies in booking data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <nav className="flex items-center gap-6 border-b border-gray-200 bg-white px-6 py-3">
          <span className="font-semibold">Booking Sanitizer</span>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Insights
          </Link>
          <Link href="/data-sources" className="text-sm text-gray-600 hover:text-gray-900">
            Data sources
          </Link>
          <Link href="/anomalies" className="text-sm text-gray-600 hover:text-gray-900">
            Anomalies
          </Link>
          <Link href="/duplicates" className="text-sm text-gray-600 hover:text-gray-900">
            Duplicates
          </Link>
        </nav>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
