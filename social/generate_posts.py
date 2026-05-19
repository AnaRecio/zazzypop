"""
Weekly social media post generator for ZazzyPop.
Fetches upcoming events from Supabase, generates 5 Instagram images + captions,
and sends them via email using Resend.

Required env vars:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SOCIAL_EMAIL
"""
import os, base64, json, tempfile
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from PIL import Image, ImageDraw, ImageFont

# ── Config ─────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
RESEND_KEY   = os.environ["RESEND_API_KEY"]
DEST_EMAIL   = os.environ["SOCIAL_EMAIL"]

ORANGE = "#F97316"
DARK   = "#7C2D12"
WHITE  = "#FFFFFF"
CREAM  = "#FFF7ED"

FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"

# ── Supabase fetch ─────────────────────────────────────────
def fetch_events():
    now = datetime.now(timezone.utc)
    week_end = now + timedelta(days=8)
    params = [
        ("is_approved", "eq.true"),
        ("datetime_start", f"gte.{now.isoformat()}"),
        ("datetime_start", f"lte.{week_end.isoformat()}"),
        ("order", "is_featured.desc,datetime_start.asc"),
        ("limit", "60"),
        ("select", "title,datetime_start,city,category,is_free,price_min,venue_name,source_url"),
    ]
    url = f"{SUPABASE_URL}/rest/v1/events?{urlencode(params)}"
    req = Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urlopen(req) as r:
        return json.loads(r.read())

def pick_events(all_events):
    free   = [e for e in all_events if e["is_free"]]
    paid   = [e for e in all_events if not e["is_free"] and e["price_min"] > 1000]
    others = [e for e in all_events if not e["is_free"] and e["price_min"] <= 1000]
    pool   = paid[:10] + others[:5] + free[:5]
    seen, unique = set(), []
    for e in pool:
        if e["title"] not in seen:
            seen.add(e["title"])
            unique.append(e)
    return unique[:6], free[:4]

def fmt_date(iso):
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(timezone(timedelta(hours=-6)))
    days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    return f"{days[dt.weekday()]} {dt.day}"

def fmt_price(e):
    if e["is_free"]: return "GRATIS"
    if e["price_min"] > 0: return f"₡{e['price_min']:,}"
    return "Ver info"

# ── Image generation ───────────────────────────────────────
def make_base(size=1080):
    img = Image.new("RGB", (size, size), ORANGE)
    d = ImageDraw.Draw(img)
    d.rectangle([(0, 900), (size, size)], fill=DARK)
    d.ellipse([-100, -100, 300, 300], fill="#FB923C")
    d.ellipse([780, 730, 1180, 1130], fill="#EA580C")
    return img, d

def draw_logo(d):
    fl = ImageFont.truetype(FONT_PATH, 42, index=1)
    ft = ImageFont.truetype(FONT_PATH, 26, index=0)
    d.text((54, 44), "zazzy", font=fl, fill=WHITE)
    w = d.textlength("zazzy", font=fl)
    d.text((54 + w, 44), "pop", font=fl, fill=CREAM)
    d.text((54, 92), "zazzypop-cr.app", font=ft, fill="#FFEDD5")

def gen_post1(events, week_label):
    img, d = make_base()
    draw_logo(d)
    fb = ImageFont.truetype(FONT_PATH, 50, index=1)
    fs = ImageFont.truetype(FONT_PATH, 28, index=0)
    ft = ImageFont.truetype(FONT_PATH, 24, index=0)
    d.text((54, 180), f"Esta semana en San José", font=fb, fill=WHITE)
    d.text((54, 244), "hay para todos los gustos 👇", font=fb, fill=CREAM)
    y = 340
    for e in events[:6]:
        d.rounded_rectangle([(54, y), (1026, y+62)], radius=10, fill="#00000033")
        dia = fmt_date(e["datetime_start"])
        d.text((74, y+14), dia, font=ft, fill=CREAM)
        d.text((160, y+14), e["title"][:42], font=ft, fill=WHITE)
        precio = fmt_price(e)
        pw = d.textlength(precio, font=ft)
        d.text((1010 - pw, y+14), precio, font=ft, fill=CREAM)
        y += 76
    d.text((54, 920), "Todos los detalles en zazzypop-cr.app ✨", font=fs, fill=CREAM)
    return img

def gen_post2(events):
    # Spotlight: best paid event
    e = events[0] if events else None
    img, d = make_base()
    draw_logo(d)
    fb = ImageFont.truetype(FONT_PATH, 60, index=1)
    fm = ImageFont.truetype(FONT_PATH, 38, index=0)
    fs = ImageFont.truetype(FONT_PATH, 28, index=0)
    if e:
        title = e["title"][:36]
        d.text((54, 190), title, font=fb, fill=WHITE)
        d.rounded_rectangle([(54, 320), (700, 540)], radius=20, fill="#00000044")
        d.text((80, 345), f"📅 {fmt_date(e['datetime_start'])}", font=fm, fill=WHITE)
        d.text((80, 405), f"📍 {e['city']}", font=fm, fill=CREAM)
        d.text((80, 465), fmt_price(e), font=fb, fill=WHITE)
    d.text((54, 920), "Info en zazzypop-cr.app", font=fs, fill=CREAM)
    return img

def gen_post3(free_events):
    img, d = make_base()
    draw_logo(d)
    fb = ImageFont.truetype(FONT_PATH, 54, index=1)
    fm = ImageFont.truetype(FONT_PATH, 34, index=0)
    fs = ImageFont.truetype(FONT_PATH, 28, index=0)
    ft = ImageFont.truetype(FONT_PATH, 26, index=0)
    d.text((54, 190), "Planes GRATIS", font=fb, fill=WHITE)
    d.text((54, 258), "esta semana en CR 🙌", font=fb, fill=CREAM)
    y = 360
    for e in free_events[:4]:
        d.rounded_rectangle([(54, y), (1026, y+64)], radius=10, fill="#00000033")
        d.text((84, y+14), f"GRATIS  {e['title'][:44]}", font=ft, fill=WHITE)
        y += 80
    d.rounded_rectangle([(54, 760), (480, 836)], radius=30, fill=WHITE)
    d.text((80, 773), "Sin costo. De verdad.", font=fm, fill=ORANGE)
    d.text((54, 920), "zazzypop-cr.app/eventos?free=true", font=fs, fill=CREAM)
    return img

def gen_post4():
    img, d = make_base()
    draw_logo(d)
    fb = ImageFont.truetype(FONT_PATH, 52, index=1)
    fm = ImageFont.truetype(FONT_PATH, 36, index=0)
    fs = ImageFont.truetype(FONT_PATH, 28, index=0)
    ft = ImageFont.truetype(FONT_PATH, 28, index=0)
    d.text((54, 200), "¿Nunca sabés qué hacer", font=fb, fill=WHITE)
    d.text((54, 264), "el finde?", font=fb, fill=CREAM)
    d.text((54, 370), "ZazzyPop centraliza todos los", font=fm, fill=WHITE)
    d.text((54, 416), "eventos de Costa Rica.", font=fm, fill=WHITE)
    cats = ["Música", "Teatro", "Ferias", "Talleres", "Deportes", "Arte"]
    x, y = 54, 530
    for cat in cats:
        w = int(d.textlength(cat, font=ft)) + 30
        d.rounded_rectangle([(x, y), (x+w, y+46)], radius=23, fill="#00000044")
        d.text((x+15, y+8), cat, font=ft, fill=WHITE)
        x += w + 12
        if x > 820: x, y = 54, y + 62
    d.text((54, 780), "Filtrá por ciudad, precio y fecha.", font=fm, fill=CREAM)
    d.text((54, 920), "zazzypop-cr.app", font=fs, fill=CREAM)
    return img

def gen_post5(events):
    # Weekend / Friday picks
    img, d = make_base()
    draw_logo(d)
    fb = ImageFont.truetype(FONT_PATH, 54, index=1)
    fm = ImageFont.truetype(FONT_PATH, 36, index=0)
    fs = ImageFont.truetype(FONT_PATH, 28, index=0)
    d.text((54, 190), "Este finde en San José 🌙", font=fb, fill=WHITE)
    y = 310
    for e in events[:4]:
        d.rounded_rectangle([(54, y), (1026, y+72)], radius=10, fill="#00000033")
        d.text((80, y+16), e["title"][:36], font=fm, fill=WHITE)
        precio = fmt_price(e)
        pw = d.textlength(precio, font=fm)
        d.text((1000 - pw, y+16), precio, font=fm, fill=CREAM)
        y += 88
    d.text((54, 840), "¿A cuál van? 👇", font=fm, fill=WHITE)
    d.text((54, 920), "zazzypop-cr.app", font=fs, fill=CREAM)
    return img

# ── Caption generation ─────────────────────────────────────
def gen_captions(events, free_events):
    lines1 = "\n".join(
        f"{'🆓' if e['is_free'] else '🎟️'} {e['title'][:40]} — {fmt_date(e['datetime_start'])}, {fmt_price(e)}"
        for e in events[:6]
    )
    spotlight = events[0] if events else None
    sp_text = f"{spotlight['title']}\n📅 {fmt_date(spotlight['datetime_start'])}\n📍 {spotlight['city']}\n💳 {fmt_price(spotlight)}" if spotlight else ""

    lines3 = "\n".join(f"🆓 {e['title'][:44]} — {fmt_date(e['datetime_start'])}" for e in free_events[:4])

    finde = events[:4]
    lines5 = "\n".join(f"🎟️ {e['title'][:36]} — {fmt_price(e)}" for e in finde)

    return [
        # Post 1
        f"""Esta semana en San José hay para todos los gustos 👇

{lines1}

Todo en zazzypop-cr.app ✨

#EventosCR #SanJosé #QuéHacemos #PlanesEnCR #CostaRica #FinDeSemana""",

        # Post 2
        f"""No te podés perder esto 🔥

{sp_text}

Info y más eventos en zazzypop-cr.app 👆

#EventosCR #CostaRica #SanJosé #Planes""",

        # Post 3
        f"""Planes GRATIS esta semana en CR 🙌

{lines3}

Gratis. De verdad.
zazzypop-cr.app/eventos?free=true

#GratisEnCR #EventosCR #SanJosé #CostaRica #PuraVida""",

        # Post 4
        """¿Nunca sabés qué hacer el finde?

ZazzyPop centraliza todos los eventos de Costa Rica en un solo lugar.

Música · Teatro · Ferias · Talleres · Deportes

Filtrá por ciudad, precio y fecha.
Sin scrollear Instagram por media hora.

🔗 zazzypop-cr.app

#EventosCR #CostaRica #QuéHacemos #PlanesEnCR""",

        # Post 5
        f"""Este finde en San José 🌙

{lines5}

Todos los detalles en zazzypop-cr.app

¿A cuál van? 👇

#ViernesEnCR #EventosCR #SanJosé #NocheEnSJ""",
    ]

# ── Email ──────────────────────────────────────────────────
def send_email(images, captions):
    horarios = ["Lunes 6 PM", "Martes 12 PM", "Miércoles 6 PM", "Jueves 12 PM", "Viernes 4 PM"]
    body = "<h2>Posts de la semana — ZazzyPop 🧡</h2>"
    for i, (caption, hora) in enumerate(zip(captions, horarios), 1):
        body += f"""
        <hr>
        <h3>Post {i} — {hora}</h3>
        <pre style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap">{caption}</pre>
        """
    body += "<hr><p>Las 5 imágenes van adjuntas. Subí cada una a Buffer con su caption correspondiente.</p>"

    attachments = []
    for i, img in enumerate(images, 1):
        buf = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        img.save(buf.name, quality=92)
        with open(buf.name, "rb") as f:
            attachments.append({
                "filename": f"post{i}.jpg",
                "content": base64.b64encode(f.read()).decode(),
            })

    payload = json.dumps({
        "from": "ZazzyPop <onboarding@resend.dev>",
        "to": [DEST_EMAIL],
        "subject": f"🧡 Posts de la semana — {datetime.now().strftime('%d %b %Y')}",
        "html": body,
        "attachments": attachments,
    }).encode()

    req = Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req) as r:
        result = json.loads(r.read())
        print(f"Email enviado: {result}")

# ── Main ───────────────────────────────────────────────────
def main():
    print("Fetching events from Supabase...")
    all_events = fetch_events()
    print(f"Found {len(all_events)} events")

    events, free_events = pick_events(all_events)
    print(f"Selected {len(events)} featured + {len(free_events)} free events")

    print("Generating images...")
    images = [
        gen_post1(events, "Esta semana"),
        gen_post2(events),
        gen_post3(free_events),
        gen_post4(),
        gen_post5(events),
    ]

    captions = gen_captions(events, free_events)

    print("Sending email...")
    send_email(images, captions)
    print("Done!")

if __name__ == "__main__":
    main()
