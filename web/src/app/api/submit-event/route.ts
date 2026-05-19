import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? "analilliam.recio@gmail.com";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    title, description, datetime_start, datetime_end,
    venue_name, address, city, category, price_min,
    is_free, image_url, source_url, contact_email,
  } = body;

  if (!title || !datetime_start || !venue_name || !city || !category?.length) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.from("events").insert({
    title: title.slice(0, 200),
    description: (description ?? "").slice(0, 2000),
    datetime_start,
    datetime_end: datetime_end || null,
    venue_name: venue_name.slice(0, 200),
    address: (address ?? "").slice(0, 300),
    city,
    category,
    tags: [],
    price_min: price_min ?? 0,
    is_free: is_free ?? false,
    image_url: image_url || null,
    source_url: source_url || null,
    source_platform: "organizer",
    is_approved: false,
    is_featured: false,
  }).select("id").single();

  if (error) {
    console.error("[submit-event] Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email notification if Resend API key is configured
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "ZazzyPop <onboarding@resend.dev>",
        to: NOTIFY_EMAIL,
        subject: `[ZazzyPop] Nuevo evento: ${title}`,
        html: `
          <h2>Nuevo evento pendiente de revisión</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:6px;font-weight:bold">Título</td><td style="padding:6px">${title}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Fecha</td><td style="padding:6px">${datetime_start}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Lugar</td><td style="padding:6px">${venue_name}, ${city}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Precio</td><td style="padding:6px">${is_free ? "Gratis" : `₡${price_min}`}</td></tr>
            <tr><td style="padding:6px;font-weight:bold">Categorías</td><td style="padding:6px">${category.join(", ")}</td></tr>
            ${contact_email ? `<tr><td style="padding:6px;font-weight:bold">Contacto</td><td style="padding:6px">${contact_email}</td></tr>` : ""}
            ${description ? `<tr><td style="padding:6px;font-weight:bold;vertical-align:top">Descripción</td><td style="padding:6px">${description.slice(0, 300)}</td></tr>` : ""}
          </table>
          <br>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin"
             style="background:#f97316;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
            Revisar en el admin
          </a>
        `,
      });
    } catch (emailErr) {
      // Email failure doesn't block the response
      console.error("[submit-event] Email error:", emailErr);
    }
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
