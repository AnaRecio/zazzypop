"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Map, Calendar, PlusCircle } from "lucide-react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/eventos", label: "Explorar" },
  { href: "/mapa", label: "Mapa", icon: Map },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 font-bold text-lg">
          <MapPin className="text-orange-500 w-5 h-5" />
          <span className="text-gray-900">zazzy</span>
          <span className="text-orange-500">pop</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                path === href
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/publicar"
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Publicar evento</span>
          <span className="sm:hidden">Publicar</span>
        </Link>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden flex border-t border-gray-100">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 py-2 text-center text-xs font-medium transition-colors ${
              path === href ? "text-orange-500" : "text-gray-500"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
