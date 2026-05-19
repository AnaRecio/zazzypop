import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-password") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, title, datetime_start, venue_name, city, price_min, is_free } = await req.json();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("events")
    .update({ title, datetime_start, venue_name, city, price_min, is_free })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
