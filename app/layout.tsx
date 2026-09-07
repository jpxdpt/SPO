import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPO Gestão",
  description: "Serviços de Psicologia e Orientação — ferramenta interna da escola.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
