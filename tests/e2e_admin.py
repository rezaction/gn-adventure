# Uji ujung-ke-ujung admin di browser. Jalankan dev_server dulu: node tests/dev_server.mjs 8140
import sys
from playwright.sync_api import sync_playwright
B="http://localhost:8140"; fails=[]
def check(c,m):
    print(("  ok  " if c else "  GAGAL ")+m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1200,"height":800}); stub=open("tests/supabase_client_stub.js").read()
    ctx.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub))
    pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(B+"/admin/"); pg.wait_for_selector("#login:not([hidden])")
    check(True,"halaman login tampil")
    pg.fill("#em","owner@x.id"); pg.fill("#pw","salah-salah"); pg.click("#loginBtn"); pg.wait_for_timeout(600)
    check("salah" in pg.inner_text("#loginErr"),"kata sandi salah -> pesan galat")
    # admin umum
    pg.fill("#em","admin@x.id"); pg.fill("#pw","adminpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])")
    t=pg.inner_text("#nav"); check("Pengguna" not in t,"admin umum: tidak ada menu Pengguna"); check("Section & teks" not in t,"admin umum: tidak ada menu Tampilan")
    pg.wait_for_selector("#stats .stat"); check(pg.inner_text("#stats").count("\n")>=3 and "3" in pg.inner_text("#stats"),"ringkasan menampilkan hitungan")
    pg.goto(B+"/admin/#/pengguna"); pg.wait_for_timeout(500); check("Tambah pengguna" not in pg.inner_text("#view"),"admin umum dialihkan dari #/pengguna")
    pg.click("#logout"); pg.wait_for_selector("#login:not([hidden])"); check(True,"logout")
    # owner
    pg.fill("#em","owner@x.id"); pg.fill("#pw","ownerpass123"); pg.click("#loginBtn"); pg.wait_for_selector("#app:not([hidden])")
    check("Pengguna" in pg.inner_text("#nav") and "Section & teks" in pg.inner_text("#nav"),"owner: menu lengkap")
    pg.click("#nav a[href='#/pengguna']"); pg.wait_for_selector("#ub tr td:nth-child(2)")
    check("Admin Satu" in pg.inner_text("#ub"),"owner melihat daftar pengguna")
    pg.fill("#ue","baru@x.id"); pg.fill("#un","Admin Dua"); pg.click("#gen"); pw=pg.input_value("#up"); check(len(pw)==16,"tombol kata sandi acak")
    pg.click("#add"); pg.wait_for_timeout(700); check("Admin Dua" in pg.inner_text("#ub"),"pengguna baru muncul di daftar")
    pg.fill("#ue","x@x.id"); pg.fill("#un","Z"); pg.fill("#up","pendek"); pg.click("#add"); pg.wait_for_timeout(500); check("Nama minimal" in pg.inner_text("#ufe"),"validasi server ditampilkan")
    pg.on("dialog",lambda d:d.accept())
    pg.click("button[data-a=toggle][data-id='22222222-2222-2222-2222-222222222222']"); pg.wait_for_timeout(600); check("Nonaktif" in pg.inner_text("#ub"),"nonaktifkan admin")
    check(pg.locator("button[data-a=del][data-id='11111111-1111-1111-1111-111111111111']").count()==0,"owner tidak punya tombol hapus untuk dirinya sendiri")
    pg.click("#nav a[href='#/akun']"); pg.fill("#np","abc"); pg.fill("#np2","abc"); pg.click("#npb"); check("Minimal 10" in pg.inner_text("#npe"),"validasi kata sandi baru")
    # mobile
    mc=b.new_context(viewport={"width":375,"height":700}); mc.route("**/cdn.jsdelivr.net/**",lambda r:r.fulfill(status=200,content_type="text/javascript",body=stub)); m=mc.new_page(); m.goto(B+"/admin/"); m.wait_for_selector("#login:not([hidden])")
    check(m.evaluate("document.documentElement.scrollWidth<=innerWidth"),"login tidak meluap di 375px")
    m.fill("#em","owner@x.id"); m.fill("#pw","ownerpass123"); m.click("#loginBtn"); m.wait_for_selector("#app:not([hidden])")
    check(m.is_visible("#menuBtn"),"tombol menu muncul di HP"); m.click("#menuBtn"); m.wait_for_timeout(350); check("open" in m.get_attribute("#side","class"),"menu samping terbuka")
    m.goto(B+"/admin/#/pengguna"); m.wait_for_timeout(700); check(m.evaluate("document.documentElement.scrollWidth<=innerWidth"),"halaman pengguna tidak meluap di 375px")
    # beranda
    h=b.new_page(); h.goto(B+"/"); h.wait_for_timeout(800); check(h.is_visible("#wa"),"beranda membaca pengaturan dari API (tombol WhatsApp)")
    check(not errs,"tanpa galat JS: "+str(errs[:2])); b.close()
print("\nGAGAL:",fails) if fails else print("\nSEMUA TES E2E LULUS"); sys.exit(1 if fails else 0)
