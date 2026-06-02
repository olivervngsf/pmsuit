import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { getCompany } from "@/lib/queries";

export const metadata: Metadata = {
  title: "PM Suite — Northwind",
  description:
    "Align projects to company outcomes, track delivery, and get AI-powered weekly check-ins.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const company = await getCompany();
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar
            companyName={company?.name ?? "PM Suite"}
            period={company?.period ?? ""}
          />
          <main className="flex-1 min-w-0">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
