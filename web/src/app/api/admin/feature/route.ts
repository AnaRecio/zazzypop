import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "zazzy2024";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-password") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, featured } = await req.json();
  if (!id || typeof featured !== "boolean") {
    return NextResponse.json({ error: "Missing id or featured" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("events")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
