import type { Metadata } from "next";
import "./crm.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Internal CRM | Arcane Forge",
  description: "Private Arcane Forge workspace.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <div className="crm-root">{children}</div>;
}
