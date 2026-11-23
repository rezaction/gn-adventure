# Uji Tahap 4: kontak/booking -> kotak masuk, riwayat versi, SEO, CSP. Jalankan server baru: node tests/dev_server.mjs 8140
import sys,json,urllib.request
from playwright.sync_api import sync_playwright
B="http://localhost:8140"; fails=[]
def check(c,m):
    print(("  ok  " if c else "  GAGAL ")+m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b=p.chromium.launch(); stub=open("tests/supabase_client_stub.js").read(); errs=[]; csp=[]
    pub=b.new_page(viewport={"width":390,"height":844}); pub.on("pageerror",lambda e:errs.append(str(e))); pub.on("console",lambda m: csp.append(m.text) if "Content Security Policy" in m.text else None)
    pub.goto(B+"/contact/?package=open-trip-bromo-sunrise&promo=gonest10&ambient=off"); pub.wait_for_timeout(1200)
    check(pub.get_attribute("[data-k=booking]","aria-pressed")=="true","tab booking aktif dari ?package=")
    check(pub.input_value("#f-package")=="open-trip-bromo-sunrise" and pub.input_value("#f-promo")=="GONEST10","paket dan kode promo terisi dari tautan")
    pub.click("#cf button[type=submit]"); pub.wait_for_timeout(300)
    check("Nama" in pub.inner_text("#e-f-name") and "valid" in pub.inner_text("#e-f-contact"),"validasi nama & kontak tampil")
    pub.fill("#f-name","Budi Santoso"); pub.fill("#f-contact","0812 3456 7890"); pub.fill("#f-from","2027-03-10"); pub.fill("#f-pax","4"); pub.click("#cf button[type=submit]"); pub.wait_for_timeout(900)
    check("terkirim" in pub.inner_text("h1").lower(),"pesan terkirim")
    check("wa.me" in pub.get_attribute(".hero__cta a","href"),"tombol lanjut via WhatsApp")
    # honeypot
    r=urllib.request.Request(B+"/api/message",data=json.dumps({"name":"Bot","contact":"bot@x.com","body":"hi","hp":"spam"}).encode(),headers={"content-type":"application/json"}); urllib.request.urlopen(r).read()
    # SEO
    pub.goto(B+"/packages/?slug=open-trip-bromo-sunrise"); pub.wait_for_timeout(1200)
    ld=json.loads(pub.inner_text("script[data-ld]") if False else pub.evaluate("document.querySelector('script[data-ld]').textContent"))
    check(ld["@type"]=="TouristTrip" and ld["offers"]["price"]==450000,"JSON-LD TouristTrip + Offer")
    check("slug=open-trip-bromo-sunrise" in pub.get_attribute("link[rel=canonical]","href"),"canonical memuat slug")
    pub.goto(B+"/journal/?slug=tips-bromo"); pub.wait_for_timeout(1000); check(json.loads(pub.evaluate("document.querySelector('script[data-ld]').textContent"))["@type"]=="Article","JSON-LD Article")
    pub.goto(B+"/"); pub.wait_for_timeout(1200); check(json.loads(pub.evaluate("document.querySelector('script[data-ld]').textContent"))["@type"]=="TravelAgency","JSON-LD TravelAgency di beranda")
    sm=urllib.request.urlopen(B+"/sitemap.xml").read().decode(); check("/packages/?slug=open-trip-bromo-sunrise" in sm and "/journal/?slug=tips-bromo" in sm and "<urlset" in sm,"sitemap.xml memuat paket & artikel")
    rb=urllib.request.urlopen(B+"/robots.txt").read().decode(); check("Disallow: /admin/" in rb and "Sitemap:" in rb,"robots.txt")
    check(not csp,"tidak ada pelanggaran CSP di halaman publik "+str(csp[:1]))
    # admin
    ctx=b.new_context(viewport={"width":1200,"height":900}); ctx.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub))
    pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:d.accept()); pg.on("console",lambda m: csp.append(m.text) if "Content Security Policy" in m.text else None)
    pg.goto(B+"/admin/"); pg.fill("#em","admin@x.id"); pg.fill("#pw","adminpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])"); pg.wait_for_timeout(700)
    check(pg.inner_text("#nav a[href='#/pesan'] .badge")=="1","lencana 1 pesan baru (bot honeypot tidak masuk)")
    pg.click("#nav a[href='#/pesan']"); pg.wait_for_selector(".msg"); check(pg.locator(".msg").count()==1 and "Budi" in pg.inner_text(".msg"),"pesan tampil di kotak masuk")
    pg.click(".msg"); pg.wait_for_selector(".msgd")
    t=pg.inner_text(".msgd"); check("Open Trip Bromo" in t and "GONEST10" in t and "2027-03-10" in t,"detail memuat paket, promo, tanggal")
    check("wa.me/6281234567890" in pg.get_attribute(".msgact a","href"),"tautan balas WhatsApp memakai nomor internasional")
    pg.click("#sts [data-s=replied]"); pg.wait_for_timeout(700); check(pg.get_attribute("#sts [data-s=replied]","aria-pressed")=="true","status dibalas")
    pg.fill("#note","Sudah dihubungi via WA"); pg.click("#sn"); pg.wait_for_timeout(500)
    pg.click("#nav a[href='#/pesan']"); pg.wait_for_timeout(600); check(pg.locator("#nav a[href='#/pesan'] .badge").count()==0,"lencana hilang setelah dibalas")
    pg.click("#fl [data-s=replied]"); pg.wait_for_selector(".msg"); check(pg.locator(".msg").count()==1,"filter Dibalas")
    pg.click(".msg"); pg.wait_for_selector("#dl"); pg.click("#dl"); pg.wait_for_timeout(600); check("Tidak ada pesan" in pg.inner_text("#view") or pg.locator(".msg").count()==0,"hapus pesan")
    pg.click("#logout"); pg.wait_for_selector("#login:not([hidden])")
    # owner: riwayat versi
    pg.fill("#em","owner@x.id"); pg.fill("#pw","ownerpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])")
    pg.goto(B+"/admin/#/section/home.hero"); pg.wait_for_selector(".i18n"); h0=pg.locator(".i18n").nth(1).locator("input").first.input_value()
    pg.locator(".i18n").nth(1).locator("input").first.fill("Judul sementara"); pg.click("text=Simpan perubahan"); pg.wait_for_selector(".toast.on"); pg.wait_for_timeout(400)
    pg.click("text=Riwayat versi"); pg.wait_for_selector(".hist__i"); check(pg.locator(".hist__i").count()==1,"riwayat menampilkan 1 versi lama")
    pg.click(".hist__i button"); pg.wait_for_timeout(800)
    pg.goto(B+"/admin/#/section/home.hero"); pg.wait_for_timeout(300); pg.reload(); pg.wait_for_selector(".i18n")
    check(pg.locator(".i18n").nth(1).locator("input").first.input_value()==h0,"pulihkan mengembalikan judul semula")
    check(not csp,"tidak ada pelanggaran CSP di admin "+str(csp[:1])); check(not errs,"tanpa galat JS "+str(errs[:2])); b.close()
print("\nGAGAL:",fails) if fails else print("\nSEMUA TES TAHAP 4 LULUS"); sys.exit(1 if fails else 0)
