"""
Weekly social media post generator for ZazzyPop.
Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SOCIAL_EMAIL
"""
import os, json, tempfile, platform
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from PIL import Image, ImageDraw, ImageFont
import resend

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
RESEND_KEY   = os.environ["RESEND_API_KEY"]
DEST_EMAIL   = os.environ["SOCIAL_EMAIL"]

ORANGE = "#F97316"; DARK = "#7C2D12"; WHITE = "#FFFFFF"; CREAM = "#FFF7ED"

if platform.system() == "Darwin":
    FONT_R = "/System/Library/Fonts/HelveticaNeue.ttc"; RI = 0
    FONT_B = "/System/Library/Fonts/HelveticaNeue.ttc"; BI = 1
else:
    FONT_R = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"; RI = 0
    FONT_B = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf";    BI = 0

def fetch_events():
    now = datetime.now(timezone.utc)
    params = [
        ("is_approved", "eq.true"),
        ("datetime_start", f"gte.{now.isoformat()}"),
        ("datetime_start", f"lte.{(now + timedelta(days=8)).isoformat()}"),
        ("order", "is_featured.desc,datetime_start.asc"),
        ("limit", "60"),
        ("select", "title,datetime_start,city,is_free,price_min"),
    ]
    req = Request(f"{SUPABASE_URL}/rest/v1/events?{urlencode(params)}",
                  headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    with urlopen(req) as r:
        return json.loads(r.read())

def pick(all_events):
    free = [e for e in all_events if e["is_free"]]
    paid = [e for e in all_events if not e["is_free"] and e["price_min"] > 1000]
    seen, unique = set(), []
    for e in paid + free:
        if e["title"] not in seen:
            seen.add(e["title"]); unique.append(e)
    return unique[:6], free[:4]

def fdate(iso):
    dt = datetime.fromisoformat(iso.replace("Z","+00:00")).astimezone(timezone(timedelta(hours=-6)))
    return f"{['Lun','Mar','Mie','Jue','Vie','Sab','Dom'][dt.weekday()]} {dt.day}"

def fprice(e):
    return "GRATIS" if e["is_free"] else (f"c{e['price_min']:,}" if e["price_min"]>0 else "Ver info")

def base():
    img = Image.new("RGB",(1080,1080),ORANGE); d = ImageDraw.Draw(img)
    d.rectangle([(0,900),(1080,1080)],fill=DARK)
    d.ellipse([-100,-100,300,300],fill="#FB923C"); d.ellipse([780,730,1180,1130],fill="#EA580C")
    return img, d

def logo(d):
    fl=ImageFont.truetype(FONT_B,42,index=BI); ft=ImageFont.truetype(FONT_R,26,index=RI)
    d.text((54,44),"zazzy",font=fl,fill=WHITE); w=d.textlength("zazzy",font=fl)
    d.text((54+w,44),"pop",font=fl,fill=CREAM); d.text((54,92),"zazzypop-cr.app",font=ft,fill="#FFEDD5")

def post1(events):
    img,d=base(); logo(d)
    fb=ImageFont.truetype(FONT_B,48,index=BI); fs=ImageFont.truetype(FONT_R,26,index=RI); ft=ImageFont.truetype(FONT_R,23,index=RI)
    d.text((54,180),"Esta semana en San Jose",font=fb,fill=WHITE)
    d.text((54,242),"hay para todos los gustos",font=fb,fill=CREAM)
    y=340
    for e in events[:6]:
        d.rounded_rectangle([(54,y),(1026,y+60)],radius=10,fill="#00000033")
        d.text((74,y+14),fdate(e["datetime_start"]),font=ft,fill=CREAM)
        d.text((158,y+14),e["title"][:42],font=ft,fill=WHITE)
        p=fprice(e); pw=d.textlength(p,font=ft); d.text((1008-pw,y+14),p,font=ft,fill=CREAM)
        y+=74
    d.text((54,920),"Todos los detalles en zazzypop-cr.app",font=fs,fill=CREAM)
    return img

def post2(events):
    e=events[0] if events else None; img,d=base(); logo(d)
    fb=ImageFont.truetype(FONT_B,56,index=BI); fm=ImageFont.truetype(FONT_R,36,index=RI); fs=ImageFont.truetype(FONT_R,28,index=RI)
    if e:
        d.text((54,190),e["title"][:32],font=fb,fill=WHITE)
        d.rounded_rectangle([(54,320),(680,530)],radius=20,fill="#00000044")
        d.text((80,345),fdate(e["datetime_start"]),font=fm,fill=WHITE)
        d.text((80,405),e["city"],font=fm,fill=CREAM); d.text((80,458),fprice(e),font=fb,fill=WHITE)
    d.text((54,920),"Info en zazzypop-cr.app",font=fs,fill=CREAM)
    return img

def post3(free_events):
    img,d=base(); logo(d)
    fb=ImageFont.truetype(FONT_B,54,index=BI); fm=ImageFont.truetype(FONT_R,34,index=RI)
    fs=ImageFont.truetype(FONT_R,28,index=RI); ft=ImageFont.truetype(FONT_R,25,index=RI)
    d.text((54,190),"Planes GRATIS",font=fb,fill=WHITE); d.text((54,256),"esta semana en CR",font=fb,fill=CREAM)
    y=360
    for e in free_events[:4]:
        d.rounded_rectangle([(54,y),(1026,y+64)],radius=10,fill="#00000033")
        d.text((84,y+14),f"GRATIS  {e['title'][:44]}",font=ft,fill=WHITE); y+=80
    d.rounded_rectangle([(54,760),(480,836)],radius=30,fill=WHITE)
    d.text((80,773),"Sin costo. De verdad.",font=fm,fill=ORANGE)
    d.text((54,920),"zazzypop-cr.app/eventos?free=true",font=fs,fill=CREAM)
    return img

def post4():
    img,d=base(); logo(d)
    fb=ImageFont.truetype(FONT_B,52,index=BI); fm=ImageFont.truetype(FONT_R,36,index=RI)
    fs=ImageFont.truetype(FONT_R,28,index=RI); ft=ImageFont.truetype(FONT_R,28,index=RI)
    d.text((54,200),"Nunca saber que hacer",font=fb,fill=WHITE)
    d.text((54,264),"el finde... es historia.",font=fb,fill=CREAM)
    d.text((54,380),"ZazzyPop centraliza todos los",font=fm,fill=WHITE)
    d.text((54,428),"eventos de Costa Rica.",font=fm,fill=WHITE)
    x,y=54,540
    for cat in ["Musica","Teatro","Ferias","Talleres","Deportes","Arte"]:
        w=int(d.textlength(cat,font=ft))+30
        d.rounded_rectangle([(x,y),(x+w,y+46)],radius=23,fill="#00000044")
        d.text((x+15,y+8),cat,font=ft,fill=WHITE); x+=w+12
        if x>820: x,y=54,y+62
    d.text((54,790),"Filtra por ciudad, precio y fecha.",font=fm,fill=CREAM)
    d.text((54,920),"zazzypop-cr.app",font=fs,fill=CREAM)
    return img

def post5(events):
    img,d=base(); logo(d)
    fb=ImageFont.truetype(FONT_B,54,index=BI); fm=ImageFont.truetype(FONT_R,36,index=RI); fs=ImageFont.truetype(FONT_R,28,index=RI)
    d.text((54,190),"Este finde en San Jose",font=fb,fill=WHITE)
    y=310
    for e in events[:4]:
        d.rounded_rectangle([(54,y),(1026,y+72)],radius=10,fill="#00000033")
        d.text((80,y+16),e["title"][:36],font=fm,fill=WHITE)
        p=fprice(e); pw=d.textlength(p,font=fm); d.text((998-pw,y+16),p,font=fm,fill=CREAM); y+=88
    d.text((54,840),"A cual van? Todos los detalles:",font=fm,fill=WHITE)
    d.text((54,920),"zazzypop-cr.app",font=fs,fill=CREAM)
    return img

def captions(events, free_events):
    l1="\n".join(f"{'🆓' if e['is_free'] else '🎟️'} {e['title'][:40]} — {fdate(e['datetime_start'])}, {fprice(e)}" for e in events[:6])
    sp=events[0] if events else None
    sp_t=f"{sp['title']}\n📅 {fdate(sp['datetime_start'])}\n📍 {sp['city']}\n💳 {fprice(sp)}" if sp else ""
    l3="\n".join(f"🆓 {e['title'][:44]} — {fdate(e['datetime_start'])}" for e in free_events[:4])
    l5="\n".join(f"🎟️ {e['title'][:36]} — {fprice(e)}" for e in events[:4])
    return [
        f"Esta semana en San José hay para todos los gustos 👇\n\n{l1}\n\nTodo en zazzypop-cr.app ✨\n\n#EventosCR #SanJosé #QuéHacemos #PlanesEnCR #CostaRica",
        f"No te podés perder esto 🔥\n\n{sp_t}\n\nInfo en zazzypop-cr.app 👆\n\n#EventosCR #CostaRica #SanJosé",
        f"Planes GRATIS esta semana en CR 🙌\n\n{l3}\n\nGratis. De verdad.\nzazzypop-cr.app/eventos?free=true\n\n#GratisEnCR #EventosCR #CostaRica #PuraVida",
        "¿Nunca sabés qué hacer el finde?\n\nZazzyPop centraliza todos los eventos de Costa Rica.\n\nMúsica · Teatro · Ferias · Talleres · Deportes\n\nFiltrá por ciudad, precio y fecha.\n\n🔗 zazzypop-cr.app\n\n#EventosCR #CostaRica #QuéHacemos",
        f"Este finde en San José 🌙\n\n{l5}\n\n¿A cuál van? 👇\nzazzypop-cr.app\n\n#ViernesEnCR #EventosCR #SanJosé",
    ]

def send_email(images, caps):
    resend.api_key = RESEND_KEY
    horarios = ["Lunes 6 PM","Martes 12 PM","Miercoles 6 PM","Jueves 12 PM","Viernes 4 PM"]
    body = "<h2>Posts de la semana ZazzyPop</h2>"
    for i,(cap,hora) in enumerate(zip(caps,horarios),1):
        safe=cap.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
        body+=f'<hr><h3>Post {i} — {hora}</h3><pre style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap">{safe}</pre>'
    body+="<hr><p>Las 5 imagenes van adjuntas. Subi cada una a Buffer.</p>"

    attachments=[]
    for i,img in enumerate(images,1):
        with tempfile.NamedTemporaryFile(suffix=".jpg",delete=False) as buf:
            img.save(buf.name,quality=92)
        with open(buf.name,"rb") as f:
            attachments.append({"filename":f"post{i}.jpg","content":list(f.read())})

    result=resend.Emails.send({
        "from":"ZazzyPop <onboarding@resend.dev>",
        "to":[DEST_EMAIL],
        "subject":f"Posts ZazzyPop — {datetime.now().strftime('%d %b %Y')}",
        "html":body,
        "attachments":attachments,
    })
    print(f"Email enviado: {result}")

def main():
    print("Fetching events..."); all_events=fetch_events(); print(f"Found {len(all_events)} events")
    events,free_events=pick(all_events); print(f"Selected {len(events)} + {len(free_events)} free")
    print("Generating images...")
    images=[post1(events),post2(events),post3(free_events),post4(),post5(events)]
    caps=captions(events,free_events)
    print("Sending email..."); send_email(images,caps); print("Done!")

if __name__=="__main__":
    main()
