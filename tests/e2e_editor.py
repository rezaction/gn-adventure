# Uji editor Owner. Jalankan: node tests/dev_server.mjs 8140 (server baru) lalu python3 tests/e2e_editor.py
import sys,base64,json,urllib.request
from playwright.sync_api import sync_playwright
B="http://localhost:8140"; fails=[]
def check(c,m):
    print(("  ok  " if c else "  GAGAL ")+m)
    if not c: fails.append(m)
PNG=base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC")
open("/tmp/t.png","wb").write(PNG)
api=lambda n:json.load(urllib.request.urlopen(B+"/api/content/"+n))["data"]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1200,"height":900}); stub=open("tests/supabase_client_stub.js").read()
    ctx.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub))
    pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:d.accept())
    pg.goto(B+"/admin/"); pg.fill("#em","owner@x.id"); pg.fill("#pw","ownerpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])")
    pg.click("#nav a[href='#/section']"); pg.wait_for_selector(".sitem"); check(pg.locator(".sitem").count()==7,"daftar 7 section")
    pg.click(".sitem[href='#/section/home.hero']"); pg.wait_for_selector("text=Judul baris ke-2")
    ins=pg.locator(".i18n input"); check(ins.count()>=8,"form hero punya kolom ID/EN")
    first=pg.locator(".i18n").nth(1).locator("input").first  # heading id
    first.fill("Liburan tanpa ribet,")
    pg.set_input_files("input[type=file]","/tmp/t.jpg"); pg.wait_for_selector(".img__pv img"); check(pg.locator(".img__pv img").count()==1,"JPG 3000x2000 terunggah & pratinjau tampil (CSP admin aktif)")
    pg.click("text=Simpan perubahan"); pg.wait_for_selector(".toast.on"); check("Tersimpan" in pg.inner_text("#toast"),"simpan section")
    h=[s for s in api("sections?page=home") if s["id"]=="home.hero"][0]["fields"]
    check(h["heading"]["id"]=="Liburan tanpa ribet,","API publik memuat judul baru"); check(h["image"].startswith("site/") and h["image"].endswith(".webp"),"path gambar disimpan: "+h["image"])
    check(h["heading"]["en"]=="Your journey,","kolom EN utuh"); check("cta1" in h and h["cta1"]["href"]=="/packages","tombol utama utuh")
    # sembunyikan section
    pg.goto(B+"/admin/#/section/home.journal"); pg.wait_for_selector("text=Tampilkan section ini"); pg.uncheck("text=Tampilkan section ini di situs"); pg.click("text=Simpan perubahan"); pg.wait_for_timeout(400)
    # pengaturan
    pg.click("#nav a[href='#/pengaturan']"); pg.wait_for_selector(".acc")
    pg.click(".acc:has-text('Kontak') summary"); pg.fill(".acc:has-text('Kontak') .fld:has-text('Nomor WhatsApp') input","08abc"); pg.click("text=Simpan kontak"); pg.wait_for_timeout(300)
    check(pg.locator(".toast.bad").count()==1 and "WhatsApp" in pg.inner_text("#toast"),"nomor WhatsApp tidak valid ditolak")
    pg.fill(".acc:has-text('Kontak') .fld:has-text('Nomor WhatsApp') input","628111222333"); pg.fill(".acc:has-text('Kontak') .fld:has-text('Username Telegram') input","@GoNEST_Real"); pg.click("text=Simpan kontak"); pg.wait_for_timeout(400)
    c=api("settings")["contact"]; check(c["whatsapp"]=="628111222333" and c["telegram"]=="GoNEST_Real","kontak tersimpan & dibersihkan")
    pg.click(".acc:has-text('Menu navigasi') summary"); n0=pg.locator(".acc:has-text('Menu navigasi') .rep__i").count()
    pg.click(".acc:has-text('Menu navigasi') >> text=+ Tambah menu"); check(pg.locator(".acc:has-text('Menu navigasi') .rep__i").count()==n0+1,"tambah menu")
    pg.click(".acc:has-text('Menu navigasi') .rep__i >> nth=0 >> text=Hapus"); pg.wait_for_timeout(200); check(pg.locator(".acc:has-text('Menu navigasi') .rep__i").count()==n0,"hapus menu")
    pg.click(".acc:has-text('Warna') summary"); pg.select_option(".acc:has-text('Warna') select","snow"); pg.click("text=Simpan warna & animasi latar"); pg.wait_for_timeout(400)
    check(api("settings")["theme"]["ambient"]["mode"]=="snow","mode salju tersimpan")
    # situs publik mencerminkan
    pub=b.new_page(viewport={"width":390,"height":800}); pub.on("pageerror",lambda e:errs.append(str(e))); pub.goto(B+"/"); pub.wait_for_timeout(1200)
    check("Liburan tanpa ribet" in pub.inner_text("h1"),"beranda menampilkan judul baru"); check(pub.evaluate("document.documentElement.dataset.ambient")=="snow","beranda memakai mode salju")
    check(pub.locator("#jurnal").count()==0,"section tersembunyi tidak tampil")
    check("628111222333" in pub.get_attribute(".chat__pill","href"),"tautan chat memakai nomor baru")
    check(pub.locator(".hero__media img[src*='/api/image/site/']").count()==1,"foto hero memakai /api/image")
    check(not errs,"tanpa galat JS "+str(errs[:2])); b.close()
print("\nGAGAL:",fails) if fails else print("\nSEMUA TES EDITOR LULUS"); sys.exit(1 if fails else 0)
