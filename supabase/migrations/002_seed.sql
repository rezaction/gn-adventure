-- GoNEST — data awal (Tahap 1). Semua bisa diubah Owner lewat admin.
-- Nomor, username, dan email di bawah hanyalah contoh. Ganti di Admin > Pengaturan.

insert into public.site_settings(key, value) values
('brand', $j${
  "name":"GoNEST","go":"Go","nest":"NEST",
  "tagline":{"id":"Tour & Transport","en":"Tour & Transport"},
  "logo":"/assets/logo-mark.svg","favicon":"/assets/favicon.svg"
}$j$),
('contact', $j${
  "whatsapp":"6281234567890","telegram":"gonest_id","email":"hello@gonest.example","phone":"+62 812-3456-7890",
  "address":{"id":"Jl. Contoh Raya No. 12, Kota Contoh","en":"12 Contoh Raya St., Contoh City"},
  "hours":{"id":"Setiap hari, 07.00-21.00 WIB","en":"Daily, 07:00-21:00 (WIB)"},
  "instagram":"","maps_url":""
}$j$),
('nav', $j${
  "items":[
    {"label":{"id":"Paket Trip","en":"Trips"},"href":"/packages","visible":true},
    {"label":{"id":"Kendaraan","en":"Vehicles"},"href":"/vehicles","visible":true},
    {"label":{"id":"Destinasi","en":"Destinations"},"href":"/destinations","visible":true},
    {"label":{"id":"Promo","en":"Offers"},"href":"/#promo","visible":true},
    {"label":{"id":"Jurnal","en":"Journal"},"href":"/journal","visible":true},
    {"label":{"id":"Kontak","en":"Contact"},"href":"/contact","visible":true}
  ],
  "cta":{"label":{"id":"Pesan Sekarang","en":"Book Now"},"href":"/booking"}
}$j$),
('footer', $j${
  "about":{"id":"Paket wisata dan layanan transport untuk perjalanan yang rapi, jelas, dan nyaman.","en":"Tours and transport services for trips that are well organised, clear, and comfortable."},
  "columns":[
    {"title":{"id":"Jelajahi","en":"Explore"},"links":[
      {"label":{"id":"Paket Trip","en":"Trips"},"href":"/packages"},
      {"label":{"id":"Kendaraan","en":"Vehicles"},"href":"/vehicles"},
      {"label":{"id":"Destinasi","en":"Destinations"},"href":"/destinations"}]},
    {"title":{"id":"Bantuan","en":"Help"},"links":[
      {"label":{"id":"FAQ","en":"FAQ"},"href":"/faq"},
      {"label":{"id":"Kontak","en":"Contact"},"href":"/contact"},
      {"label":{"id":"Kebijakan","en":"Policies"},"href":"/faq#kebijakan"}]}
  ],
  "copyright":{"id":"Semua hak dilindungi.","en":"All rights reserved."}
}$j$),
('theme', $j${
  "palette":{"golden":"#F9D601","ultramarine":"#3670FF","gray":"#EFEFEF","black":"#171717"},
  "ambient":{"enabled":true,"mode":"auto","intensity":0.6,"tint":true}
}$j$),
('chat', $j${
  "enabled":true,
  "whatsapp":{"enabled":true,"label":{"id":"Chat WhatsApp","en":"Chat on WhatsApp"}},
  "telegram":{"enabled":true,"label":{"id":"Chat Telegram","en":"Chat on Telegram"}}
}$j$),
('promo_popup', $j${
  "enabled":true,"delay_seconds":12,"scroll_percent":40,"once_per_session":true,"snooze_days":3
}$j$),
('seo', $j${
  "site_name":"GoNEST Tour & Transport",
  "default_title":{"id":"GoNEST — Paket Wisata dan Sewa Kendaraan","en":"GoNEST — Tours and Vehicle Rental"},
  "default_description":{"id":"Paket trip, open trip, private tour, dan sewa kendaraan dengan sopir. Pesan mudah lewat WhatsApp atau Telegram.","en":"Trip packages, open trips, private tours, and vehicle hire with driver. Book easily via WhatsApp or Telegram."},
  "og_image":"/assets/og-image.webp"
}$j$)
on conflict (key) do nothing;

insert into public.sections(id, page, kind, sort, fields) values
('home.hero','home','hero',10, $j${
  "eyebrow":{"id":"Tour & transport terpercaya","en":"Trusted tours & transport"},
  "heading":{"id":"Perjalananmu,","en":"Your journey,"},
  "heading2":{"id":"kami yang urus.","en":"we handle it."},
  "description":{"id":"Paket wisata, open trip, dan sewa kendaraan dengan sopir. Harga jelas, jadwal pasti, dan admin yang cepat membalas.","en":"Tour packages, open trips, and vehicle hire with a driver. Clear prices, firm schedules, and an admin who replies fast."},
  "cta1":{"label":{"id":"Lihat Paket Trip","en":"See Trips"},"href":"/packages"},
  "cta2":{"label":{"id":"Cek Kendaraan","en":"Check Vehicles"},"href":"/vehicles"},
  "image":"","image_alt":{"id":"","en":""},
  "image_text":{"id":"","en":""}
}$j$),
('home.trust','home','list',20, $j${
  "eyebrow":{"id":"Kenapa GoNEST","en":"Why GoNEST"},
  "heading":{"id":"Jelas dari awal sampai pulang","en":"Clear from start to finish"},
  "description":{"id":"","en":""},
  "items":[
    {"title":{"id":"Harga transparan","en":"Transparent prices"},"text":{"id":"Yang termasuk dan tidak termasuk tertulis jelas di setiap paket.","en":"What is included and excluded is spelled out on every package."}},
    {"title":{"id":"Armada terawat","en":"Well-kept fleet"},"text":{"id":"Kendaraan bersih, terawat, dengan sopir yang berpengalaman.","en":"Clean, maintained vehicles with experienced drivers."}},
    {"title":{"id":"Admin responsif","en":"Responsive admin"},"text":{"id":"Tanya lewat WhatsApp atau Telegram, dibalas di jam layanan.","en":"Ask via WhatsApp or Telegram and get a reply during service hours."}}
  ]
}$j$),
('home.packages','home','text',30, $j${
  "eyebrow":{"id":"Paket Trip","en":"Trips"},
  "heading":{"id":"Pilih trip yang pas","en":"Pick the right trip"},
  "description":{"id":"Open trip, private, atau keluarga. Semua dengan itinerary dan rincian biaya yang jelas.","en":"Open, private, or family trips, all with clear itineraries and cost details."},
  "cta1":{"label":{"id":"Semua Paket","en":"All Trips"},"href":"/packages"}
}$j$),
('home.vehicles','home','text',40, $j${
  "eyebrow":{"id":"Kendaraan","en":"Vehicles"},
  "heading":{"id":"Armada siap jalan","en":"A fleet ready to roll"},
  "description":{"id":"Cek status ketersediaan dan pilih tanggal perjalananmu.","en":"Check availability and pick your travel dates."},
  "cta1":{"label":{"id":"Lihat Armada","en":"View Fleet"},"href":"/vehicles"}
}$j$),
('home.gallery','home','text',50, $j${
  "eyebrow":{"id":"Galeri","en":"Gallery"},
  "heading":{"id":"Sekilas perjalanan","en":"A glimpse of the road"},
  "description":{"id":"","en":""},
  "cta1":{"label":{"id":"Lihat Semua Foto","en":"See All Photos"},"href":"/destinations"}
}$j$),
('home.journal','home','text',60, $j${
  "eyebrow":{"id":"Jurnal","en":"Journal"},
  "heading":{"id":"Tips sebelum berangkat","en":"Tips before you go"},
  "description":{"id":"","en":""},
  "cta1":{"label":{"id":"Baca Jurnal","en":"Read the Journal"},"href":"/journal"}
}$j$),
('home.cta','home','cta',70, $j${
  "eyebrow":{"id":"Siap berangkat?","en":"Ready to go?"},
  "heading":{"id":"Ceritakan rencanamu.","en":"Tell us your plan."},
  "description":{"id":"Kami bantu susun perjalanan dan kendaraan yang sesuai.","en":"We'll help shape the trip and the right vehicle."},
  "cta1":{"label":{"id":"Pesan Sekarang","en":"Book Now"},"href":"/booking"},
  "cta2":{"label":{"id":"Hubungi Kami","en":"Contact Us"},"href":"/contact"}
}$j$)
on conflict (id) do nothing;
