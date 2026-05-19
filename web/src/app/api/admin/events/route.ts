import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "zazzy2024";

export async function GET(req: Request) {
  if (req.headers.get("x-admin-password") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const approved = url.searchParams.get("approved") === "true";

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_approved", approved)
    .order(approved ? "datetime_start" : "created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
