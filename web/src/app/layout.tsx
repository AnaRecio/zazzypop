import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZazzyPop — ¿Qué hacemos hoy?",
  description:
    "¿Qué hacemos hoy? Encontrá qué hacer en Costa Rica. Música, ferias, mercaditos, stand-up, talleres y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`} style={{ colorScheme: "light" }}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 bg-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-400">
            <p className="font-semibold text-gray-700 mb-1">
              zazzy<span className="text-orange-500">pop</span>
            </p>
            <p>¿Qué hacemos hoy? · Costa Rica</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
