"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
    >
      <ArrowLeft className="w-4 h-4" /> Volver a eventos
    </button>
  );
}
