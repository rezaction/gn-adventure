# Uji CRUD admin + halaman publik. Jalankan server baru: node tests/dev_server.mjs 8140
import sys,base64,json,urllib.request
from playwright.sync_api import sync_playwright
B="http://localhost:8140"; fails=[]
def check(c,m):
    print(("  ok  " if c else "  GAGAL ")+m)
    if not c: fails.append(m)
open("/tmp/t.png","wb").write(base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"))
api=lambda n:json.load(urllib.request.urlopen(B+"/api/content/"+n))["data"]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1200,"height":900}); stub=open("tests/supabase_client_stub.js").read()
    ctx.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub))
    pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:d.accept())
    pg.goto(B+"/admin/"); pg.fill("#em","admin@x.id"); pg.fill("#pw","adminpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])")
    nav=pg.inner_text("#nav"); check(all(x in nav for x in ["Paket trip","Kendaraan","Promo","Artikel","Galeri","Destinasi"]),"admin umum melihat menu konten"); check("Pengaturan situs" not in nav,"admin umum tanpa menu tampilan")
    # paket: tambah
    pg.click("#nav a[href='#/c/packages']"); pg.wait_for_selector(".row"); check(pg.locator(".row").count()==3,"daftar 3 paket")
    pg.click("text=+ Tambah paket"); pg.wait_for_selector("text=Nama paket")
    pg.locator(".i18n").nth(0).locator("input").first.fill("Trip Dieng Baru"); pg.locator(".i18n").nth(0).locator("input").nth(1).fill("New Dieng Trip")
    pg.fill("text=Harga mulai dari (Rp) >> xpath=following::input[1]","900000") if False else None
    pg.locator(".fld:has(label:text('Harga mulai dari')) input").fill("900000")
    pg.select_option(".fld:has(label:text('Status')) select >> nth=0","published")
    pg.click("text=+ Tambah sorotan"); pg.locator(".rep__i").first.locator("input").first.fill("Sunrise Sikunir")
    pg.click("text=Simpan paket"); pg.wait_for_selector(".toast.on"); pg.wait_for_timeout(500)
    pk=[x for x in api("packages") if x["slug"]=="trip-dieng-baru"]; check(len(pk)==1 and pk[0]["price_from"]==900000,"paket baru tersimpan, slug otomatis, harga angka")
    check(pk and pk[0]["highlights"][0]["id"]=="Sunrise Sikunir","sorotan tersimpan sebagai objek i18n")
    # slug ganda
    pg.goto(B+"/admin/#/c/packages/new"); pg.wait_for_selector("text=Nama paket"); pg.locator(".i18n").nth(0).locator("input").first.fill("Trip Dieng Baru"); pg.click("text=Simpan paket"); pg.wait_for_timeout(500)
    check("sudah dipakai" in pg.inner_text("#toast"),"slug ganda ditolak dengan pesan jelas")
    # kendaraan: blok tanggal
    pg.goto(B+"/admin/#/c/vehicles"); pg.wait_for_selector(".row"); pg.click(".row >> nth=0"); pg.wait_for_selector("text=Tanggal terpakai")
    pg.fill("#b1","2027-02-01"); pg.fill("#b2","2027-02-03"); pg.fill("#b3","Sewa Pak Budi"); pg.click("#b4"); pg.wait_for_selector(".blrow b"); check("2027-02-01" in pg.inner_text("#bl"),"tanggal terpakai ditambah")
    av=json.load(urllib.request.urlopen(B+"/api/availability?from=2027-02-02"))["data"]; check([x for x in av if x["vehicle_id"]=="v1"][0]["available"] is False,"ketersediaan publik mengikuti blok tanggal")
    pg.fill("#b1","2027-03-05"); pg.fill("#b2","2027-03-01"); pg.click("#b4"); check("sebelum" in pg.inner_text("#b5"),"validasi rentang tanggal terbalik")
    pg.click("#bl button"); pg.wait_for_timeout(400); check("Belum ada" in pg.inner_text("#bl"),"hapus blok")
    # promo: kode huruf kecil -> kapital, validasi
    pg.goto(B+"/admin/#/c/promos/new"); pg.wait_for_selector("text=Kode promo"); pg.fill(".fld:has(label:text('Kode promo')) input","a"); pg.click("text=Simpan promo"); pg.wait_for_timeout(300); check("Kode promo" in pg.inner_text("#toast"),"kode promo pendek ditolak")
    pg.fill(".fld:has(label:text('Kode promo')) input","diskon25"); pg.locator(".i18n").nth(0).locator("input").first.fill("Diskon 25%"); pg.click("text=Simpan promo"); pg.wait_for_timeout(500)
    check(any(x["code"]=="DISKON25" for x in api("promos")),"kode promo disimpan kapital")
    # artikel terbit -> published_at terisi
    pg.goto(B+"/admin/#/c/articles/new"); pg.wait_for_selector("text=Isi artikel"); pg.locator(".i18n").nth(0).locator("input").first.fill("Artikel Uji"); pg.select_option(".fld:has(label:text('Status')) select","published"); pg.click("text=Simpan artikel"); pg.wait_for_timeout(500)
    ar=[x for x in api("articles") if x["slug"]=="artikel-uji"]; check(len(ar)==1 and ar[0]["published_at"],"artikel terbit mendapat tanggal terbit")
    # galeri: unggah banyak
    pg.goto(B+"/admin/#/c/gallery_items"); pg.wait_for_selector(".bar"); pg.set_input_files("#bulk",["/tmp/t.png","/tmp/t.png"]); pg.wait_for_timeout(1500)
    check(len(api("gallery"))==7,"unggah 2 foto sekaligus -> 7 item")
    # hapus paket baru
    pg.goto(B+"/admin/#/c/packages"); pg.wait_for_selector(".row"); pg.click(".row:has-text('Trip Dieng Baru')"); pg.wait_for_selector("text=Hapus"); pg.click(".card > button.btn--danger-o"); pg.wait_for_timeout(600)
    check(not any(x["slug"]=="trip-dieng-baru" for x in api("packages")),"hapus paket")
    check(not errs,"tanpa galat JS "+str(errs[:2])); b.close()
print("\nGAGAL:",fails) if fails else print("\nSEMUA TES CRUD LULUS"); sys.exit(1 if fails else 0)
