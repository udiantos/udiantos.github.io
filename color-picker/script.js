(function(){
  const $ = id => document.getElementById(id);
  const dropzone = $('dropzone'), fileInput = $('fileInput'), editor = $('editor');
  const canvas = $('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
  const wrap = $('canvasWrap'), marker = $('marker');
  const MAX_DIM = 1600;
  let history = [];

  // ---- Konversi warna ----
  const hex = (r,g,b) => '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
  function hsl(r,g,b){
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d){
      s = d / (1 - Math.abs(2*l - 1));
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = Math.round(h * 60); if (h < 0) h += 360;
    }
    return `hsl(${h}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`;
  }

  // ---- Tampilkan warna terpilih ----
  function show(r,g,b, save){
    const h = hex(r,g,b);
    $('pickedSwatch').style.background = h;
    $('pickedName').textContent = h;
    $('vHex').textContent = h;
    $('vRgb').textContent = `rgb(${r}, ${g}, ${b})`;
    $('vHsl').textContent = hsl(r,g,b);
    if (save) addHistory(h);
  }

  function chips(el, list){
    el.innerHTML = '';
    list.forEach(c => {
      const b = document.createElement('button');
      b.className = 'pal-chip'; b.style.background = c; b.title = c;
      b.addEventListener('click', () => {
        const n = parseInt(c.slice(1), 16);
        show(n >> 16, (n >> 8) & 255, n & 255, true);
        marker.style.display = 'none';
        copy(c);
      });
      el.appendChild(b);
    });
  }

  function addHistory(h){
    history = [h].concat(history.filter(x => x !== h)).slice(0, 12);
    chips($('history'), history);
    $('histEmpty').hidden = history.length > 0;
  }

  // ---- Ambil piksel dari kanvas ----
  function pick(e, save){
    const rect = canvas.getBoundingClientRect();
    const px = Math.min(Math.max(e.clientX - rect.left, 0), rect.width - 1);
    const py = Math.min(Math.max(e.clientY - rect.top, 0), rect.height - 1);
    const x = Math.floor(px / rect.width * canvas.width);
    const y = Math.floor(py / rect.height * canvas.height);
    const d = ctx.getImageData(x, y, 1, 1).data;
    marker.style.left = px + 'px'; marker.style.top = py + 'px'; marker.style.display = 'block';
    show(d[0], d[1], d[2], save);
  }
  let dragging = false;
  wrap.addEventListener('pointerdown', e => { dragging = true; wrap.setPointerCapture(e.pointerId); pick(e, false); });
  wrap.addEventListener('pointermove', e => { if (dragging) pick(e, false); });
  wrap.addEventListener('pointerup', e => { dragging = false; pick(e, true); });
  wrap.addEventListener('pointercancel', () => { dragging = false; });

  // ---- Palet dominan: kuantisasi 4-bit per kanal, lalu pilih yang berjauhan ----
  function dominant(n){
    const s = 96, c = document.createElement('canvas');
    const k = Math.min(1, s / Math.max(canvas.width, canvas.height));
    c.width = Math.max(1, Math.round(canvas.width * k)); c.height = Math.max(1, Math.round(canvas.height * k));
    const cx = c.getContext('2d'); cx.drawImage(canvas, 0, 0, c.width, c.height);
    const data = cx.getImageData(0, 0, c.width, c.height).data, bins = {};
    for (let i = 0; i < data.length; i += 4){
      if (data[i+3] < 128) continue;
      const key = (data[i] >> 4) << 8 | (data[i+1] >> 4) << 4 | (data[i+2] >> 4);
      const b = bins[key] || (bins[key] = { n:0, r:0, g:0, b:0 });
      b.n++; b.r += data[i]; b.g += data[i+1]; b.b += data[i+2];
    }
    const sorted = Object.values(bins).sort((a,b) => b.n - a.n)
      .map(b => [Math.round(b.r/b.n), Math.round(b.g/b.n), Math.round(b.b/b.n)]);
    const out = [];
    for (const c1 of sorted){
      if (out.every(c2 => Math.hypot(c1[0]-c2[0], c1[1]-c2[1], c1[2]-c2[2]) > 48)) out.push(c1);
      if (out.length >= n) break;
    }
    return out.map(c => hex(c[0], c[1], c[2]));
  }

  // ---- Salin ----
  let tt;
  function toast(msg){
    $('toastMsg').textContent = msg; $('toast').classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => $('toast').classList.remove('show'), 1400);
  }
  function copy(text){
    const done = () => toast(text + ' disalin');
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).then(done, () => fallback(text, done));
    } else fallback(text, done);
  }
  function fallback(text, done){
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); done(); } catch(e) { toast('Gagal menyalin'); }
    document.body.removeChild(t);
  }
  document.querySelectorAll('.copy-btn').forEach(b =>
    b.addEventListener('click', () => copy($(b.dataset.copy).textContent)));

  // ---- Muat foto ----
  function load(file){
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, MAX_DIM / Math.max(im.naturalWidth, im.naturalHeight));
      canvas.width = Math.round(im.naturalWidth * k); canvas.height = Math.round(im.naturalHeight * k);
      ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      dropzone.hidden = true; editor.hidden = false; marker.style.display = 'none';
      chips($('palette'), dominant(6));
      const first = $('palette').firstChild;
      if (first){ const n = parseInt(first.title.slice(1), 16); show(n >> 16, (n >> 8) & 255, n & 255, false); }
    };
    im.onerror = () => toast('Foto tidak bisa dibuka');
    im.src = url;
  }
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { load(fileInput.files[0]); fileInput.value = ''; });
  $('changePhotoBtn').addEventListener('click', () => fileInput.click());
  ['dragover','dragenter'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
  dropzone.addEventListener('drop', e => load(e.dataTransfer.files[0]));
})();
