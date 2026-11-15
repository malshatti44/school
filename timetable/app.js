'use strict';
/* ===================== الحالة والحفظ ===================== */
const KEY = 'school-tt-v1';
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'];
const uid = () => Math.random().toString(36).slice(2, 9);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function blank() {
  return {
    school: { name: '', year: '', region: '', logo: '', periods: 7, startDate: '', grades: [{ g: 6, n: 5 }, { g: 7, n: 5 }, { g: 8, n: 5 }, { g: 9, n: 5 }] },
    subjects: [], teachers: [], assign: {}, cards: [], subs: []
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { S = blank(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('تعذّر الحفظ على الجهاز، صدّر نسخة احتياطية'); } }

const P = () => +S.school.periods || 7;
const classes = () => S.school.grades.flatMap(g => Array.from({ length: +g.n || 0 }, (_, i) => `${g.g}-${i + 1}`));
const gradeOf = c => c.split('-')[0];
const sub = id => S.subjects.find(s => s.id === id);
const tch = id => S.teachers.find(t => t.id === id);
const subShort = id => { const s = sub(id); return s ? (s.short || s.name) : '؟'; };

function toast(m, ms = 3500) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.h); toast.h = setTimeout(() => t.style.display = 'none', ms); }

/* ===================== التبويبات ===================== */
const TABS = [
  ['setup', 'بيانات المدرسة'], ['subjects', 'المواد'], ['teachers', 'المعلمون'], ['assign', 'التوزيع'],
  ['tt', 'الجدول'], ['subs', 'الاحتياط'], ['print', 'الطباعة والمعاينة'], ['backup', 'نسخة احتياطية']
];
let tab = S.school.name ? 'tt' : 'setup';
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${v}</button>`).join('');
  $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } };
}
function header() {
  $('#hTitle').textContent = S.school.name || 'منظم الجدول المدرسي';
  $('#hYear').textContent = S.school.year ? 'العام الدراسي ' + S.school.year : '';
  const l = $('#hLogo'); if (S.school.logo) { l.src = S.school.logo; l.hidden = false; } else l.hidden = true;
}
function render() { renderTabs(); header(); VIEWS[tab](); }
const nextBtn = t => `<div class="row" style="justify-content:flex-end"><button class="btn" onclick="tab='${t}';render()">التالي ←</button></div>`;

/* ===================== 1) بيانات المدرسة ===================== */
const VIEWS = {};
VIEWS.setup = () => {
  const s = S.school;
  $('#main').innerHTML = `
  <div class="card"><h2>بيانات المدرسة</h2>
   <div class="grid">
    <div><label>اسم المدرسة</label><input id="sName" value="${esc(s.name)}"></div>
    <div><label>العام الدراسي</label><input id="sYear" value="${esc(s.year)}" placeholder="2026 / 2027"></div>
    <div><label>المنطقة التعليمية</label><select id="sRegion">${['', 'العاصمة', 'حولي', 'الفروانية', 'الأحمدي', 'الجهراء', 'مبارك الكبير'].map(r => `<option ${r === s.region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
    <div><label>عدد الحصص اليومية</label><input id="sPer" type="number" min="3" max="10" value="${P()}"></div>
    <div><label>يُعمل بالجدول اعتباراً من</label><input id="sStart" type="date" value="${esc(s.startDate)}"></div>
    <div><label>شعار المدرسة</label><input id="sLogo" type="file" accept="image/*">${s.logo ? `<div class="row" style="margin-top:6px"><img src="${s.logo}" style="height:48px"><button class="btn o s" id="rmLogo">حذف الشعار</button></div>` : ''}</div>
   </div></div>
  <div class="card"><h2>الصفوف وعدد الفصول</h2>
   <div class="scroll"><table class="t"><tr><th>الصف</th><th>عدد الفصول</th><th></th></tr>
   ${s.grades.map((g, i) => `<tr><td><input type="number" data-gi="${i}" data-k="g" value="${g.g}" style="width:90px"></td><td><input type="number" min="0" data-gi="${i}" data-k="n" value="${g.n}" style="width:90px"></td><td><button class="btn o s" data-rmg="${i}">حذف</button></td></tr>`).join('')}
   </table></div>
   <div class="row" style="margin-top:8px"><button class="btn o s" id="addG">+ إضافة صف</button><span class="mute">الفصول: ${classes().join('، ') || '—'}</span></div>
  </div>${nextBtn('subjects')}`;
  const bind = (id, k, f = v => v) => $(id).onchange = e => { s[k] = f(e.target.value); save(); header(); };
  bind('#sName', 'name'); bind('#sYear', 'year'); bind('#sRegion', 'region'); bind('#sStart', 'startDate');
  $('#sPer').onchange = e => { s.periods = Math.max(3, Math.min(10, +e.target.value || 7)); S.cards.forEach(c => { if (c.p + c.len > P()) c.d = null; }); save(); render(); };
  $('#sLogo').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 300 / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); s.logo = c.toDataURL('image/png'); save(); render(); }; im.src = r.result; }; r.readAsDataURL(f); };
  if ($('#rmLogo')) $('#rmLogo').onclick = () => { s.logo = ''; save(); render(); };
  $('#main').querySelectorAll('[data-gi]').forEach(i => i.onchange = e => { s.grades[+i.dataset.gi][i.dataset.k] = +e.target.value; save(); render(); });
  $('#main').querySelectorAll('[data-rmg]').forEach(b => b.onclick = () => { s.grades.splice(+b.dataset.rmg, 1); save(); render(); });
  $('#addG').onclick = () => { const last = s.grades[s.grades.length - 1]; s.grades.push({ g: last ? last.g + 1 : 6, n: 1 }); save(); render(); };
};

/* ===================== 2) المواد ===================== */
VIEWS.subjects = () => {
  const total = S.subjects.reduce((a, s) => a + (+s.load || 0), 0), cap = P() * 5;
  $('#main').innerHTML = `
  <div class="card"><h2>المواد الدراسية والنصاب الأسبوعي لكل فصل</h2>
   <div class="row" style="margin-bottom:10px">
     <div style="flex:2;min-width:160px"><label>اسم المادة / القسم</label><input id="nName" placeholder="اللغة العربية"></div>
     <div style="flex:1;min-width:90px"><label>الاختصار في الجدول</label><input id="nShort" placeholder="عربي"></div>
     <div style="width:90px"><label>النصاب</label><input id="nLoad" type="number" min="1" value="4"></div>
     <div><label>&nbsp;</label><label style="display:flex;gap:6px;align-items:center;color:var(--ink)"><input id="nDbl" type="checkbox">حصة مزدوجة</label></div>
     <div><label>&nbsp;</label><button class="btn" id="addS">إضافة</button></div>
   </div>
   <div class="scroll"><table class="t"><tr><th>#</th><th>المادة / القسم</th><th>الاختصار</th><th>النصاب الأسبوعي</th><th>مزدوجة</th><th>تُدرّس للصفوف</th><th></th></tr>
   ${S.subjects.map((s, i) => `<tr><td>${i + 1}</td><td><input data-i="${i}" data-k="name" value="${esc(s.name)}"></td><td><input data-i="${i}" data-k="short" value="${esc(s.short)}" style="width:90px"></td>
     <td><input type="number" data-i="${i}" data-k="load" value="${s.load}" style="width:70px"></td>
     <td><input type="checkbox" data-i="${i}" data-k="double" ${s.double ? 'checked' : ''}></td>
     <td>${S.school.grades.map(g => `<label style="display:inline-flex;gap:3px;color:var(--ink)"><input type="checkbox" data-gr="${i}" value="${g.g}" ${!s.grades || s.grades.includes(+g.g) ? 'checked' : ''}>${g.g}</label>`).join(' ')}</td>
     <td><button class="btn o s" data-up="${i}">↑</button> <button class="btn r s" data-rm="${i}">حذف</button></td></tr>`).join('')}
   </table></div>
   <p class="${total > cap ? 'bad' : 'mute'}">مجموع الحصص للفصل الواحد: ${total} من ${cap} حصة متاحة أسبوعياً${total > cap ? ' — يتجاوز المتاح!' : ''}</p>
   <p class="mute">"مزدوجة": تُوضع حصتان متتاليتان مرة في الأسبوع (مثل الحاسوب والفنية)، والباقي حصص مفردة.</p>
  </div>${nextBtn('teachers')}`;
  $('#addS').onclick = () => {
    const name = $('#nName').value.trim(); if (!name) return toast('اكتب اسم المادة');
    S.subjects.push({ id: uid(), name, short: $('#nShort').value.trim() || name, load: +$('#nLoad').value || 1, double: $('#nDbl').checked, grades: null });
    save(); render(); $('#nName').focus();
  };
  $('#main').querySelectorAll('[data-k]').forEach(i => i.onchange = e => { const s = S.subjects[+i.dataset.i], k = i.dataset.k; s[k] = k === 'double' ? e.target.checked : k === 'load' ? +e.target.value : e.target.value; save(); render(); });
  $('#main').querySelectorAll('[data-gr]').forEach(i => i.onchange = () => { const s = S.subjects[+i.dataset.gr]; s.grades = [...$('#main').querySelectorAll(`[data-gr="${i.dataset.gr}"]:checked`)].map(x => +x.value); save(); });
  $('#main').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (!confirm('حذف المادة؟')) return; const s = S.subjects.splice(+b.dataset.rm, 1)[0]; S.cards = S.cards.filter(c => c.sub !== s.id); save(); render(); });
  $('#main').querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [S.subjects[i - 1], S.subjects[i]] = [S.subjects[i], S.subjects[i - 1]]; save(); render(); } });
};
const subjGrades = s => s.grades || S.school.grades.map(g => +g.g);

/* ===================== 3) المعلمون ===================== */
VIEWS.teachers = () => {
  const gs = S.school.grades.map(g => g.g);
  $('#main').innerHTML = `
  <div class="card"><h2>استيراد من Excel / CSV</h2>
   <div class="row"><button class="btn o" id="tpl">⬇ تحميل نموذج Excel</button><button class="btn o" id="tplCsv">⬇ نموذج CSV</button>
   <label class="btn" style="color:#fff;margin:0">⬆ رفع ملف المعلمين<input type="file" id="imp" accept=".xlsx,.xls,.xlsm,.csv" hidden></label></div>
   <p class="mute">النموذج: اسم المعلم | القسم | ثم عمود لكل صف فيه عدد الفصول التي يدرّسها (مثال: 2 في عمود "صف 6" و 1 في "صف 7"). يمكن أيضاً كتابة فصول محددة مثل 6-1، 6-3.</p>
  </div>
  <div class="card"><h2>المعلمون (${S.teachers.length})</h2>
   <div class="row" style="margin-bottom:10px">
     <div style="flex:2;min-width:180px"><label>اسم المعلم</label><input id="tName"></div>
     <div style="flex:1;min-width:150px"><label>القسم / المادة</label><select id="tSub">${S.subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div>
     ${gs.map(g => `<div style="width:70px"><label>صف ${g}</label><input type="number" min="0" class="tg" data-g="${g}" value="0"></div>`).join('')}
     <div><label>&nbsp;</label><button class="btn" id="addT">إضافة</button></div>
   </div>
   ${!S.subjects.length ? '<p class="warn">أضف المواد أولاً من تبويب المواد.</p>' : ''}
   <div class="scroll"><table class="t"><tr><th>#</th><th>اسم المعلم</th><th>القسم</th>${gs.map(g => `<th>صف ${g}</th>`).join('')}<th>النصاب</th><th></th></tr>
   ${S.subjects.flatMap(s => S.teachers.filter(t => t.sub === s.id)).concat(S.teachers.filter(t => !sub(t.sub))).map((t, i) => {
    const load = S.cards.filter(c => c.teachers.includes(t.id)).reduce((a, c) => a + c.len, 0);
    return `<tr><td>${i + 1}</td><td><input data-t="${t.id}" data-k="name" value="${esc(t.name)}"></td>
     <td><select data-t="${t.id}" data-k="sub">${S.subjects.map(s => `<option value="${s.id}" ${s.id === t.sub ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></td>
     ${gs.map(g => `<td><input type="number" min="0" data-t="${t.id}" data-g="${g}" value="${t.counts[g] || 0}" style="width:60px"></td>`).join('')}
     <td>${load}</td>
     <td class="row" style="justify-content:center"><button class="btn o s" data-av="${t.id}">أوقات غير متاحة${t.unav?.length ? ' (' + t.unav.length + ')' : ''}</button><button class="btn r s" data-rm="${t.id}">حذف</button></td></tr>`;
  }).join('')}
   </table></div></div>${nextBtn('assign')}`;
  $('#addT').onclick = () => {
    const name = $('#tName').value.trim(); if (!name) return toast('اكتب اسم المعلم');
    const counts = {}; document.querySelectorAll('.tg').forEach(i => { if (+i.value) counts[i.dataset.g] = +i.value; });
    S.teachers.push({ id: uid(), name, sub: $('#tSub').value, counts, unav: [] });
    autoAssign(); save(); render(); $('#tName').focus();
  };
  $('#main').querySelectorAll('[data-t]').forEach(i => i.onchange = e => {
    const t = tch(i.dataset.t);
    if (i.dataset.g) t.counts[i.dataset.g] = +e.target.value; else t[i.dataset.k] = e.target.value;
    if (i.dataset.g || i.dataset.k === 'sub') autoAssign();
    save(); render();
  });
  $('#main').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (!confirm('حذف المعلم؟')) return; const id = b.dataset.rm; S.teachers = S.teachers.filter(t => t.id !== id); for (const k in S.assign) S.assign[k] = S.assign[k].filter(x => x !== id); S.cards.forEach(c => c.teachers = c.teachers.filter(x => x !== id)); save(); render(); });
  $('#main').querySelectorAll('[data-av]').forEach(b => b.onclick = () => unavDialog(tch(b.dataset.av)));
  $('#tpl').onclick = () => downloadTemplate('xlsx'); $('#tplCsv').onclick = () => downloadTemplate('csv');
  $('#imp').onchange = e => importTeachers(e.target.files[0]);
};
function unavDialog(t) {
  t.unav = t.unav || [];
  const has = (d, p) => t.unav.includes(d + ':' + p);
  $('#dlgBody').innerHTML = `<h3>الأوقات غير المتاحة: ${esc(t.name)}</h3><p class="mute">اضغط على الحصة لتعليمها غير متاحة.</p>
   <div class="scroll"><table class="t"><tr><th></th>${Array.from({ length: P() }, (_, p) => `<th>${p + 1}</th>`).join('')}</tr>
   ${DAYS.map((d, di) => `<tr><th>${d}</th>${Array.from({ length: P() }, (_, p) => `<td class="${has(di, p) ? 'unav' : ''}" data-dp="${di}:${p}" style="cursor:pointer;height:34px">${has(di, p) ? '✕' : ''}</td>`).join('')}</tr>`).join('')}</table></div>
   <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="dOk">تم</button></div>`;
  $('#dlgBody').querySelectorAll('[data-dp]').forEach(c => c.onclick = () => { const k = c.dataset.dp, i = t.unav.indexOf(k); i < 0 ? t.unav.push(k) : t.unav.splice(i, 1); c.classList.toggle('unav'); c.textContent = i < 0 ? '✕' : ''; save(); });
  $('#dOk').onclick = () => { $('#dlg').close(); render(); };
  $('#dlg').showModal();
}

/* ---------- Excel ---------- */
function downloadTemplate(type) {
  if (!window.XLSX) return toast('مكتبة Excel لم تُحمَّل، تحقق من الاتصال');
  const gs = S.school.grades.map(g => 'صف ' + g.g);
  const head = ['اسم المعلم', 'القسم', ...gs];
  const ex = S.teachers.length ? S.teachers.map(t => [t.name, sub(t.sub)?.name || '', ...S.school.grades.map(g => t.counts[g.g] || '')])
    : [['محمد أحمد', S.subjects[0]?.name || 'اللغة العربية', 2, 1, '', ''], ['خالد سالم', S.subjects[0]?.name || 'اللغة العربية', '', '', 3, 1]];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([head, ...ex]); ws['!cols'] = [{ wch: 30 }, { wch: 20 }, ...gs.map(() => ({ wch: 8 }))];
  ws['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'المعلمين');
  if (type === 'csv') {
    const csv = '﻿' + XLSX.utils.sheet_to_csv(ws);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'نموذج_المعلمين.csv'; a.click(); return;
  }
  const ws2 = XLSX.utils.aoa_to_sheet([['المادة / القسم', 'الاختصار', 'النصاب الأسبوعي', 'مزدوجة (نعم/لا)'], ...S.subjects.map(s => [s.name, s.short, s.load, s.double ? 'نعم' : 'لا'])]);
  ws2['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'المواد');
  XLSX.writeFile(wb, 'نموذج_المعلمين_والمواد.xlsx');
}
async function importTeachers(f) {
  if (!f) return; if (!window.XLSX) return toast('مكتبة Excel لم تُحمَّل');
  let wb;
  if (/\.csv$/i.test(f.name)) wb = XLSX.read(await f.text(), { type: 'string' });
  else wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
  let addedS = 0, addedT = 0;
  const subSheet = wb.SheetNames.find(n => n.includes('المواد'));
  if (subSheet) {
    XLSX.utils.sheet_to_json(wb.Sheets[subSheet], { header: 1 }).slice(1).forEach(r => {
      const name = String(r[0] || '').trim(); if (!name) return;
      let s = S.subjects.find(x => x.name === name);
      if (!s) { s = { id: uid(), name, grades: null }; S.subjects.push(s); addedS++; }
      s.short = String(r[1] || s.short || name).trim(); s.load = +r[2] || s.load || 1; s.double = /نعم|yes|1/i.test(String(r[3] || ''));
    });
  }
  const tSheet = wb.SheetNames.find(n => n.includes('المعلم')) || wb.SheetNames.find(n => n !== subSheet);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[tSheet], { header: 1 });
  const head = (rows[0] || []).map(h => String(h || ''));
  const gcols = head.map((h, i) => { const m = h.match(/(\d+)/); return m && i >= 2 ? [i, m[1]] : null; }).filter(Boolean);
  rows.slice(1).forEach(r => {
    const name = String(r[0] || '').trim(); if (!name) return;
    const sname = String(r[1] || '').trim();
    let s = S.subjects.find(x => x.name === sname || x.short === sname);
    if (!s && sname) { s = { id: uid(), name: sname, short: sname, load: 1, double: false, grades: null }; S.subjects.push(s); addedS++; }
    let t = S.teachers.find(x => x.name === name);
    if (!t) { t = { id: uid(), name, counts: {}, unav: [] }; S.teachers.push(t); addedT++; }
    t.sub = s?.id || t.sub; t.fixed = t.fixed || {};
    gcols.forEach(([i, g]) => {
      const v = String(r[i] ?? '').trim(); if (!v) return;
      if (/\d+-\d+/.test(v)) { const list = v.split(/[،,\s]+/).filter(x => /\d+-\d+/.test(x)); t.counts[g] = list.length; t.fixed[g] = list; }
      else t.counts[g] = +v || 0;
    });
  });
  autoAssign(); save(); render();
  toast(`تم الاستيراد: ${addedT} معلم جديد، ${addedS} مادة جديدة`);
}

/* ===================== 4) التوزيع على الفصول ===================== */
const akey = (c, s) => c + '|' + s;
function autoAssign() {
  // يعيد توزيع الفصول تلقائياً حسب أعداد كل معلم، مع الإبقاء على المعلم الثاني والتعديلات اليدوية المقفلة
  const locked = S.assignLock || (S.assignLock = {});
  for (const s of S.subjects) for (const g of S.school.grades) {
    const cls = Array.from({ length: g.n }, (_, i) => `${g.g}-${i + 1}`);
    const free = cls.filter(c => !locked[akey(c, s.id)]);
    free.forEach(c => { const k = akey(c, s.id); S.assign[k] = (S.assign[k] || []).slice(1); });
    const ts = S.teachers.filter(t => t.sub === s.id && t.counts[g.g] > 0);
    // أولاً الفصول المحددة بالاسم
    for (const t of ts) for (const c of (t.fixed?.[g.g] || [])) if (free.includes(c)) { const k = akey(c, s.id); if (!S.assign[k].length || S.assign[k][0] !== t.id) S.assign[k] = [t.id, ...S.assign[k].filter(x => x !== t.id)]; }
    let ptr = 0;
    for (const t of ts) {
      let need = t.counts[g.g] - free.filter(c => S.assign[akey(c, s.id)][0] === t.id && (t.fixed?.[g.g] || []).includes(c)).length;
      while (need > 0 && ptr < free.length) {
        const k = akey(free[ptr], s.id);
        const taken = S.teachers.some(o => o.sub === s.id && (o.fixed?.[g.g] || []).includes(free[ptr]));
        if (!taken) { S.assign[k] = [t.id, ...S.assign[k].filter(x => x !== t.id)]; need--; }
        ptr++;
      }
    }
  }
  syncCards();
}
function syncCards() {
  // ينشئ بطاقات الحصص من التوزيع مع الحفاظ على أماكن البطاقات الموجودة
  const old = S.cards; const next = [];
  for (const c of classes()) for (const s of S.subjects) {
    if (!subjGrades(s).includes(+gradeOf(c))) continue;
    const teachers = (S.assign[akey(c, s.id)] || []).filter(tch);
    const lens = []; let L = +s.load || 0;
    if (s.double && L >= 2) { lens.push(2); L -= 2; }
    while (L-- > 0) lens.push(1);
    const prev = old.filter(x => x.cls === c && x.sub === s.id);
    lens.forEach(len => {
      const i = prev.findIndex(x => x.len === len);
      const card = i >= 0 ? prev.splice(i, 1)[0] : { id: uid(), cls: c, sub: s.id, len, d: null, p: null, locked: false };
      card.teachers = teachers; next.push(card);
    });
  }
  S.cards = next;
}
VIEWS.assign = () => {
  const cl = classes();
  const prob = [];
  $('#main').innerHTML = `<div class="card"><h2>توزيع المعلمين على الفصول</h2>
   <p class="mute">يُوزَّع تلقائياً حسب أعداد كل معلم. يمكنك تغيير المعلم أو إضافة <b>معلم ثانٍ لنفس الفصل</b> (حصة مشتركة). التعديل اليدوي يُقفل الخانة 🔒 فلا يغيّرها التوزيع التلقائي.</p>
   <div class="row" style="margin-bottom:8px"><button class="btn o s" id="reAuto">إعادة التوزيع التلقائي (للخانات غير المقفلة)</button><button class="btn o s" id="unlockAll">فك قفل الكل</button></div>
   <div class="scroll"><table class="t"><tr><th>المادة</th>${cl.map(c => `<th>${c}</th>`).join('')}</tr>
   ${S.subjects.map(s => `<tr><th>${esc(s.short || s.name)}</th>${cl.map(c => {
    if (!subjGrades(s).includes(+gradeOf(c))) return '<td class="mute">—</td>';
    const a = S.assign[akey(c, s.id)] || []; if (!a.length) prob.push(`${s.name} ${c}`);
    const lk = S.assignLock?.[akey(c, s.id)];
    return `<td style="min-width:110px;${a.length ? '' : 'background:rgba(181,71,8,.12)'}" data-a="${c}|${s.id}">${a.map(id => `<div style="font-size:12px">${esc(tch(id)?.name || '')}</div>`).join('') || '<span class="warn">بدون معلم</span>'}${lk ? ' 🔒' : ''}</td>`;
  }).join('')}</tr>`).join('')}
   </table></div>
   ${prob.length ? `<p class="warn">⚠ ${prob.length} خانة بدون معلم</p>` : '<p class="ok">✓ كل الفصول لها معلمون</p>'}
   ${S.teachers.map(t => { const n = Object.values(S.assign).filter(a => a.includes(t.id)).length, want = Object.values(t.counts).reduce((a, b) => a + (+b || 0), 0); return n < want ? `<div class="warn mute">${esc(t.name)}: مطلوب ${want} فصل، وُزّع ${n} فقط (لا توجد فصول كافية)</div>` : ''; }).join('')}
  </div>${nextBtn('tt')}`;
  $('#reAuto').onclick = () => { autoAssign(); save(); render(); toast('تم التوزيع'); };
  $('#unlockAll').onclick = () => { S.assignLock = {}; autoAssign(); save(); render(); };
  $('#main').querySelectorAll('[data-a]').forEach(td => td.onclick = () => {
    const [c, sid] = td.dataset.a.split('|'), k = akey(c, sid), a = S.assign[k] || [];
    const opts = (sel, sameOnly) => `<option value="">— لا أحد —</option>` + S.teachers.filter(t => !sameOnly || t.sub === sid).map(t => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
    $('#dlgBody').innerHTML = `<h3>${esc(sub(sid).name)} — فصل ${c}</h3>
     <label>المعلم الأساسي</label><select id="a1">${opts(a[0], true)}</select>
     <label style="margin-top:10px">معلم ثانٍ (اختياري — حصة مشتركة)</label><select id="a2">${opts(a[1], false)}</select>
     <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn o" id="aCancel">إلغاء</button><button class="btn" id="aOk">حفظ</button></div>`;
    $('#aCancel').onclick = () => $('#dlg').close();
    $('#aOk').onclick = () => { S.assign[k] = [$('#a1').value, $('#a2').value].filter(Boolean).filter((x, i, A) => A.indexOf(x) === i); S.assignLock = S.assignLock || {}; S.assignLock[k] = true; syncCards(); save(); $('#dlg').close(); render(); };
    $('#dlg').showModal();
  });
};

/* ===================== 5) المولّد ===================== */
function generate(keepPlaced) {
  syncCards();
  const D = 5, PP = P();
  const cards = S.cards;
  const clsOcc = {}, tOcc = {};
  const cell = (m, k) => m[k] || (m[k] = Array.from({ length: D }, () => Array(PP).fill(-1)));
  const unav = {}; S.teachers.forEach(t => unav[t.id] = new Set(t.unav || []));
  const perDayMax = {}; // cls|sub -> max occurrences per day
  const cnt = {}; cards.forEach(c => { const k = c.cls + '|' + c.sub; cnt[k] = (cnt[k] || 0) + 1; });
  for (const k in cnt) perDayMax[k] = Math.ceil(cnt[k] / D);
  const dayCount = {}; const dk = (c, d) => c.cls + '|' + c.sub + '|' + d;
  const put = (i, d, p) => { const c = cards[i]; c.d = d; c.p = p; for (let k = 0; k < c.len; k++) { cell(clsOcc, c.cls)[d][p + k] = i; c.teachers.forEach(t => cell(tOcc, t)[d][p + k] = i); } dayCount[dk(c, d)] = (dayCount[dk(c, d)] || 0) + 1; };
  const take = i => { const c = cards[i]; if (c.d == null) return; for (let k = 0; k < c.len; k++) { cell(clsOcc, c.cls)[c.d][c.p + k] = -1; c.teachers.forEach(t => cell(tOcc, t)[c.d][c.p + k] = -1); } dayCount[dk(c, c.d)]--; c.d = c.p = null; };
  // hard check ignoring occupancy -> returns conflicting card indexes or null if impossible
  const conflicts = (i, d, p) => {
    const c = cards[i]; if (p + c.len > PP) return null;
    const set = new Set();
    for (let k = 0; k < c.len; k++) {
      for (const t of c.teachers) { if (unav[t]?.has(d + ':' + (p + k))) return null; const o = cell(tOcc, t)[d][p + k]; if (o >= 0) set.add(o); }
      const o = cell(clsOcc, c.cls)[d][p + k]; if (o >= 0) set.add(o);
    }
    if ((dayCount[dk(c, d)] || 0) >= perDayMax[c.cls + '|' + c.sub]) {
      // نفس المادة في نفس اليوم: أضف البطاقات المتعارضة
      cards.forEach((o, j) => { if (j !== i && o.d === d && o.cls === c.cls && o.sub === c.sub) set.add(j); });
    }
    for (const j of set) if (cards[j].locked) return null;
    return [...set];
  };
  // ابدأ
  cards.forEach((c, i) => { const d = c.d, p = c.p; c.d = c.p = null; if ((c.locked || keepPlaced) && d != null && p != null && p + c.len <= PP) { const cf = conflicts(i, d, p); if (cf && !cf.length) put(i, d, p); } });
  const diff = i => { const c = cards[i]; return c.len * 10 + c.teachers.reduce((a, t) => a + cards.filter(x => x.teachers.includes(t)).length, 0) / 5 + (c.teachers.length > 1 ? 30 : 0); };
  let queue = cards.map((_, i) => i).filter(i => cards[i].d == null && cards[i].teachers.length).sort((a, b) => diff(b) - diff(a));
  const t0 = Date.now(); let iter = 0; const tabu = new Map();
  while (queue.length && Date.now() - t0 < 8000) {
    iter++;
    const i = queue.shift(); const c = cards[i];
    let best = null, bestScore = 1e9;
    for (let d = 0; d < D; d++) for (let p = 0; p + c.len <= PP; p++) {
      const cf = conflicts(i, d, p); if (!cf) continue;
      let sc = cf.length * 100 + Math.random() * 8;
      for (const j of cf) if (tabu.get(j + ':' + d + ':' + p) > iter) sc += 500;
      // تفضيل الحصص المزدوجة ضمن نفس الفترة وتوزيع المواد على الأيام
      sc += (dayCount[dk(c, d)] || 0) * 20;
      if (sc < bestScore) { bestScore = sc; best = [d, p, cf]; }
    }
    if (!best) continue; // مستحيل (قيود)
    const [d, p, cf] = best;
    cf.forEach(j => { tabu.set(i + ':' + cards[j].d + ':' + cards[j].p, iter + 15); take(j); queue.push(j); });
    put(i, d, p);
  }
  const un = cards.filter(c => c.d == null).length;
  save();
  return { un, noT: cards.filter(c => !c.teachers.length).length, ms: Date.now() - t0 };
}

/* ===================== 6) الجدول والتعديل اليدوي ===================== */
let ttView = 'class', ttSel = null, selCard = null;
function occMaps() {
  const cls = {}, t = {};
  S.cards.forEach(c => { if (c.d == null) return; for (let k = 0; k < c.len; k++) { (cls[c.cls + '|' + c.d + '|' + (c.p + k)] ||= []).push(c); c.teachers.forEach(x => (t[x + '|' + c.d + '|' + (c.p + k)] ||= []).push(c)); } });
  return { cls, t };
}
function canMove(card, d, p, ignore = []) {
  if (p + card.len > P() || p < 0) return 'خارج عدد الحصص';
  for (let k = 0; k < card.len; k++) {
    for (const o of S.cards) {
      if (o === card || ignore.includes(o) || o.d !== d) continue;
      if (p + k >= o.p && p + k < o.p + o.len) {
        if (o.cls === card.cls) return `الفصل ${o.cls} مشغول`;
        const t = o.teachers.find(x => card.teachers.includes(x)); if (t) return `${tch(t).name} لديه حصة في ${o.cls}`;
      }
    }
    for (const t of card.teachers) if (tch(t)?.unav?.includes(d + ':' + (p + k))) return `${tch(t).name} غير متاح`;
  }
  return '';
}
VIEWS.tt = () => {
  const placed = S.cards.filter(c => c.d != null).length, un = S.cards.filter(c => c.d == null && c.teachers.length);
  const list = ttView === 'class' ? classes().map(c => [c, c]) : S.teachers.map(t => [t.id, t.name]);
  if (!ttSel || !list.find(x => x[0] === ttSel)) ttSel = list[0]?.[0];
  const om = occMaps();
  const cellCards = (d, p) => ttView === 'class' ? (om.cls[ttSel + '|' + d + '|' + p] || []) : (om.t[ttSel + '|' + d + '|' + p] || []);
  $('#main').innerHTML = `
  <div class="card"><h2>توليد الجدول</h2>
   <div class="row"><button class="btn" id="gen">⚙ توليد الجدول تلقائياً</button><button class="btn o" id="gen2">إكمال الجدول (الإبقاء على الحالي)</button><button class="btn o" id="clr">مسح غير المقفل</button>
   <span class="mute">الموضوع: ${placed} من ${S.cards.length} بطاقة${un.length ? ` — <span class="warn">${un.length} غير موضوعة</span>` : ''}</span></div>
  </div>
  <div class="card">
   <div class="row" style="margin-bottom:10px">
    <select id="vw" style="width:auto"><option value="class" ${ttView === 'class' ? 'selected' : ''}>عرض حسب الفصل</option><option value="teacher" ${ttView === 'teacher' ? 'selected' : ''}>عرض حسب المعلم</option></select>
    <select id="who" style="width:auto;min-width:180px">${list.map(([k, v]) => `<option value="${k}" ${k === ttSel ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
    ${selCard ? `<span class="pill">محدد: ${esc(subShort(selCard.sub))} ${selCard.cls}</span><button class="btn o s" id="lk">${selCard.locked ? 'فك القفل' : '🔒 قفل'}</button><button class="btn o s" id="rmv">إزالة من الجدول</button><button class="btn o s" id="cs">إلغاء التحديد</button>` : '<span class="mute">اضغط على حصة ثم على خانة أخرى لنقلها أو تبديلها.</span>'}
   </div>
   <div class="scroll"><table class="t tt"><tr><th></th>${Array.from({ length: P() }, (_, p) => `<th>${ORD[p]}</th>`).join('')}</tr>
   ${DAYS.map((dn, d) => `<tr><th>${dn}</th>${Array.from({ length: P() }, (_, p) => {
    const cs = cellCards(d, p); const c = cs[0];
    const un = ttView === 'teacher' && tch(ttSel)?.unav?.includes(d + ':' + p);
    return `<td class="cell ${c && c === selCard ? 'sel' : ''} ${c?.locked ? 'lock' : ''} ${un ? 'unav' : ''} ${cs.length > 1 ? 'bad' : ''}" data-d="${d}" data-p="${p}">${c ? `${esc(subShort(c.sub))}<small>${ttView === 'class' ? c.teachers.map(t => esc(tch(t)?.name.split(' ')[0])).join(' + ') : c.cls}</small>` : ''}</td>`;
  }).join('')}</tr>`).join('')}
   </table></div>
   ${un.length ? `<h3 style="font-size:15px">حصص غير موضوعة (اضغط لتحديدها ثم اختر خانة فارغة)</h3><div class="chips">${un.map(c => `<span data-u="${c.id}" style="cursor:pointer;${c === selCard ? 'background:var(--sel)' : ''}">${esc(subShort(c.sub))} ${c.cls}${c.len > 1 ? ' (مزدوجة)' : ''}</span>`).join('')}</div>` : ''}
   ${S.cards.some(c => !c.teachers.length) ? `<p class="warn">⚠ ${S.cards.filter(c => !c.teachers.length).length} حصة بدون معلم — راجع تبويب التوزيع</p>` : ''}
  </div>`;
  const run = keep => { if (!S.cards.length) syncCards(); if (!S.cards.length) return toast('أدخل المواد والمعلمين أولاً'); $('#gen').disabled = true; $('#gen').textContent = 'جارٍ التوليد...'; setTimeout(() => { const r = generate(keep); selCard = null; render(); toast(r.un ? `تم مع ${r.un} حصة لم تُوضع — جرّب التوليد مرة أخرى أو خفّف القيود` : `✓ اكتمل الجدول خلال ${(r.ms / 1000).toFixed(1)} ث`, 5000); }, 30); };
  $('#gen').onclick = () => { if (S.cards.some(c => c.d != null && !c.locked) && !confirm('سيُعاد توليد كل الحصص غير المقفلة. متابعة؟')) return; run(false); };
  $('#gen2').onclick = () => run(true);
  $('#clr').onclick = () => { if (!confirm('مسح كل الحصص غير المقفلة؟')) return; S.cards.forEach(c => { if (!c.locked) c.d = c.p = null; }); save(); render(); };
  $('#vw').onchange = e => { ttView = e.target.value; ttSel = null; render(); };
  $('#who').onchange = e => { ttSel = e.target.value; render(); };
  if ($('#lk')) { $('#lk').onclick = () => { selCard.locked = !selCard.locked; save(); render(); }; $('#rmv').onclick = () => { selCard.d = selCard.p = null; selCard.locked = false; save(); render(); }; $('#cs').onclick = () => { selCard = null; render(); }; }
  $('#main').querySelectorAll('[data-u]').forEach(s => s.onclick = () => { selCard = S.cards.find(c => c.id === s.dataset.u); render(); });
  $('#main').querySelectorAll('td.cell').forEach(td => td.onclick = () => {
    const d = +td.dataset.d, p = +td.dataset.p, c = cellCards(d, p)[0];
    if (!selCard) { if (c) { selCard = c; render(); } return; }
    if (c === selCard) { selCard = null; render(); return; }
    if (selCard.locked) return toast('الحصة مقفلة');
    if (!c) {
      const np = ttView === 'class' || true ? p : p; const err = canMove(selCard, d, np);
      if (err) return toast('لا يمكن: ' + err);
      selCard.d = d; selCard.p = np; save(); selCard = null; render(); return;
    }
    if (c.locked) return toast('الحصة الهدف مقفلة');
    // تبديل
    if (selCard.d == null) return toast('اختر خانة فارغة للحصة غير الموضوعة');
    const a = { d: selCard.d, p: selCard.p }, b = { d: c.d, p: c.p };
    const e1 = canMove(selCard, b.d, b.p, [c]), e2 = canMove(c, a.d, a.p, [selCard]);
    if (e1 || e2) return toast('لا يمكن التبديل: ' + (e1 || e2));
    selCard.d = b.d; selCard.p = b.p; c.d = a.d; c.p = a.p; save(); selCard = null; render();
  });
};

/* ===================== 7) الاحتياط ===================== */
VIEWS.subs = () => {
  const today = new Date().toISOString().slice(0, 10);
  VIEWS.subs.date ||= today;
  const date = VIEWS.subs.date, d = new Date(date + 'T12:00').getDay();
  const day = d <= 4 ? d : -1;
  const rec = S.subs.filter(x => x.date === date);
  const absent = new Set(rec.map(r => r.abs));
  const om = occMaps();
  const busy = (t, p) => (om.t[t + '|' + day + '|' + p] || []).length || S.subs.some(x => x.date === date && x.sub === t && x.p === p);
  const suggest = (r) => S.teachers.filter(t => !absent.has(t.id) && !busy(t.id, r.p) && !tch(t.id).unav?.includes(day + ':' + r.p))
    .map(t => ({ t, sc: (t.sub === r.subj ? 0 : 100) + S.subs.filter(x => x.sub === t.id).length * 3 + S.cards.filter(c => c.d === day && c.teachers.includes(t.id)).length * 5 }))
    .sort((a, b) => a.sc - b.sc);
  $('#main').innerHTML = `<div class="card"><h2>الاحتياط (الغياب والبدلاء)</h2>
   <div class="row"><div><label>التاريخ</label><input type="date" id="sd" value="${date}"></div>
   <div style="min-width:220px"><label>إضافة معلم غائب</label><select id="ab"><option value="">— اختر —</option>${S.teachers.filter(t => !absent.has(t.id)).map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div>
   <div><label>&nbsp;</label><button class="btn o" id="pr">🖨 طباعة كشف الاحتياط</button></div></div>
   ${day < 0 ? '<p class="warn">هذا اليوم ليس يوم دراسة (الأحد–الخميس).</p>' : `<p class="mute">يوم ${DAYS[day]}</p>`}
  </div>
  <div class="card"><div class="scroll"><table class="t"><tr><th>المعلم الغائب</th><th>الحصة</th><th>الفصل</th><th>المادة</th><th>البديل</th><th></th></tr>
   ${rec.map((r, i) => `<tr><td>${esc(tch(r.abs)?.name)}</td><td>${ORD[r.p]}</td><td>${r.cls}</td><td>${esc(subShort(r.subj))}</td>
     <td><select data-si="${S.subs.indexOf(r)}"><option value="">— بدون —</option>${suggest(r).map(({ t }) => `<option value="${t.id}" ${t.id === r.sub ? 'selected' : ''}>${esc(t.name)}${t.sub === r.subj ? ' ★' : ''}</option>`).concat(r.sub && !suggest(r).some(x => x.t.id === r.sub) ? [`<option value="${r.sub}" selected>${esc(tch(r.sub)?.name)}</option>`] : []).join('')}</select></td>
     <td><button class="btn r s" data-sr="${r.abs}">حذف الغائب</button></td></tr>`).join('') || '<tr><td colspan="6" class="mute">لا يوجد غياب في هذا اليوم</td></tr>'}
  </table></div><p class="mute">★ من نفس القسم. المقترح الأول هو الأنسب (نفس القسم وأقل حصص).</p></div>`;
  $('#sd').onchange = e => { VIEWS.subs.date = e.target.value; render(); };
  $('#ab').onchange = e => {
    const id = e.target.value; if (!id || day < 0) return;
    S.cards.filter(c => c.d === day && c.teachers.includes(id)).forEach(c => { for (let k = 0; k < c.len; k++) S.subs.push({ date, abs: id, p: c.p + k, cls: c.cls, subj: c.sub, sub: '' }); });
    S.subs.filter(x => x.date === date && x.abs === id && !x.sub).sort((a, b) => a.p - b.p).forEach(r => { const s = suggest(r)[0]; if (s) r.sub = s.t.id; });
    save(); render();
  };
  $('#main').querySelectorAll('[data-si]').forEach(s => s.onchange = e => { S.subs[+s.dataset.si].sub = e.target.value; save(); });
  $('#main').querySelectorAll('[data-sr]').forEach(b => b.onclick = () => { S.subs = S.subs.filter(x => !(x.date === date && x.abs === b.dataset.sr)); save(); render(); });
  $('#pr').onclick = () => doPrint(subsPrint(date, day));
};
function subsPrint(date, day) {
  const rec = S.subs.filter(x => x.date === date).sort((a, b) => a.p - b.p);
  return page(`كشف الاحتياط — يوم ${DAYS[day] || ''} ${date}`, `<table style="font-size:13px"><tr><th>الحصة</th><th>المعلم الغائب</th><th>الفصل</th><th>المادة</th><th>المعلم البديل</th><th>التوقيع</th></tr>
  ${rec.map(r => `<tr style="height:26px"><td>${ORD[r.p]}</td><td>${esc(tch(r.abs)?.name)}</td><td>${r.cls}</td><td>${esc(subShort(r.subj))}</td><td>${esc(tch(r.sub)?.name || '')}</td><td></td></tr>`).join('')}</table>`, 'portrait');
}

/* ===================== 8) الطباعة ===================== */
function arDate(s) { if (!s) return ''; const [y, m, d] = s.split('-'); return `${+d}-${+m}-${y}`; }
function dayName(s) { if (!s) return ''; return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][new Date(s + 'T12:00').getDay()]; }
function page(title, body, orient = 'landscape', cls = '') {
  const s = S.school;
  return `<div class="page ${cls}" data-o="${orient}"><div class="ph">
   <div class="s">${s.region ? 'وزارة التربية<br>منطقة ' + esc(s.region) + ' التعليمية<br>' : ''}${esc(s.name)}</div>
   <div class="c"><b>${title}</b>${s.year ? 'العام الدراسي ' + esc(s.year) : ''}</div>
   <div class="s" style="text-align:left">${s.logo ? `<img src="${s.logo}">` : ''}${s.startDate ? `<div>للعمل به اعتباراً من يوم ${dayName(s.startDate)} الموافق ${arDate(s.startDate)}</div>` : ''}</div>
  </div>${body}</div>`;
}
const PH = () => Array.from({ length: P() }, (_, p) => p);
function teacherRowCells(om, tid) {
  return DAYS.map((_, d) => PH().map(p => { const c = (om.t[tid + '|' + d + '|' + p] || [])[0]; return `<td class="${p === P() - 1 ? 'dthick' : ''}">${c ? c.cls : ''}</td>`; }).join('')).join('');
}
const dayHead = (first = '') => `<tr>${first}${DAYS.map(d => `<th colspan="${P()}" class="day dthick">يوم ${d}</th>`).join('')}</tr>`;
const perHead = (first = '') => `<tr>${first}${DAYS.map(() => PH().map(p => `<th class="${p === P() - 1 ? 'dthick' : ''}">${ORD[p]}</th>`).join('')).join('')}</tr>`;
function printGeneral() {
  const om = occMaps();
  let rows = '';
  for (const s of S.subjects) {
    const ts = S.teachers.filter(t => t.sub === s.id); if (!ts.length) continue;
    ts.forEach((t, i) => rows += `<tr>${i === 0 ? `<td class="dep" rowspan="${ts.length}">${esc(s.name)}</td>` : ''}<td>${i + 1}</td><td class="nm">${esc(t.name)}</td>${teacherRowCells(om, t.id)}</tr>`);
  }
  const cols = `<colgroup><col style="width:70px"><col style="width:22px"><col style="width:150px">${'<col>'.repeat(5 * P())}</colgroup>`;
  return page('الجدول المدرسي', `<table class="sm">${cols}<thead>${dayHead('<th rowspan="2">القسم</th><th rowspan="2">الرقم</th><th rowspan="2">اسم المعلم</th>')}${perHead()}</thead><tbody>${rows}</tbody></table>`);
}
function printClasses(only) {
  const om = occMaps();
  return (only ? [only] : classes()).map(c => page(`الجدول الأسبوعي للصف ${c}`, `<div class="cls"><table><tr><th style="width:90px"></th>${PH().map(p => `<th>الحصة ${ORD[p]}</th>`).join('')}</tr>
   ${DAYS.map((dn, d) => `<tr><th>${dn}</th>${PH().map(p => { const x = (om.cls[c + '|' + d + '|' + p] || [])[0]; return `<td>${x ? `<b>${esc(subShort(x.sub))}</b><small>${x.teachers.map(t => esc(tch(t)?.name || '')).join(' + ')}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</table></div>`, 'landscape', 'cls')).join('');
}
function printTeachers(mode, sel) {
  const om = occMaps();
  const groups = mode === 'dept' ? S.subjects.filter(s => !sel || s.id === sel).map(s => [s.name, S.teachers.filter(t => t.sub === s.id)]).filter(g => g[1].length)
    : S.teachers.filter(t => !sel || t.id === sel).map(t => [t.name, [t]]);
  return groups.map(([title, ts]) => page(mode === 'dept' ? 'جدول قسم ' + esc(title) : 'جدول المعلم: ' + esc(title),
    `<table style="font-size:11px"><colgroup><col style="width:160px">${'<col>'.repeat(5 * P())}</colgroup>${dayHead('<th rowspan="2">اسم المعلم</th>')}${perHead()}
     ${ts.map(t => `<tr style="height:30px"><td class="nm">${esc(t.name)}</td>${teacherRowCells(om, t.id)}</tr>`).join('')}</table>
     <p style="font-size:12px">${ts.map(t => `${esc(t.name)}: ${S.cards.filter(c => c.d != null && c.teachers.includes(t.id)).reduce((a, c) => a + c.len, 0)} حصة`).join(' &nbsp;|&nbsp; ')}</p>`)).join('');
}
function printDaily() {
  const om = occMaps();
  return DAYS.map((dn, d) => page(`الجدول اليومي — يوم ${dn}`, `<table style="font-size:10px"><colgroup><col style="width:50px">${'<col>'.repeat(P())}</colgroup><tr><th>الصف</th>${PH().map(p => `<th>${ORD[p]}</th>`).join('')}</tr>
   ${classes().map(c => { const xs = PH().map(p => (om.cls[c + '|' + d + '|' + p] || [])[0]); return `<tr><td rowspan="2"><b>${c}</b></td>${xs.map(x => `<td><b>${x ? esc(subShort(x.sub)) : ''}</b></td>`).join('')}</tr><tr>${xs.map(x => `<td style="font-size:9px">${x ? x.teachers.map(t => esc(tch(t)?.name || '')).join(' + ') : ''}</td>`).join('')}</tr>`; }).join('')}</table>`, 'portrait')).join('');
}
function printFirstLast() {
  const om = occMaps(), L = P() - 1;
  const cellPair = (c, d, p) => { const x = (om.cls[c + '|' + d + '|' + p] || [])[0]; return x; };
  return page('جدول الحصص الأولى والأخيرة', `<table style="font-size:10px"><tr><th rowspan="2">الصف</th>${DAYS.map(d => `<th colspan="2" class="day">يوم ${d}</th>`).join('')}</tr><tr>${DAYS.map(() => `<th>الأولى</th><th>${ORD[L]}</th>`).join('')}</tr>
   ${classes().map(c => `<tr><td rowspan="2"><b>${c}</b></td>${DAYS.map((_, d) => [0, L].map(p => `<td><b>${esc(cellPair(c, d, p) ? subShort(cellPair(c, d, p).sub) : '')}</b></td>`).join('')).join('')}</tr>
   <tr>${DAYS.map((_, d) => [0, L].map(p => { const x = cellPair(c, d, p); return `<td style="font-size:9px">${x ? x.teachers.map(t => esc(tch(t)?.name || '')).join(' + ') : ''}</td>`; }).join('')).join('')}</tr>`).join('')}</table>`, 'portrait');
}
let lastPrint = '';
function doPrint(html) {
  const orient = html.includes('data-o="portrait"') && !html.includes('data-o="landscape"') ? 'portrait' : 'landscape';
  let st = document.getElementById('pgst'); if (!st) { st = document.createElement('style'); st.id = 'pgst'; document.head.appendChild(st); }
  st.textContent = `@page{size:A4 ${orient};margin:8mm}`;
  $('#printArea').innerHTML = `<div class="pv">${html}</div>`;
  setTimeout(() => window.print(), 50);
}
VIEWS.print = () => {
  const kinds = [['general', 'الجدول المدرسي العام'], ['classes', 'جداول الفصول'], ['teacher', 'جدول معلم'], ['dept', 'جدول قسم'], ['daily', 'الجدول اليومي'], ['fl', 'الحصص الأولى والأخيرة']];
  VIEWS.print.k ||= 'general';
  const k = VIEWS.print.k;
  const selOpts = k === 'teacher' ? S.teachers.map(t => [t.id, t.name]) : k === 'dept' ? S.subjects.map(s => [s.id, s.name]) : k === 'classes' ? classes().map(c => [c, c]) : null;
  const sel = VIEWS.print.sel || '';
  const html = { general: printGeneral, classes: () => printClasses(sel), teacher: () => printTeachers('t', sel), dept: () => printTeachers('dept', sel), daily: printDaily, fl: printFirstLast }[k]();
  lastPrint = html;
  $('#main').innerHTML = `<div class="card"><div class="row">
   <select id="pk" style="width:auto">${kinds.map(([a, b]) => `<option value="${a}" ${a === k ? 'selected' : ''}>${b}</option>`).join('')}</select>
   ${selOpts ? `<select id="ps" style="width:auto"><option value="">الكل</option>${selOpts.map(([a, b]) => `<option value="${a}" ${a === sel ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>` : ''}
   <button class="btn" id="pp">🖨 طباعة / حفظ PDF</button><button class="btn o" id="px">⬇ تصدير Excel</button></div>
   <p class="mute">المعاينة أدناه. اختر "حفظ كـ PDF" من نافذة الطباعة لحفظ ملف.</p></div>
   <div class="scroll" style="background:#fff;border:1px solid var(--line);border-radius:8px"><div class="pv" style="min-width:1000px">${html}</div></div>`;
  $('#pk').onchange = e => { VIEWS.print.k = e.target.value; VIEWS.print.sel = ''; render(); };
  if ($('#ps')) $('#ps').onchange = e => { VIEWS.print.sel = e.target.value; render(); };
  $('#pp').onclick = () => doPrint(lastPrint);
  $('#px').onclick = exportExcel;
};
function exportExcel() {
  if (!window.XLSX) return toast('مكتبة Excel لم تُحمَّل');
  const om = occMaps(), wb = XLSX.utils.book_new(), PP = P();
  const g = [[S.school.startDate ? `للعمل به اعتباراً من يوم ${dayName(S.school.startDate)} الموافق ${arDate(S.school.startDate)}` : '', '', '', 'الجدول المدرسي'],
  ['الرقم', 'القسم', 'اسم المعلم', ...DAYS.flatMap(d => ['يوم ' + d, ...Array(PP - 1).fill('')])], ['', '', '', ...DAYS.flatMap(() => PH().map(p => ORD[p]))]];
  const merges = DAYS.map((_, i) => ({ s: { r: 1, c: 3 + i * PP }, e: { r: 1, c: 3 + i * PP + PP - 1 } }));
  for (const s of S.subjects) { const ts = S.teachers.filter(t => t.sub === s.id); if (ts.length) merges.push({ s: { r: g.length, c: 1 }, e: { r: g.length + ts.length - 1, c: 1 } }); ts.forEach((t, i) => g.push([i + 1, i ? '' : s.name, t.name, ...DAYS.flatMap((_, d) => PH().map(p => (om.t[t.id + '|' + d + '|' + p] || [])[0]?.cls || ''))])); }
  const ws = XLSX.utils.aoa_to_sheet(g); ws['!merges'] = merges; ws['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 28 }]; ws['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الجدول المدرسي');
  const dl = [];
  DAYS.forEach((dn, d) => { dl.push(['', 'يوم ' + dn]); dl.push(['الصف', ...PH().map(p => ORD[p])]); classes().forEach(c => { const xs = PH().map(p => (om.cls[c + '|' + d + '|' + p] || [])[0]); dl.push([c, ...xs.map(x => x ? subShort(x.sub) : '')]); dl.push(['', ...xs.map(x => x ? x.teachers.map(t => tch(t)?.name).join(' + ') : '')]); }); dl.push([]); });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dl), 'الجدول اليومي');
  classes().forEach(c => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['الجدول الأسبوعي للصف ' + c], ['', ...PH().map(p => 'الحصة ' + ORD[p])], ...DAYS.map((dn, d) => [dn, ...PH().map(p => { const x = (om.cls[c + '|' + d + '|' + p] || [])[0]; return x ? subShort(x.sub) : ''; })])]), c));
  XLSX.writeFile(wb, `الجدول المدرسي ${S.school.name || ''}.xlsx`);
}

/* ===================== 9) نسخة احتياطية ===================== */
VIEWS.backup = () => {
  $('#main').innerHTML = `<div class="card"><h2>النسخ الاحتياطي</h2>
   <p class="mute">البيانات محفوظة على هذا الجهاز تلقائياً. صدّر ملف نسخة احتياطية لنقلها لجهاز آخر أو للاحتفاظ بها.</p>
   <div class="row"><button class="btn" id="ex">⬇ تصدير نسخة احتياطية</button>
   <label class="btn o" style="margin:0">⬆ استيراد نسخة<input type="file" id="im" accept=".json" hidden></label>
   <button class="btn r" id="reset">بدء مدرسة جديدة (مسح الكل)</button></div></div>
   <div class="card"><h2>المظهر</h2><div class="row"><button class="btn o s" data-th="">تلقائي</button><button class="btn o s" data-th="light">فاتح</button><button class="btn o s" data-th="dark">داكن</button></div></div>`;
  $('#ex').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = `جدول_${S.school.name || 'مدرسة'}_${new Date().toISOString().slice(0, 10)}.json`; a.click(); };
  $('#im').onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); if (!d.school) throw 0; S = d; save(); render(); toast('تم الاستيراد'); } catch (x) { toast('ملف غير صالح'); } };
  $('#reset').onclick = () => { if (confirm('سيتم مسح كل البيانات. هل صدّرت نسخة احتياطية؟')) { S = blank(); save(); tab = 'setup'; render(); } };
  $('#main').querySelectorAll('[data-th]').forEach(b => b.onclick = () => { localStorage.setItem('tt-theme', b.dataset.th); applyTheme(); });
};
function applyTheme() { const t = localStorage.getItem('tt-theme'); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme();
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
