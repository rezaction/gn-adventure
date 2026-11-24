# Uji live chat: pengunjung mulai chat -> admin membalas -> pengunjung menerima. Jalankan server baru: node tests/dev_server.mjs 8140
import json,urllib.request
from playwright.sync_api import sync_playwright
B="http://localhost:8140"; fails=[]
def check(c,m):
    print(("  ok  " if c else "  GAGAL ")+m)
    if not c: fails.append(m)
def post(d):
    r=urllib.request.Request(B+"/api/chat",data=json.dumps(d).encode(),headers={"content-type":"application/json"})
    try: return json.loads(urllib.request.urlopen(r).read())
    except urllib.error.HTTPError as e: return json.loads(e.read())
with sync_playwright() as p:
    b=p.chromium.launch(); stub=open("tests/supabase_client_stub.js").read(); errs=[]; csp=[]
    ctx=b.new_context(viewport={"width":390,"height":844}); pub=ctx.new_page()
    pub.on("pageerror",lambda e:errs.append(str(e))); pub.on("console",lambda m: csp.append(m.text) if "Content Security Policy" in m.text else None)
    pub.goto(B+"/?ambient=off"); pub.wait_for_timeout(1200)
    pub.click(".chat__btn"); pub.wait_for_timeout(500)
    check(pub.locator(".chat__pill").count()==3 and "Live chat" in pub.inner_text(".chat__pill--live"),"pil Live chat + WhatsApp + Telegram")
    pub.click(".chat__pill--live"); pub.wait_for_selector("#livechat.lc--on form")
    pub.click("#livechat button[type=submit]"); check(pub.is_visible("#livechat .lc__err"),"validasi form chat")
    pub.fill("#livechat [name=name]","Sinta"); pub.fill("#livechat [name=contact]","sinta@mail.com"); pub.fill("#livechat [name=body]","Halo, trip Bromo masih ada tanggal 20?")
    pub.click("#livechat button[type=submit]"); pub.wait_for_selector("#livechat .lc__log .lc__m--visitor")
    check("Bromo" in pub.inner_text(".lc__m--visitor"),"pesan pengunjung tampil di percakapan")
    # penyalahgunaan
    check(post({"action":"send","id":"00000000-0000-0000-0000-000000000000","token":"x"*40,"body":"hi"}).get("ok") is False,"token salah ditolak")
    check(post({"action":"start","name":"Bot","body":"hi","hp":"spam"}).get("ok") is True,"honeypot diterima diam-diam")
    # admin
    actx=b.new_context(viewport={"width":1200,"height":900}); actx.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub))
    pg=actx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("console",lambda m: csp.append(m.text) if "Content Security Policy" in m.text else None)
    pg.goto(B+"/admin/"); pg.fill("#em","admin@x.id"); pg.fill("#pw","adminpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])"); pg.wait_for_timeout(800)
    check(pg.inner_text("#nav a[href='#/chat'] .badge")=="1","lencana chat 1 belum dibaca (honeypot tidak masuk)")
    pg.click("#nav a[href='#/chat']"); pg.wait_for_selector(".msg"); check("Sinta" in pg.inner_text(".msg"),"percakapan tampil di daftar")
    pg.click(".msg"); pg.wait_for_selector(".lcm--visitor"); check("Bromo" in pg.inner_text(".lcm--visitor"),"admin melihat pesan pengunjung")
    pg.wait_for_timeout(500); pg.fill("#lct","Halo Sinta, masih ada. Mau berapa orang?"); pg.click("#lcf button"); pg.wait_for_selector(".lcm--staff")
    check("berapa orang" in pg.inner_text(".lcm--staff"),"balasan admin tampil")
    pub.wait_for_selector("#livechat .lc__m--staff",timeout=12000); check("Sinta" in pub.inner_text("#livechat .lc__m--staff") or "berapa orang" in pub.inner_text("#livechat .lc__m--staff"),"pengunjung menerima balasan lewat polling")
    pub.fill("#livechat .lc__s input","4 orang ya"); pub.click("#livechat .lc__s button"); pub.wait_for_selector("#livechat .lc__m--visitor >> nth=1")
    # lanjut setelah muat ulang
    pub.reload(); pub.wait_for_timeout(1000); pub.click(".chat__btn"); pub.click(".chat__pill--live"); pub.wait_for_selector("#livechat .lc__log .lc__m")
    check(pub.locator("#livechat .lc__m").count()>=3,"percakapan lanjut setelah muat ulang")
    # tutup oleh admin
    pg.click("#cl"); pg.wait_for_timeout(500)
    pub.wait_for_selector("#livechat .lc__closed",timeout=12000); check(True,"pengunjung melihat percakapan ditutup")
    octx=b.new_context(viewport={"width":1200,"height":900}); octx.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub)); ow=octx.new_page(); ow.goto(B+"/admin/"); ow.fill("#em","owner@x.id"); ow.fill("#pw","ownerpass123"); ow.click("#loginBtn"); ow.wait_for_selector("#app:not([hidden])"); ow.click("#nav a[href='#/pengaturan']"); ow.wait_for_selector("#st details")
    ow.click("summary:has-text(\"Tombol chat\")"); ow.wait_for_timeout(500); check("percakapan langsung" in ow.inner_text("#view").lower() or "Percakapan langsung" in ow.inner_text("#view"),"pengaturan live chat ada di admin")
    check(not csp,"tidak ada pelanggaran CSP "+str(csp[:1])); check(not errs,"tidak ada galat JS "+str(errs[:1]))
    b.close()
print("GAGAL:",fails) if fails else print("SEMUA LULUS"); raise SystemExit(1 if fails else 0)
