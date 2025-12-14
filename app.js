/* ---------- Traits UI (radios are the first 72 <input> in the form) ---------- */
function buildTraits(){
  var labels = Array.isArray(TRAIT_LABELS) ? TRAIT_LABELS : [];
  var grid = document.getElementById('traitsGrid');
  if(!grid) return;

  var html = [];
  for (var g = 0; g < 24; g++){
    var base = g*3;
    var left = labels[base], mid = labels[base+1], right = labels[base+2];

    html.push('<div class="traitRow">');
    html.push('  <div class="pillRow">');
    html.push('    <label class="pill"><input type="radio" name="c-'+g+'" onclick="cw_analyze();" />' + left + '</label>');
    html.push('    <label class="pill is-on"><input type="radio" name="c-'+g+'" onclick="cw_analyze();" checked />' + mid + '</label>');
    html.push('    <label class="pill"><input type="radio" name="c-'+g+'" onclick="cw_analyze();" />' + right + '</label>');
    html.push('  </div>');
    html.push('</div>');
  }
  grid.innerHTML = html.join('');

  // Visual active pill
  grid.addEventListener('click', function(e){
    var t = e.target;
    while (t && t !== grid && !(t.tagName && t.tagName.toLowerCase() === 'label')) t = t.parentNode;
    if (!t || t === grid) return;
    var input = t.querySelector('input[type="radio"]');
    if(!input) return;
    var name = input.name;
    var group = grid.querySelectorAll('input[name="'+name+'"]');
    for (var i=0;i<group.length;i++){
      var lab = group[i].closest('label');
      if(lab) lab.classList.remove('is-on');
    }
    t.classList.add('is-on');
  });
}

/* ---------- Output sizing + Charts + Tabs ---------- */
function fmtSigned(n){
  var s = (n > 0 ? '+' : '') + (Math.round(n*10)/10);
  return s.replace(/\.0$/, '');
}
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

function fitOutputArea(){
  // Only matters in Text mode (textarea fills available height)
  var panel = document.getElementById('out-text');
  var form = document.getElementById('cwForm');
  if(!panel || !form) return;
  if(!panel.classList.contains('is-active')) return;
  var ta = form['output'];
  if(!ta) return;

  // panel padding is handled by wrapper; keep textarea at 100%
  ta.style.height = '100%';
}

/* ---------- Radar chart (dual values) ---------- */
function poly(ctx, pts){
  ctx.beginPath();
  for (var i=0;i<pts.length;i++){
    var p = pts[i];
    if(i===0) ctx.moveTo(p[0], p[1]);
    else ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
}
function drawRadarDual(raw, adj, labels, overrideMask){
  var c = document.getElementById('radar');
  if(!c) return;

  // visible sizing: use container width/height
  var wrap = c.parentElement;
  var w = wrap ? wrap.clientWidth : 0;
  var h = wrap ? wrap.clientHeight : 0;
  if(w < 10 || h < 10) return;

  // device pixel ratio
  var dpr = window.devicePixelRatio || 1;
  c.width = Math.floor(w * dpr);
  c.height = Math.floor(h * dpr);
  c.style.width = w + 'px';
  c.style.height = h + 'px';

  var ctx = c.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);

  var cx = w/2, cy = h/2;
  var r = Math.min(w,h) * 0.387;
  var spokes = labels.length;

  // background
  ctx.clearRect(0,0,w,h);

  // grid rings (1..12)
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(17,24,39,.08)';
  for (var k=1;k<=4;k++){
    var rr = r * (k/4);
    var pts = [];
    for (var i=0;i<spokes;i++){
      var a = (-Math.PI/2) + (i/spokes) * Math.PI*2;
      pts.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]);
    }
    poly(ctx, pts);
    ctx.stroke();
  }

  // spokes
  ctx.strokeStyle = 'rgba(17,24,39,.06)';
  for (var i=0;i<spokes;i++){
    var a = (-Math.PI/2) + (i/spokes) * Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    ctx.stroke();
  }

  // label text (integrated values)
  var baseCol = '#111827';
  var ovCol = '#6366f1';
  ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
  ctx.textBaseline = 'middle';
  // labels are rendered as HTML controls (see .radarOverlay)
  function toPts(vals){
    var pts = [];
    for (var i=0;i<spokes;i++){
      var v = clamp(vals[i], 1, 12);
      var rr = r * ((v-1)/(12-1));
      var a = (-Math.PI/2) + (i/spokes) * Math.PI*2;
      pts.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]);
    }
    return pts;
  }

  // raw polygon (thin, light)
  var pr = toPts(raw);
  ctx.fillStyle = 'rgba(99,102,241,.10)';
  ctx.strokeStyle = 'rgba(99,102,241,.20)';
  ctx.lineWidth = 2;
  poly(ctx, pr);
  ctx.fill();
  ctx.stroke();

  // adj polygon (bold, darker)
  var pa = toPts(adj);
  ctx.fillStyle = 'rgba(17,24,39,.12)';
  ctx.strokeStyle = 'rgba(17,24,39,.40)';
  ctx.lineWidth = 2.5;
  poly(ctx, pa);
  ctx.fill();
  ctx.stroke();
}

function renderRadarLegend(raw, adj, labels){
  var el = document.getElementById('radarLegend');
  if(!el) return;
  var html = [];
  for (var i=0;i<labels.length;i++){
    var r = raw[i], a = adj[i];
    html.push('<span class="lgItem"><span class="lgK">'+labels[i]+'</span> <span class="rawNum">'+r+'</span><span class="adjNum">'+a+'</span></span>');
  }
  el.innerHTML = html.join('');
}

/* ---------- Bipolar bars (dual values) ---------- */
function renderBipolarDual(items){
  var host = document.getElementById('bipolar');
  if(!host) return;

  var man = window.__inlineManual || (window.__inlineManual = {});
  var ov = window.__inlineOverride || (window.__inlineOverride = {});

  host.innerHTML = '';

  items.forEach(function(it){
    var row = document.createElement('div');
    row.className = 'biRow';

    var l = document.createElement('div');
    l.className = 'biL';
    l.textContent = it.l;

    var r = document.createElement('div');
    r.className = 'biR';
    r.textContent = it.r;

    var trackWrap = document.createElement('div');
    trackWrap.className = 'biTrackWrap';

    var track = document.createElement('div');
    track.className = 'biTrack';

    var mid = document.createElement('div');
    mid.className = 'biMid';

    var rawFill = document.createElement('div');
    rawFill.className = 'biFill raw';
    var adjFill = document.createElement('div');
    adjFill.className = 'biFill adj';

    // Fill widths relative to [-4, +4]
    var raw = Number(it.raw || 0);
    var adj = Number(it.adj || 0);

    function setFill(fillEl, v){
      v = Math.max(-4, Math.min(4, v));
      if(v >= 0){
        fillEl.classList.remove('neg'); fillEl.classList.add('pos');
        fillEl.style.width = (v/4*50) + '%';
      }else{
        fillEl.classList.remove('pos'); fillEl.classList.add('neg');
        fillEl.style.width = (Math.abs(v)/4*50) + '%';
      }
    }
    setFill(rawFill, raw);
    setFill(adjFill, adj);

    track.appendChild(rawFill);
    track.appendChild(adjFill);
    track.appendChild(mid);

    // Slider overlay (controls adj)
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = -4; slider.max = 4; slider.step = 1;
    slider.className = 'biSlider';
    slider.setAttribute('data-idx', String(it.idx));
    slider.value = String(adj);
    slider.setAttribute('aria-label', it.l + ' ↔ ' + it.r);

    // Mark manual state on focus interaction
    slider.addEventListener('input', function(){
      var idx = parseInt(slider.getAttribute('data-idx') || '', 10);
      if(!isFinite(idx)) return;
      man[idx] = true;
      ov[idx] = parseInt(slider.value, 10);
      // live update fill for responsiveness
      setFill(adjFill, Number(slider.value));
      // also recalc dependent outputs
      cw_analyze();
    });

    track.appendChild(slider);
    trackWrap.appendChild(track);

    row.appendChild(l);
    row.appendChild(trackWrap);
    row.appendChild(r);

    host.appendChild(row);
  });
}

/* ---------- Output mode tabs (チャート / テキスト) ---------- */
function setOutputMode(mode){
  var btns = document.querySelectorAll('.outTab');
  for (var i=0;i<btns.length;i++){
    btns[i].classList.toggle('is-active', btns[i].getAttribute('data-out') === mode);
  }
  var charts = document.getElementById('out-charts');
  var text = document.getElementById('out-text');
  if(charts) charts.classList.toggle('is-active', mode === 'charts');
  if(text) text.classList.toggle('is-active', mode === 'text');

  // sizing + redraw
  setTimeout(function(){
    fitOutputArea();
    drawActiveViz();
  }, 0);
}
function initOutputTabs(){
  var btns = document.querySelectorAll('.outTab');
  for (var i=0;i<btns.length;i++){
    btns[i].addEventListener('click', function(){
      setOutputMode(this.getAttribute('data-out'));
    });
  }
}

/* ---------- Main tabs (基本設定 / プロフィール) ---------- */
function setMainTab(which){
  var btns = document.querySelectorAll('.topTab');
  for (var i=0;i<btns.length;i++){
    btns[i].classList.toggle('is-active', btns[i].getAttribute('data-main') === which);
  }
  var basic = document.getElementById('main-basic');
  var profile = document.getElementById('main-profile');
  if(basic) basic.classList.toggle('is-active', which === 'basic');
  if(profile) profile.classList.toggle('is-active', which === 'profile');

  setTimeout(function(){
    fitOutputArea();
    drawActiveViz();
  }, 0);
}
function initMainTabs(){
  var btns = document.querySelectorAll('.topTab');
  for (var i=0;i<btns.length;i++){
    btns[i].addEventListener('click', function(){
      setMainTab(this.getAttribute('data-main'));
    });
  }
}

/* ---------- Override panel ---------- */
function toggleOverridePanel(force){
  var panel = document.getElementById('overridePanel');
  var btn = document.getElementById('overrideBtn');
  if(!panel || !btn) return;

  var on = (typeof force === 'boolean') ? force : !panel.classList.contains('is-on');
  panel.classList.toggle('is-on', on);
  panel.setAttribute('aria-hidden', on ? 'false' : 'true');
  btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  btn.classList.toggle('is-active', on);

  if(on){
    var first = panel.querySelector('.ovInput');
    if(first) first.focus();
  }
}
function resetOverrides(){
  var inputs = document.querySelectorAll('.ovInput');
  for (var i=0;i<inputs.length;i++){
    inputs[i].value = '';
  }
  if(typeof cw_analyze === 'function') cw_analyze();
}
function applyManualOverrides(autoActual, actual){
  // Seamless inline overrides (no separate panel)
  window.__overrideIdx = window.__overrideIdx || {};
  for (var k in window.__overrideIdx) { if(Object.prototype.hasOwnProperty.call(window.__overrideIdx,k)) delete window.__overrideIdx[k]; }

  var ov = window.__inlineOverride || (window.__inlineOverride = {});
  var man = window.__inlineManual || (window.__inlineManual = {});

  // Apply only the indices currently marked as manual
  for (var key in man){
    if(!Object.prototype.hasOwnProperty.call(man, key)) continue;
    if(!man[key]) continue;
    var idx = parseInt(key, 10);
    if(!isFinite(idx)) continue;
    var v = ov[idx];
    if(v === null || v === undefined) continue;
    var n = parseInt(v, 10);
    if(!isFinite(n)) continue;

    // Clamp per domain
    if(idx >= 2 && idx <= 7){
      n = Math.max(1, Math.min(12, n));
    }else if(idx >= 8 && idx <= 12){
      n = Math.max(-4, Math.min(4, n));
    }else{
      continue;
    }
    actual[idx] = n;
    window.__overrideIdx[idx] = true;
  }

  // Sync physical spinners (always exist in DOM)
  var spins = document.querySelectorAll('.statSpin');
  spins.forEach(function(inp){
    var idx = parseInt(inp.getAttribute('data-idx') || '', 10);
    if(!isFinite(idx)) return;
    if(man[idx]){
      // keep manual value
      var v = ov[idx];
      if(v === null || v === undefined || v === '') v = actual[idx];
      inp.value = v;
    }else{
      inp.value = autoActual[idx];
    }
  });
}

function renderStamina(minHp, maxHp){
  var row = document.getElementById('staminaRow');
  var hearts = document.getElementById('staminaHearts');
  var range = document.getElementById('staminaRange');
  if(!row || !hearts || !range) return;

  // Heart count is based on max stamina (10pt per heart), capped at 14.
  var filled = Math.max(0, Math.min(14, Math.floor((maxHp || 0) / 10)));
  var total = 14;

  var out = [];
  for(var i=0;i<total;i++){
    out.push('<span class="h ' + (i < filled ? 'full' : 'empty') + '">' + (i < filled ? '♥' : '♡') + '</span>');
  }
  hearts.innerHTML = out.join('');

  // Range in parentheses
  if(typeof minHp === 'number' && typeof maxHp === 'number'){
    range.innerHTML = '（' + minHp + '-' + '<span class="hpMax">' + maxHp + '</span>' + '）';
  }else{
    range.textContent = '';
  }

  // Outlier styling
  row.classList.toggle('is-outlier', (maxHp || 0) > 150);
}

function initOverrides(){
  var btn = document.getElementById('overrideBtn');
  var closeBtn = document.getElementById('overrideCloseBtn');
  var resetBtn = document.getElementById('overrideResetBtn');
  var panel = document.getElementById('overridePanel');

  if(btn) btn.addEventListener('click', function(){ toggleOverridePanel(); });
  if(closeBtn) closeBtn.addEventListener('click', function(){ toggleOverridePanel(false); });
  if(resetBtn) resetBtn.addEventListener('click', resetOverrides);

  if(panel){
    var inputs = panel.querySelectorAll('.ovInput');
    for (var i=0;i<inputs.length;i++){
      inputs[i].addEventListener('focus', function(e){
        var inp = e.target;
        var raw = (inp.value || '').trim();
        if(raw.length) return;

        var auto = inp.dataset.autoval || inp.placeholder || '';
        if(auto.length){
          inp.value = auto;
          inp.dataset.tempfill = '1';
          setTimeout(function(){ try{ inp.select(); }catch(_e){} }, 0);
        }
      });

      inputs[i].addEventListener('blur', function(e){
        var inp = e.target;
        if(inp.dataset.tempfill !== '1') return;

        var auto = inp.dataset.autoval || inp.placeholder || '';
        var raw = (inp.value || '').trim();

        if(auto.length && raw === String(auto)){
          inp.value = '';
          inp.dataset.tempfill = '';
          if(typeof cw_analyze === 'function') cw_analyze();
        }else{
          inp.dataset.tempfill = '';
        }
      });

      inputs[i].addEventListener('input', function(){
        if(typeof cw_analyze === 'function') cw_analyze();
      });
    }

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && panel.classList.contains('is-on')){
        toggleOverridePanel(false);
      }
    });
  }
}

/* ---------- Draw charts only when visible ---------- */
function drawActiveViz(){
  var charts = document.getElementById('out-charts');
  var basic = document.getElementById('main-basic');
  if(!charts || !basic) return;
  if(!charts.classList.contains('is-active')) return;
  if(!basic.classList.contains('is-active')) return;

  if(window.__lastRadarRaw && window.__lastRadarAdj){
    drawRadarDual(window.__lastRadarRaw, window.__lastRadarAdj, window.__lastRadarLabels || ['Dex','Agi','Int','Str','Vit','Will'], window.__lastRadarOverride || null);
  }
}

/* ---------- Profile image ---------- */
function initProfile(){
  var inp = document.getElementById('profileImgInput');
  var pick = document.getElementById('profileImgPick');
  var clear = document.getElementById('profileImgClear');
  var img = document.getElementById('profileImg');
  var ph = document.getElementById('profileImgPh');
  var hidden = document.getElementById('profileImgData');

  if(pick && inp){
    pick.addEventListener('click', function(){ inp.click(); });
  }
  if(clear){
    clear.addEventListener('click', function(){
      if(inp) inp.value = '';
      if(img){ img.src = ''; img.classList.remove('is-on'); }
      if(ph) ph.style.display = 'flex';
      if(hidden) hidden.value = '';
    });
  }
  if(inp && img){
    inp.addEventListener('change', function(){
      var file = inp.files && inp.files[0];
      if(!file) return;
      var fr = new FileReader();
      fr.onload = function(){
        img.src = String(fr.result || '');
        img.classList.add('is-on');
        if(ph) ph.style.display = 'none';
        if(hidden) hidden.value = img.src;
      };
      fr.readAsDataURL(file);
    });
  }
}

window.addEventListener('resize', function(){
  fitOutputArea();
  drawActiveViz();
});


function updateRadarOverlay(autoActual, actual){
  var man = window.__inlineManual || (window.__inlineManual = {});
  var ov = window.__inlineOverride || (window.__inlineOverride = {});

  var map = [
    {idx:2, spinId:'spinDex'},
    {idx:3, spinId:'spinAgi'},
    {idx:4, spinId:'spinInt'},
    {idx:5, spinId:'spinStr'},
    {idx:6, spinId:'spinVit'},
    {idx:7, spinId:'spinWill'}
  ];

  map.forEach(function(it){
    var sp = document.getElementById(it.spinId);
    if(!sp) return;

    // Keep override value sensible even if manual flag is off
    if(!man[it.idx]){
      ov[it.idx] = autoActual[it.idx];
    }
    var val = man[it.idx] ? ov[it.idx] : autoActual[it.idx];

    sp.value = String(val);

    var ctl = sp.closest('.statCtl');
    if(ctl) ctl.classList.toggle('is-manual', !!man[it.idx]);
    sp.classList.toggle('is-manual', !!man[it.idx]);
  });
}

function initInlineManual(){
  window.__inlineManual = window.__inlineManual || {};
  window.__inlineOverride = window.__inlineOverride || {};

  // Physical spinners
  var spins = document.querySelectorAll('.statSpin');
  spins.forEach(function(inp){
    var idx = parseInt(inp.getAttribute('data-idx') || '', 10);
    if(!isFinite(idx)) return;

    // Avoid browser restoring stale values
    inp.value = inp.value || '';

    function handleSpin(){
      var v = parseInt(inp.value, 10);
      if(!isFinite(v)) return;
      window.__inlineManual[idx] = true;
      window.__inlineOverride[idx] = v;
      cw_analyze();
    }
    inp.addEventListener('input', handleSpin);
    inp.addEventListener('change', handleSpin);
  });

  // Reset buttons
  var btnP = document.getElementById('resetPhysicalBtn');
  if(btnP){
    btnP.addEventListener('click', function(){
      for(var i=2;i<=7;i++){
        delete window.__inlineManual[i];
        delete window.__inlineOverride[i];
      }
      cw_analyze();
    });
  }
  var btnM = document.getElementById('resetMentalBtn');
  if(btnM){
    btnM.addEventListener('click', function(){
      for(var i=8;i<=12;i++){
        delete window.__inlineManual[i];
        delete window.__inlineOverride[i];
      }
      cw_analyze();
    });
  }
}

function flashCopyToast(){
  var t = document.getElementById('copyToast');
  if(!t) return;
  t.classList.add('is-on');
  clearTimeout(window.__copyToastTimer);
  window.__copyToastTimer = setTimeout(function(){
    t.classList.remove('is-on');
  }, 1400);
}

function resetTraitsSelection(){
  for (var g=0; g<24; g++){
    var inputs = document.querySelectorAll('input[name="c-'+g+'"]');
    if(!inputs || inputs.length < 2) continue;

    // 0:left, 1:none, 2:right
    inputs[1].checked = true;

    // update pill highlight
    for (var i=0;i<inputs.length;i++){
      var lab = inputs[i].closest('label');
      if(lab) lab.classList.remove('is-on');
    }
    var midLab = inputs[1].closest('label');
    if(midLab) midLab.classList.add('is-on');
  }
  if (typeof cw_analyze === 'function') cw_analyze();
}

function initCopyButton(){
  var copyBtn = document.getElementById('copyBtn');
  if(!copyBtn) return;
  copyBtn.addEventListener('click', async function(){
    var form = document.getElementById('cwForm');
    if(!form) return;
    var ta = form['output'];
    if(!ta) return;

    var text = ta.value || '';

    // Prefer modern Clipboard API (no selection). Works in secure contexts (https/localhost).
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
        flashCopyToast();
        return;
      }
    }catch(e){ /* fall through */ }

    // Fallback: execCommand requires selection. We'll copy, then immediately clear selection.
    var prev = document.activeElement;
    try{
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      // collapse selection and remove focus so the highlight disappears
      ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.blur();
      if(prev && prev.focus) prev.focus();
      // clear any remaining selection in the page
      if(window.getSelection) window.getSelection().removeAllRanges();
      if(ok) flashCopyToast();
    }catch(e){
      // do nothing
    }
  });
}

function initTraitsReset(){
  var btn = document.getElementById('resetTraitsBtn');
  if(btn){
    btn.addEventListener('click', resetTraitsSelection);
  }
}

function initializeUI(){
  buildTraits();
  initMainTabs();
  initOutputTabs();
  initProfile();
  initOverrides();
  initInlineManual();
  initCopyButton();
  initTraitsReset();

  // defaults
  setMainTab('basic');
  setOutputMode('charts');
  fitOutputArea();
  drawActiveViz();

  cw_analyze();
}

document.addEventListener('DOMContentLoaded', initializeUI);
