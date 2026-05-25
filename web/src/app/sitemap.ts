import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE = "https://zazzypop-cr.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: events } = await supabase
    .from("events")
    .select("id, created_at")
    .eq("is_approved", true)
    .gte("datetime_start", thirtyDaysAgo.toISOString())
    .order("datetime_start", { ascending: true })
    .limit(500);

  const eventUrls: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
    url: `${SITE}/evento/${e.id}`,
    lastModified: new Date(e.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: SITE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/eventos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/mapa`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/publicar`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/nosotros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ...eventUrls,
  ];
}
