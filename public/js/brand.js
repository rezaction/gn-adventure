/* GoNEST — teks kecil di bawah logo disesuaikan lebarnya agar sejajar dengan "GoNEST".
   Panjang teks bebas (diubah dari admin): jarak huruf dilonggarkan/dirapatkan dulu,
   dan bila masih tidak muat, ukuran hurufnya dikecilkan (sampai batas keterbacaan). */
(function () {
  var MIN_PX = 8.5;                    // jangan lebih kecil dari ini agar tetap terbaca
  function fit(brand) {
    var name = brand.querySelector('.brand__name'), tag = brand.querySelector('.brand__tag');
    if (!name || !tag) return;
    tag.style.whiteSpace = ''; tag.style.maxWidth = ''; tag.style.lineHeight = '';
    tag.style.letterSpacing = '0'; tag.style.fontSize = ''; tag.style.marginRight = '0';
    var target = name.getBoundingClientRect().width;
    if (!target) return;
    var n = Math.max((tag.textContent || '').length, 2);
    var natural = tag.getBoundingClientRect().width;
    var size = parseFloat(getComputedStyle(tag).fontSize);
    while (natural > target && size > MIN_PX) {          // terlalu lebar: kecilkan sedikit demi sedikit
      size -= 0.25; tag.style.fontSize = size + 'px'; natural = tag.getBoundingClientRect().width;
    }
    if (natural > target + 0.5) {                        // masih terlalu panjang: biarkan turun ke baris kedua
      tag.style.whiteSpace = 'normal'; tag.style.maxWidth = target + 'px'; tag.style.letterSpacing = '0.06em'; tag.style.lineHeight = '1.25';
      return;
    }
    tag.style.whiteSpace = ''; tag.style.maxWidth = ''; tag.style.lineHeight = '';
    var ls = (target - natural) / n;                      // sisa lebar dibagi rata antar huruf
    ls = Math.min(ls, size * 0.42);                       // jangan terlalu renggang
    tag.style.letterSpacing = ls + 'px';
    tag.style.marginRight = (-ls) + 'px';                 // huruf terakhir tidak menambah lebar
  }
  function run(root) { [].forEach.call((root || document).querySelectorAll('.brand'), fit); }
  window.GoNEST = window.GoNEST || {}; window.GoNEST.fitBrand = run;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { run(); });
  document.addEventListener('DOMContentLoaded', function () { run(); });
  var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { run(); }, 120); });
})();
