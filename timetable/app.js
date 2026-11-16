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
    subjects: [], teachers: [], rooms: [], assign: {}, cards: [], subs: [], rules: { gaps: true, spread: true }
  };
}
let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { S = blank(); }
const PALETTE = ['#cfe8ff', '#ffd9d9', '#d7f5d0', '#fff1b8', '#e8dcff', '#ffe0c2', '#c9f2ee', '#f9d5ec', '#e0e7d0', '#dcdcdc', '#ffd6a5', '#bde0fe', '#caffbf', '#fdffb6', '#ffc6ff', '#a0c4ff'];
S.rooms ||= []; S.rules ||= { gaps: true, spread: true };
S.subjects.forEach((s, i) => s.color ||= PALETTE[i % PALETTE.length]);
function effT(id) {
  const t = tch(id); if (!t) return { max: 99, consec: 99, unav: new Set() };
  const s = sub(t.sub) || {}, G = S.rules, mn = a => Math.min(...a.map(x => +x || 99));
  const max = mn([t.maxDay, s.tMaxDay, t.head && G.headMaxDay, G.tMaxDay]);
  const consec = mn([t.maxConsec, s.tMaxConsec, t.head && G.headMaxConsec, G.tMaxConsec]);
  const u = new Set(t.unav || []); (s.meet || []).forEach(x => u.add(x)); (t.head ? G.headSlots || [] : []).forEach(x => u.add(x));
  const noP = [...(s.tNoP || []), ...(t.head ? G.headNoP || [] : [])];
  for (let d = 0; d < 5; d++) { noP.forEach(p => u.add(d + ':' + p)); if (t.freeDay === d) for (let p = 0; p < P(); p++) u.add(d + ':' + p); }
  return { max, consec, unav: u };
}
function slotDialog(title, arr, done, inherited = new Set()) {
  $('#dlgBody').innerHTML = `<h3>${title}</h3><p class="mute">اضغط على الحصة لتعليمها. الرمادي مفروض من قاعدة أخرى.</p>
   <div class="scroll"><table class="t"><tr><th></th>${Array.from({ length: P() }, (_, p) => `<th>${p + 1}</th>`).join('')}</tr>
   ${DAYS.map((d, di) => `<tr><th>${d}</th>${Array.from({ length: P() }, (_, p) => { const k = di + ':' + p, on = arr.includes(k), inh = !on && inherited.has(k); return `<td class="${on ? 'unav' : ''}" style="${inh ? 'background:#ccc' : ''};cursor:pointer;height:34px" data-dp="${k}">${on ? '✕' : inh ? '•' : ''}</td>`; }).join('')}</tr>`).join('')}</table></div>
   <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="dOk">تم</button></div>`;
  $('#dlgBody').querySelectorAll('[data-dp]').forEach(c => c.onclick = () => { const k = c.dataset.dp, i = arr.indexOf(k); i < 0 ? arr.push(k) : arr.splice(i, 1); c.classList.toggle('unav'); c.textContent = i < 0 ? '✕' : ''; c.style.background = ''; save(); });
  $('#dOk').onclick = () => { $('#dlg').close(); done && done(); };
  $('#dlg').showModal();
}
function teacherDialog(t) {
  $('#dlgBody').innerHTML = `<h3>قواعد وملاحظات: ${esc(t.name)}</h3>
   <label style="display:flex;gap:6px;align-items:center;color:var(--ink);margin:8px 0"><input type="checkbox" id="tdHead" ${t.head ? 'checked' : ''}> رئيس الشعبة / رئيس القسم (تُطبَّق عليه قواعد رؤساء الشعب)</label>
   <div class="grid">
    <div><label>أقصى حصص في اليوم</label><input type="number" min="0" id="tdMax" value="${t.maxDay || ''}" placeholder="حسب القواعد العامة"></div>
    <div><label>أقصى حصص متتالية</label><input type="number" min="0" id="tdCons" value="${t.maxConsec || ''}" placeholder="حسب القواعد العامة"></div>
    <div><label>يوم بدون حصص</label><select id="tdFree"><option value="">— لا يوجد —</option>${DAYS.map((d, i) => `<option value="${i}" ${t.freeDay === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
   </div>
   <div class="row" style="margin-top:10px"><button class="btn o s" id="tdUn">أوقات غير متاحة (${(t.unav || []).length})</button><span class="mute">القواعد الفعلية: أقصى ${effT(t.id).max === 99 ? '—' : effT(t.id).max}/يوم، متتالية ${effT(t.id).consec === 99 ? '—' : effT(t.id).consec}، ${effT(t.id).unav.size} حصة محجوبة</span></div>
   <label style="margin-top:10px">ملاحظات على المعلم</label><textarea id="tdNotes" rows="4" placeholder="مثال: يفضّل الحصص الأولى، لديه إشراف يوم الاثنين...">${esc(t.notes || '')}</textarea>
   <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn o" id="tdC">إلغاء</button><button class="btn" id="tdOk">حفظ</button></div>`;
  const apply = () => { t.head = $('#tdHead').checked; t.maxDay = +$('#tdMax').value || 0; t.maxConsec = +$('#tdCons').value || 0; t.freeDay = $('#tdFree').value === '' ? null : +$('#tdFree').value; t.notes = $('#tdNotes').value; save(); };
  $('#tdUn').onclick = () => { apply(); t.unav = t.unav || []; slotDialog('الأوقات غير المتاحة: ' + esc(t.name), t.unav, () => teacherDialog(t)); };
  $('#tdC').onclick = () => $('#dlg').close();
  $('#tdOk').onclick = () => { apply(); $('#dlg').close(); render(); toast('تم الحفظ'); };
  $('#dlg').showModal();
}
const subColor = id => sub(id)?.color || '#eee';
let UNDO = [];
function snap() { UNDO.push(JSON.stringify(S.cards.map(c => [c.id, c.d, c.p, c.locked, c.room]))); if (UNDO.length > 50) UNDO.shift(); }
function undo() { const u = UNDO.pop(); if (!u) return toast('لا يوجد ما يُتراجع عنه'); const m = new Map(JSON.parse(u).map(x => [x[0], x])); S.cards.forEach(c => { const x = m.get(c.id); if (x) [, c.d, c.p, c.locked, c.room] = x; }); save(); render(); toast('تم التراجع'); }
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
  ['setup', 'بيانات المدرسة'], ['subjects', 'المواد والأقسام'], ['teachers', 'المعلمون'], ['rooms', 'القاعات'], ['assign', 'التوزيع'], ['rules', 'القواعد والفحص'],
  ['tt', 'الجدول'], ['subs', 'الاحتياط'], ['print', 'الطباعة والمعاينة'], ['backup', 'نسخة احتياطية']
];
let tab = S.school.name ? 'tt' : 'setup';
function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${v}</button>`).join('');
  $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } };
}
function header() {
  $('#hTitle').textContent = S.school.name || 'الجدول المدرسي الرقمي';
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
   <div class="scroll"><table class="t"><tr><th>#</th><th>المادة / القسم</th><th>الاختصار</th><th>النصاب الأسبوعي</th><th>مزدوجة</th><th>اللون</th><th>أقصى/يوم</th><th>حصص ممنوعة</th><th>تُدرّس للصفوف</th><th></th></tr>
   ${S.subjects.map((s, i) => `<tr><td>${i + 1}</td><td><input data-i="${i}" data-k="name" value="${esc(s.name)}"></td><td><input data-i="${i}" data-k="short" value="${esc(s.short)}" style="width:90px"></td>
     <td><input type="number" data-i="${i}" data-k="load" value="${s.load}" style="width:70px"></td>
     <td><input type="checkbox" data-i="${i}" data-k="double" ${s.double ? 'checked' : ''}></td>
     <td><input type="color" data-i="${i}" data-k="color" value="${s.color || '#cfe8ff'}" style="width:44px;padding:2px;height:32px"></td>
     <td><input type="number" min="0" data-i="${i}" data-k="maxDay" value="${s.maxDay || ''}" placeholder="تلقائي" style="width:70px"></td>
     <td style="white-space:nowrap">${Array.from({ length: P() }, (_, p) => `<label title="الحصة ${ORD[p]}" style="display:inline-flex;flex-direction:column;align-items:center;font-size:11px;color:var(--ink)"><input type="checkbox" data-np="${i}" value="${p}" ${(s.noP || []).includes(p) ? 'checked' : ''}>${p + 1}</label>`).join('')}</td>
     <td>${S.school.grades.map(g => `<label style="display:inline-flex;gap:3px;color:var(--ink)"><input type="checkbox" data-gr="${i}" value="${g.g}" ${!s.grades || s.grades.includes(+g.g) ? 'checked' : ''}>${g.g}</label>`).join(' ')}</td>
     <td><button class="btn o s" data-up="${i}">↑</button> <button class="btn r s" data-rm="${i}">حذف</button></td></tr>`).join('')}
   </table></div>
   <p class="${total > cap ? 'bad' : 'mute'}">مجموع الحصص للفصل الواحد: ${total} من ${cap} حصة متاحة أسبوعياً${total > cap ? ' — يتجاوز المتاح!' : ''}</p>
   <p class="mute">"أقصى/يوم": أكبر عدد حصص للمادة في اليوم للفصل. "حصص ممنوعة": حصص لا تُوضع فيها المادة (مثلاً البدنية لا تكون في الأولى). "مزدوجة": تُوضع حصتان متتاليتان مرة في الأسبوع (مثل الحاسوب والفنية)، والباقي حصص مفردة.</p>
  </div>${nextBtn('teachers')}`;
  $('#addS').onclick = () => {
    const name = $('#nName').value.trim(); if (!name) return toast('اكتب اسم المادة');
    S.subjects.push({ id: uid(), name, short: $('#nShort').value.trim() || name, load: +$('#nLoad').value || 1, double: $('#nDbl').checked, grades: null, color: PALETTE[S.subjects.length % PALETTE.length] });syncCards();
    save(); render(); $('#nName').focus();
  };
  $('#main').querySelectorAll('[data-k]').forEach(i => i.onchange = e => { const s = S.subjects[+i.dataset.i], k = i.dataset.k; s[k] = k === 'double' ? e.target.checked : (k === 'load' || k === 'maxDay') ? +e.target.value : e.target.value; if (k !== 'color') syncCards(); save(); render(); });
  $('#main').querySelectorAll('[data-np]').forEach(i => i.onchange = () => { const s = S.subjects[+i.dataset.np]; s.noP = [...$('#main').querySelectorAll(`[data-np="${i.dataset.np}"]:checked`)].map(x => +x.value); save(); });
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
   <div class="scroll"><table class="t"><tr><th>#</th><th>اسم المعلم</th><th>القسم</th>${gs.map(g => `<th>صف ${g}</th>`).join('')}<th>النصاب</th><th>أقصى/يوم</th><th></th></tr>
   ${S.subjects.flatMap(s => S.teachers.filter(t => t.sub === s.id)).concat(S.teachers.filter(t => !sub(t.sub))).map((t, i) => {
    const load = S.cards.filter(c => c.teachers.includes(t.id)).reduce((a, c) => a + c.len, 0);
    return `<tr><td>${i + 1}${t.head ? ' 👑' : ''}</td><td><input data-t="${t.id}" data-k="name" value="${esc(t.name)}" title="${esc(t.notes || '')}"></td>
     <td style="background:${subColor(t.sub)}"><select data-t="${t.id}" data-k="sub">${S.subjects.map(s => `<option value="${s.id}" ${s.id === t.sub ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></td>
     ${gs.map(g => `<td><input type="number" min="0" data-t="${t.id}" data-g="${g}" value="${t.counts[g] || 0}" style="width:60px"></td>`).join('')}
     <td>${load}</td><td><input type="number" min="0" data-t="${t.id}" data-k="maxDay" value="${t.maxDay || ''}" placeholder="—" style="width:60px"></td>
     <td class="row" style="justify-content:center"><button class="btn o s" data-tr="${t.id}">قواعد وملاحظات${t.notes ? ' 📝' : ''}</button><button class="btn o s" data-av="${t.id}">أوقات غير متاحة${t.unav?.length ? ' (' + t.unav.length + ')' : ''}</button><button class="btn r s" data-rm="${t.id}">حذف</button></td></tr>`;
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
    if (i.dataset.g) t.counts[i.dataset.g] = +e.target.value; else t[i.dataset.k] = i.dataset.k === 'maxDay' ? +e.target.value : e.target.value;
    if (i.dataset.g || i.dataset.k === 'sub') autoAssign();
    save(); render();
  });
  $('#main').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { if (!confirm('حذف المعلم؟')) return; const id = b.dataset.rm; S.teachers = S.teachers.filter(t => t.id !== id); for (const k in S.assign) S.assign[k] = S.assign[k].filter(x => x !== id); S.cards.forEach(c => c.teachers = c.teachers.filter(x => x !== id)); save(); render(); });
  $('#main').querySelectorAll('[data-av]').forEach(b => b.onclick = () => unavDialog(tch(b.dataset.av)));
  $('#main').querySelectorAll('[data-tr]').forEach(b => b.onclick = () => teacherDialog(tch(b.dataset.tr)));
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
      if (!s) { s = { id: uid(), name, grades: null, color: PALETTE[S.subjects.length % PALETTE.length] }; S.subjects.push(s); addedS++; }
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
    if (!s && sname) { s = { id: uid(), name: sname, short: sname, load: 1, double: false, grades: null, color: PALETTE[S.subjects.length % PALETTE.length] }; S.subjects.push(s); addedS++; }
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
   ${S.subjects.map(s => `<tr><th style="background:${s.color}">${esc(s.short || s.name)}</th>${cl.map(c => {
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

/* ===================== القاعات ===================== */
VIEWS.rooms = () => {
  $('#main').innerHTML = `<div class="card"><h2>القاعات الخاصة (مختبر، حاسوب، صالة، مرسم...)</h2>
   <p class="mute">المواد المرتبطة بقاعة لا تُوضع في حصة تكون فيها كل قاعاتها مشغولة. المواد بدون قاعة تُدرّس في فصلها.</p>
   <div class="row" style="margin-bottom:10px"><div style="flex:1;min-width:180px"><label>اسم القاعة</label><input id="rName" placeholder="مختبر الحاسوب 1"></div><div><label>&nbsp;</label><button class="btn" id="addR">إضافة قاعة</button></div></div>
   <div class="scroll"><table class="t"><tr><th>القاعة</th><th>المواد التي تُدرّس فيها</th><th>الاستخدام</th><th></th></tr>
   ${S.rooms.map(r => `<tr><td><input data-r="${r.id}" value="${esc(r.name)}"></td><td style="text-align:right">${S.subjects.map(s => `<label style="display:inline-flex;gap:3px;margin:2px 6px;color:var(--ink);background:${s.color};padding:2px 6px;border-radius:6px"><input type="checkbox" data-rs="${r.id}" value="${s.id}" ${r.subs.includes(s.id) ? 'checked' : ''}>${esc(s.short || s.name)}</label>`).join('')}</td>
   <td>${S.cards.filter(c => c.room === r.id && c.d != null).reduce((a, c) => a + c.len, 0)} / ${5 * P()}</td><td><button class="btn r s" data-rr="${r.id}">حذف</button></td></tr>`).join('') || '<tr><td colspan="4" class="mute">لا توجد قاعات خاصة</td></tr>'}
   </table></div></div>${nextBtn('assign')}`;
  $('#addR').onclick = () => { const n = $('#rName').value.trim(); if (!n) return toast('اكتب اسم القاعة'); S.rooms.push({ id: uid(), name: n, subs: [] }); save(); render(); };
  $('#main').querySelectorAll('[data-r]').forEach(i => i.onchange = e => { S.rooms.find(r => r.id === i.dataset.r).name = e.target.value; save(); });
  $('#main').querySelectorAll('[data-rs]').forEach(i => i.onchange = () => { const r = S.rooms.find(r => r.id === i.dataset.rs); r.subs = [...$('#main').querySelectorAll(`[data-rs="${r.id}"]:checked`)].map(x => x.value); save(); });
  $('#main').querySelectorAll('[data-rr]').forEach(b => b.onclick = () => { if (!confirm('حذف القاعة؟')) return; S.rooms = S.rooms.filter(r => r.id !== b.dataset.rr); S.cards.forEach(c => { if (c.room === b.dataset.rr) c.room = null; }); save(); render(); });
};
const roomsFor = sid => S.rooms.filter(r => r.subs.includes(sid)).map(r => r.id);

/* ===================== القواعد والفحص ===================== */
function checkData() {
  const out = [], cap = 5 * P();
  if (!S.subjects.length) out.push(['bad', 'لا توجد مواد']);
  if (!S.teachers.length) out.push(['bad', 'لا يوجد معلمون']);
  for (const c of classes()) { const n = S.cards.filter(x => x.cls === c).reduce((a, x) => a + x.len, 0); if (n > cap) out.push(['bad', `الفصل ${c}: ${n} حصة أكبر من المتاح ${cap}`]); }
  for (const t of S.teachers) {
    const n = S.cards.filter(x => x.teachers.includes(t.id)).reduce((a, x) => a + x.len, 0);
    const e = effT(t.id); const av = cap - e.unav.size; const md = e.max < 99 ? e.max * 5 : cap;
    if (n > Math.min(av, md)) out.push(['bad', `${t.name}: نصابه ${n} حصة والمتاح له ${Math.min(av, md)} فقط`]);
  }
  for (const s of S.subjects) {
    const allowed = P() - (s.noP || []).length;
    if (s.maxDay && s.maxDay * 5 < s.load) out.push(['bad', `${s.name}: النصاب ${s.load} لا يكفيه أقصى ${s.maxDay} في اليوم`]);
    if (allowed * 5 < s.load) out.push(['bad', `${s.name}: الحصص الممنوعة كثيرة`]);
    const rs = roomsFor(s.id); if (rs.length) { const need = S.cards.filter(c => c.sub === s.id).reduce((a, c) => a + c.len, 0); if (need > rs.length * cap) out.push(['bad', `${s.name}: يحتاج ${need} حصة في القاعات المتاحة ${rs.length * cap}`]); }
  }
  const noT = S.cards.filter(c => !c.teachers.length); if (noT.length) out.push(['warn', `${noT.length} حصة بدون معلم (لن تُوضع) — راجع التوزيع`]);
  if (!out.length) out.push(['ok', 'البيانات سليمة وجاهزة للتوليد']);
  return out;
}
VIEWS.rules = () => {
  const R = S.rules;
  $('#main').innerHTML = `<div class="card"><h2>القواعد المفعّلة في التوزيع التلقائي</h2>
   <table class="t" style="text-align:right">
   <tr><td>✔ لا يدرّس المعلم فصلين في نفس الحصة</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ لا يوجد للفصل حصتان في نفس الوقت</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ الحصة المشتركة (معلمان) تُوضع حين يكون الاثنان متفرغين</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ الحصص المزدوجة متتالية</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ احترام الأوقات غير المتاحة للمعلم</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ أقصى عدد حصص للمعلم في اليوم، وأقصى حصص متتالية (عامة / القسم / رئيس الشعبة / المعلم — يُطبَّق الأشد)</td><td class="ok">إلزامي (إن حُدّد)</td></tr>
   <tr><td>✔ اجتماعات الأقسام، أوقات رؤساء الشعب المحجوزة، ويوم بدون حصص للمعلم</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ أقصى عدد حصص للمادة في اليوم، والحصص الممنوعة للمادة</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ توفر القاعة الخاصة</td><td class="ok">إلزامي</td></tr>
   <tr><td>✔ الحصص المقفلة لا تتحرك</td><td class="ok">إلزامي</td></tr>
   <tr><td><label style="color:var(--ink)"><input type="checkbox" id="rSpread" ${R.spread ? 'checked' : ''}> توزيع المادة على أيام الأسبوع بالتساوي</label></td><td>تفضيل</td></tr>
   <tr><td><label style="color:var(--ink)"><input type="checkbox" id="rGaps" ${R.gaps ? 'checked' : ''}> تقليل الفراغات في جدول المعلم</label></td><td>تفضيل</td></tr>
   </table></div>

   <div class="card"><h2>القواعد العامة (كل المعلمين)</h2><div class="grid">
    <div><label>أقصى حصص للمعلم في اليوم</label><input type="number" min="0" data-g="tMaxDay" value="${R.tMaxDay || ''}" placeholder="بدون حد"></div>
    <div><label>أقصى حصص متتالية للمعلم</label><input type="number" min="0" data-g="tMaxConsec" value="${R.tMaxConsec || ''}" placeholder="بدون حد"></div>
   </div></div>
   <div class="card"><h2>قواعد رؤساء الشعب 👑</h2>
    <p class="mute">رؤساء الشعب الحاليون: ${S.teachers.filter(t => t.head).map(t => esc(t.name)).join('، ') || 'لا يوجد — حدّدهم من زر "قواعد وملاحظات" في تبويب المعلمين'}</p>
    <div class="grid">
     <div><label>أقصى حصص في اليوم</label><input type="number" min="0" data-g="headMaxDay" value="${R.headMaxDay || ''}" placeholder="بدون حد"></div>
     <div><label>أقصى حصص متتالية</label><input type="number" min="0" data-g="headMaxConsec" value="${R.headMaxConsec || ''}" placeholder="بدون حد"></div>
     <div><label>حصص يومية ممنوعة</label><div>${Array.from({ length: P() }, (_, p) => `<label style="display:inline-flex;flex-direction:column;align-items:center;font-size:11px;color:var(--ink)"><input type="checkbox" data-hnp value="${p}" ${(R.headNoP || []).includes(p) ? 'checked' : ''}>${p + 1}</label>`).join('')}</div></div>
     <div><label>أوقات محجوزة (اجتماعات/إشراف)</label><button class="btn o s" id="headSlots">تحديد (${(R.headSlots || []).length})</button></div>
    </div></div>
   <div class="card"><h2>قواعد خاصة بكل قسم</h2><p class="mute">تُطبَّق على كل معلمي القسم. "اجتماع القسم": حصص يكون فيها كل معلمي القسم بدون حصص.</p>
    <div class="scroll"><table class="t"><tr><th>القسم</th><th>أقصى/يوم للمعلم</th><th>أقصى متتالية</th><th>حصص ممنوعة لمعلمي القسم</th><th>اجتماع القسم</th></tr>
    ${S.subjects.map((s, i) => `<tr><th style="background:${s.color}">${esc(s.name)}</th>
     <td><input type="number" min="0" data-ds="${i}" data-k="tMaxDay" value="${s.tMaxDay || ''}" placeholder="—" style="width:70px"></td>
     <td><input type="number" min="0" data-ds="${i}" data-k="tMaxConsec" value="${s.tMaxConsec || ''}" placeholder="—" style="width:70px"></td>
     <td style="white-space:nowrap">${Array.from({ length: P() }, (_, p) => `<label style="display:inline-flex;flex-direction:column;align-items:center;font-size:11px;color:var(--ink)"><input type="checkbox" data-dnp="${i}" value="${p}" ${(s.tNoP || []).includes(p) ? 'checked' : ''}>${p + 1}</label>`).join('')}</td>
     <td><button class="btn o s" data-meet="${i}">تحديد (${(s.meet || []).length})</button></td></tr>`).join('')}
    </table></div></div>
   <div class="card"><h2>ملاحظات المعلمين 📝</h2>${S.teachers.filter(t => t.notes).map(t => `<div style="border-right:5px solid ${subColor(t.sub)};padding:4px 8px;margin:4px 0"><b>${esc(t.name)}</b>: ${esc(t.notes)} <button class="btn o s" data-tn="${t.id}">تعديل</button></div>`).join('') || '<p class="mute">لا توجد ملاحظات. أضفها من زر "قواعد وملاحظات" في تبويب المعلمين.</p>'}</div>
   <div class="card"><h2>فحص البيانات قبل التوليد</h2>${checkData().map(([k, m]) => `<div class="${k}">${k === 'ok' ? '✓' : '⚠'} ${esc(m)}</div>`).join('')}</div>
   <div class="card"><h2>إحصائيات الجدول</h2>${stats()}</div>${nextBtn('tt')}`;
  $('#rSpread').onchange = e => { R.spread = e.target.checked; save(); };
  $('#rGaps').onchange = e => { R.gaps = e.target.checked; save(); };
  $('#main').querySelectorAll('[data-g]').forEach(i => i.onchange = e => { R[i.dataset.g] = +e.target.value || 0; save(); render(); });
  $('#main').querySelectorAll('[data-hnp]').forEach(i => i.onchange = () => { R.headNoP = [...$('#main').querySelectorAll('[data-hnp]:checked')].map(x => +x.value); save(); });
  $('#headSlots').onclick = () => { R.headSlots ||= []; slotDialog('أوقات محجوزة لرؤساء الشعب', R.headSlots, render); };
  $('#main').querySelectorAll('[data-ds]').forEach(i => i.onchange = e => { S.subjects[+i.dataset.ds][i.dataset.k] = +e.target.value || 0; save(); render(); });
  $('#main').querySelectorAll('[data-dnp]').forEach(i => i.onchange = () => { S.subjects[+i.dataset.dnp].tNoP = [...$('#main').querySelectorAll(`[data-dnp="${i.dataset.dnp}"]:checked`)].map(x => +x.value); save(); });
  $('#main').querySelectorAll('[data-meet]').forEach(b => b.onclick = () => { const s = S.subjects[+b.dataset.meet]; s.meet ||= []; slotDialog('اجتماع قسم ' + esc(s.name), s.meet, render); });
  $('#main').querySelectorAll('[data-tn]').forEach(b => b.onclick = () => teacherDialog(tch(b.dataset.tn)));
};
function stats() {
  const rows = S.teachers.map(t => {
    const cs = S.cards.filter(c => c.d != null && c.teachers.includes(t.id));
    let gaps = 0; for (let d = 0; d < 5; d++) { const ps = cs.filter(c => c.d === d).flatMap(c => Array.from({ length: c.len }, (_, k) => c.p + k)).sort((a, b) => a - b); if (ps.length) gaps += ps[ps.length - 1] - ps[0] + 1 - ps.length; }
    return [t, cs.reduce((a, c) => a + c.len, 0), gaps];
  });
  const tg = rows.reduce((a, r) => a + r[2], 0);
  return `<p>إجمالي الفراغات لدى المعلمين: <b>${tg}</b> — الحصص الموضوعة: <b>${S.cards.filter(c => c.d != null).length}</b> من ${S.cards.length}</p>
  <div class="scroll" style="max-height:300px;overflow:auto"><table class="t"><tr><th>المعلم</th><th>الحصص</th><th>الفراغات</th></tr>${rows.map(([t, n, g]) => `<tr><td style="text-align:right;border-right:6px solid ${subColor(t.sub)}">${esc(t.name)}</td><td>${n}</td><td class="${g > 4 ? 'warn' : ''}">${g}</td></tr>`).join('')}</table></div>`;
}

/* ===================== 5) المولّد ===================== */
function generate(keepPlaced) {
  syncCards();
  const D = 5, PP = P(), cards = S.cards, R = S.rules;
  const occ = {}; const cell = k => occ[k] || (occ[k] = Array.from({ length: D }, () => Array(PP).fill(-1)));
  const unav = {}, tMax = {}, tCons = {}; S.teachers.forEach(t => { const e = effT(t.id); unav[t.id] = e.unav; tMax[t.id] = e.max; tCons[t.id] = e.consec; });
  const runLen = (row, p, len) => { let n = len, a = p - 1; while (a >= 0 && row[a] >= 0) { n++; a--; } let b = p + len; while (b < PP && row[b] >= 0) { n++; b++; } return n; };
  const tDay = {}; const tdk = (t, d) => t + '|' + d;
  const cnt = {}; cards.forEach(c => { const k = c.cls + '|' + c.sub; cnt[k] = (cnt[k] || 0) + 1; });
  const perDayMax = {}; for (const k in cnt) { const s = sub(k.split('|')[1]); perDayMax[k] = s?.maxDay ? Math.max(1, s.maxDay) : Math.ceil(cnt[k] / D); }
  const subRooms = {}; S.subjects.forEach(s => subRooms[s.id] = roomsFor(s.id));
  const noP = {}; S.subjects.forEach(s => noP[s.id] = new Set(s.noP || []));
  const dayCount = {}; const dk = (c, d) => c.cls + '|' + c.sub + '|' + d;
  const put = (i, d, p, room) => { const c = cards[i]; c.d = d; c.p = p; c.room = room || null; for (let k = 0; k < c.len; k++) { cell('c' + c.cls)[d][p + k] = i; c.teachers.forEach(t => cell('t' + t)[d][p + k] = i); if (room) cell('r' + room)[d][p + k] = i; } c.teachers.forEach(t => tDay[tdk(t, d)] = (tDay[tdk(t, d)] || 0) + c.len); dayCount[dk(c, d)] = (dayCount[dk(c, d)] || 0) + 1; };
  const take = i => { const c = cards[i]; if (c.d == null) return; for (let k = 0; k < c.len; k++) { cell('c' + c.cls)[c.d][c.p + k] = -1; c.teachers.forEach(t => cell('t' + t)[c.d][c.p + k] = -1); if (c.room) cell('r' + c.room)[c.d][c.p + k] = -1; } c.teachers.forEach(t => tDay[tdk(t, c.d)] -= c.len); dayCount[dk(c, c.d)]--; c.d = c.p = null; c.room = null; };
  // يرجع [قائمة البطاقات المتعارضة، القاعة] أو null إن كان مستحيلاً
  const conflicts = (i, d, p) => {
    const c = cards[i]; if (p + c.len > PP) return null;
    const set = new Set();
    for (let k = 0; k < c.len; k++) {
      if (noP[c.sub]?.has(p + k)) return null;
      for (const t of c.teachers) { if (unav[t]?.has(d + ':' + (p + k))) return null; const o = cell('t' + t)[d][p + k]; if (o >= 0) set.add(o); }
      const o = cell('c' + c.cls)[d][p + k]; if (o >= 0) set.add(o);
    }
    for (const t of c.teachers) if (tCons[t] < 99 && runLen(cell('t' + t)[d], p, c.len) > tCons[t]) return null;
    for (const t of c.teachers) if ((tDay[tdk(t, d)] || 0) + c.len > tMax[t]) {
      // أزح حصص المعلم الأخرى في هذا اليوم إن لزم
      let over = (tDay[tdk(t, d)] || 0) + c.len - tMax[t];
      for (const [j, o] of cards.entries()) { if (over <= 0) break; if (j !== i && o.d === d && o.teachers.includes(t) && !set.has(j)) { set.add(j); over -= o.len; } }
    }
    if ((dayCount[dk(c, d)] || 0) >= perDayMax[c.cls + '|' + c.sub]) cards.forEach((o, j) => { if (j !== i && o.d === d && o.cls === c.cls && o.sub === c.sub) set.add(j); });
    let room = null; const rs = subRooms[c.sub];
    if (rs.length) {
      let best = null;
      for (const r of rs) { const occs = new Set(); for (let k = 0; k < c.len; k++) { const o = cell('r' + r)[d][p + k]; if (o >= 0) occs.add(o); } if (!best || occs.size < best[1].size) best = [r, occs]; if (!occs.size) break; }
      room = best[0]; best[1].forEach(j => set.add(j));
    }
    for (const j of set) if (cards[j].locked) return null;
    return [[...set], room];
  };
  const gapCost = (c, d, p) => {
    if (!R.gaps) return 0; let sc = 0;
    for (const t of c.teachers) { const row = cell('t' + t)[d]; const has = row.some(x => x >= 0); if (!has) continue; const adj = (p > 0 && row[p - 1] >= 0) || (p + c.len < PP && row[p + c.len] >= 0); if (!adj) sc += 6; }
    return sc;
  };
  cards.forEach((c, i) => { const d = c.d, p = c.p; c.d = c.p = null; c.room = null; if ((c.locked || keepPlaced) && d != null && p != null && p + c.len <= PP) { const cf = conflicts(i, d, p); if (cf && !cf[0].length) put(i, d, p, cf[1]); } });
  const tLoad = {}; cards.forEach(c => c.teachers.forEach(t => tLoad[t] = (tLoad[t] || 0) + c.len));
  const diff = i => { const c = cards[i]; return c.len * 10 + c.teachers.reduce((a, t) => a + tLoad[t], 0) / 3 + (c.teachers.length > 1 ? 30 : 0) + (subRooms[c.sub].length ? 20 : 0) + (noP[c.sub].size * 3); };
  let queue = cards.map((_, i) => i).filter(i => cards[i].d == null && cards[i].teachers.length).sort((a, b) => diff(b) - diff(a));
  const t0 = Date.now(); let iter = 0; const tabu = new Map();
  while (queue.length && Date.now() - t0 < 15000) {
    iter++;
    const i = queue.shift(); const c = cards[i];
    let best = null, bestScore = 1e9;
    for (let d = 0; d < D; d++) for (let p = 0; p + c.len <= PP; p++) {
      const cf = conflicts(i, d, p); if (!cf) continue;
      let sc = cf[0].length * 100 + Math.random() * 10;
      for (const j of cf[0]) if (tabu.get(i + ':' + j) > iter) sc += 400;
      if (R.spread) sc += (dayCount[dk(c, d)] || 0) * 25;
      sc += gapCost(c, d, p);
      if (sc < bestScore) { bestScore = sc; best = [d, p, cf]; }
    }
    if (!best) continue;
    const [d, p, [cf, room]] = best;
    cf.forEach(j => { tabu.set(j + ':' + i, iter + 20); take(j); queue.push(j); });
    put(i, d, p, room);
  }
  // تحسين: تقليل فراغات المعلمين بنقل الحصص إلى خانات فارغة أفضل
  if (R.gaps && !queue.length) {
    for (let pass = 0; pass < 3; pass++) cards.forEach((c, i) => {
      if (c.locked || c.d == null) return;
      const od = c.d, op = c.p, oroom = c.room; take(i);
      let best = [od, op, oroom], bs = gapCost(c, od, op) + (R.spread ? (dayCount[dk(c, od)] || 0) * 25 : 0) - 0.5;
      for (let d = 0; d < D; d++) for (let p = 0; p + c.len <= PP; p++) { const cf = conflicts(i, d, p); if (!cf || cf[0].length) continue; const sc = gapCost(c, d, p) + (R.spread ? (dayCount[dk(c, d)] || 0) * 25 : 0); if (sc < bs) { bs = sc; best = [d, p, cf[1]]; } }
      put(i, ...best);
    });
  }
  save();
  return { un: cards.filter(c => c.d == null && c.teachers.length).length, noT: cards.filter(c => !c.teachers.length).length, ms: Date.now() - t0 };
}

/* ===================== 6) الجدول والتعديل اليدوي ===================== */
let ttView = 'mclass', ttSel = null, selCard = null, dragCard = null;
function occMaps() {
  const cls = {}, t = {};
  S.cards.forEach(c => { if (c.d == null) return; for (let k = 0; k < c.len; k++) { (cls[c.cls + '|' + c.d + '|' + (c.p + k)] ||= []).push(c); c.teachers.forEach(x => (t[x + '|' + c.d + '|' + (c.p + k)] ||= []).push(c)); } });
  return { cls, t };
}
function canMove(card, d, p, ignore = []) {
  if (p + card.len > P() || p < 0) return 'خارج عدد الحصص';
  const s = sub(card.sub);
  for (let k = 0; k < card.len; k++) if ((s?.noP || []).includes(p + k)) return `${s.name} ممنوعة في الحصة ${ORD[p + k]}`;
  const others = S.cards.filter(o => o !== card && !ignore.includes(o) && o.d === d);
  for (let k = 0; k < card.len; k++) {
    for (const o of others) if (p + k >= o.p && p + k < o.p + o.len) {
      if (o.cls === card.cls) return `الفصل ${o.cls} مشغول`;
      const t = o.teachers.find(x => card.teachers.includes(x)); if (t) return `${tch(t).name} لديه حصة في ${o.cls}`;
    }
    for (const t of card.teachers) if (effT(t).unav.has(d + ':' + (p + k))) return `${tch(t).name} غير متاح (قاعدة)`;
  }
  for (const t of card.teachers) { const c = effT(t).consec; if (c < 99) { const occ = new Set(others.filter(o => o.teachers.includes(t)).flatMap(o => Array.from({ length: o.len }, (_, k) => o.p + k))); let n = card.len, a = p - 1; while (occ.has(a)) { n++; a--; } let b = p + card.len; while (occ.has(b)) { n++; b++; } if (n > c) return `${tch(t).name} تجاوز ${c} حصص متتالية`; } }
  for (const t of card.teachers) { const m = effT(t).max < 99 ? effT(t).max : 0; if (m && others.filter(o => o.teachers.includes(t)).reduce((a, o) => a + o.len, 0) + card.len > m) return `${tch(t).name} تجاوز أقصى ${m} حصص في اليوم`; }
  const mx = s?.maxDay || Math.ceil(S.cards.filter(o => o.cls === card.cls && o.sub === card.sub).length / 5);
  if (others.filter(o => o.cls === card.cls && o.sub === card.sub).length >= mx) return `${s.name} وصلت الحد الأقصى في هذا اليوم`;
  const rs = roomsFor(card.sub);
  if (rs.length) { const free = rs.find(r => !others.some(o => o.room === r && p < o.p + o.len && o.p < p + card.len)); if (!free) return 'لا توجد قاعة متاحة'; card._room = free; }
  return '';
}
function moveCard(card, d, p) {
  const tgt = S.cards.filter(o => o !== card && o.d === d && o.cls === card.cls && p < o.p + o.len && o.p < p + card.len);
  if (card.locked) return toast('الحصة مقفلة');
  if (!tgt.length) {
    const err = canMove(card, d, p); if (err) return toast('لا يمكن: ' + err);
    snap(); card.d = d; card.p = p; card.room = card._room || null; save(); return true;
  }
  if (tgt.length > 1 || tgt[0].locked || card.d == null || tgt[0].len !== card.len) return toast(card.d == null ? 'اختر خانة فارغة للحصة غير الموضوعة' : 'لا يمكن التبديل مع هذه الحصة');
  const c = tgt[0], a = { d: card.d, p: card.p }, b = { d: c.d, p: c.p };
  const e1 = canMove(card, b.d, b.p, [c]); const r1 = card._room; const e2 = canMove(c, a.d, a.p, [card]); const r2 = c._room;
  if (e1 || e2) return toast('لا يمكن التبديل: ' + (e1 || e2));
  snap(); card.d = b.d; card.p = b.p; card.room = r1 || null; c.d = a.d; c.p = a.p; c.room = r2 || null; save(); return true;
}
const cardHtml = (c, mode) => `<div class="cardx" draggable="${c.locked ? 'false' : 'true'}" data-cid="${c.id}" style="background:${subColor(c.sub)}">${esc(subShort(c.sub))}${mode === 'cls' ? '' : `<small>${mode === 'teacher' ? c.cls : c.teachers.map(t => esc(tch(t)?.name.split(' ')[0])).join('+')}</small>`}</div>`;
VIEWS.tt = () => {
  const placed = S.cards.filter(c => c.d != null).length, un = S.cards.filter(c => c.d == null && c.teachers.length);
  const master = ttView[0] === 'm';
  const byTeacher = ttView.endsWith('teacher');
  const list = byTeacher ? S.subjects.flatMap(s => S.teachers.filter(t => t.sub === s.id)).map(t => [t.id, t.name]) : classes().map(c => [c, c]);
  if (!ttSel || !list.find(x => x[0] === ttSel)) ttSel = list[0]?.[0];
  const om = occMaps();
  const cellOf = (key, d, p) => byTeacher ? (om.t[key + '|' + d + '|' + p] || []) : (om.cls[key + '|' + d + '|' + p] || []);
  const td = (key, d, p, mode) => {
    const cs = cellOf(key, d, p), c = cs[0];
    const una = byTeacher && effT(key).unav.has(d + ':' + p);
    return `<td class="cell ${c && c === selCard ? 'sel' : ''} ${c?.locked ? 'lock' : ''} ${una ? 'unav' : ''} ${cs.length > 1 ? 'clash' : ''} ${p === P() - 1 ? 'dend' : ''}" data-k="${key}" data-d="${d}" data-p="${p}">${c ? cardHtml(c, mode) : ''}</td>`;
  };
  let grid;
  if (master) {
    grid = `<table class="t tt master"><thead><tr><th rowspan="2" class="stick">${byTeacher ? 'المعلم' : 'الفصل'}</th>${DAYS.map(d => `<th colspan="${P()}" class="dend">${d}</th>`).join('')}</tr><tr>${DAYS.map(() => Array.from({ length: P() }, (_, p) => `<th class="${p === P() - 1 ? 'dend' : ''}">${p + 1}</th>`).join('')).join('')}</tr></thead>
    <tbody>${list.map(([k, v]) => `<tr><th class="stick" style="${byTeacher ? `border-right:6px solid ${subColor(tch(k).sub)}` : ''}">${esc(v)}</th>${DAYS.map((_, d) => Array.from({ length: P() }, (_, p) => td(k, d, p, byTeacher ? 'teacher' : 'cls')).join('')).join('')}</tr>`).join('')}</tbody></table>`;
  } else {
    grid = `<table class="t tt"><tr><th></th>${Array.from({ length: P() }, (_, p) => `<th>${ORD[p]}</th>`).join('')}</tr>
    ${DAYS.map((dn, d) => `<tr><th>${dn}</th>${Array.from({ length: P() }, (_, p) => td(ttSel, d, p, byTeacher ? 'teacher' : 'class')).join('')}</tr>`).join('')}</table>`;
  }
  $('#main').innerHTML = `
  <div class="ribbon">
   <button class="rb" id="gen"><b>⚙</b>توليد</button>
   <button class="rb" id="gen2"><b>➕</b>إكمال</button>
   <button class="rb" id="und"><b>↶</b>تراجع</button>
   <button class="rb" id="clr"><b>🗑</b>مسح غير المقفل</button>
   <button class="rb" id="lockAll"><b>🔒</b>قفل الكل</button>
   <button class="rb" id="unlockAll2"><b>🔓</b>فك الكل</button>
   <span class="sep"></span>
   <select id="vw"><option value="mclass">كل الفصول</option><option value="mteacher">كل المعلمين</option><option value="class">فصل واحد</option><option value="teacher">معلم واحد</option></select>
   ${master ? '' : `<select id="who">${list.map(([k, v]) => `<option value="${k}" ${k === ttSel ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`}
   <span class="sep"></span>
   <span class="mute">${placed}/${S.cards.length} موضوعة${un.length ? ` · <b class="warn">${un.length} غير موضوعة</b>` : ' · <b class="ok">مكتمل</b>'}</span>
  </div>
  ${selCard ? `<div class="selbar"><span class="pill" style="background:${subColor(selCard.sub)}">${esc(sub(selCard.sub)?.name)} — ${selCard.cls} — ${selCard.teachers.map(t => esc(tch(t)?.name)).join(' + ')}${selCard.room ? ' — ' + esc(S.rooms.find(r => r.id === selCard.room)?.name) : ''}</span><button class="btn o s" id="lk">${selCard.locked ? '🔓 فك القفل' : '🔒 قفل'}</button><button class="btn o s" id="rmv">إزالة من الجدول</button><button class="btn o s" id="cs">إلغاء التحديد</button></div>` : ''}
  <div class="legend">${S.subjects.map(s => `<span style="background:${s.color}">${esc(s.short || s.name)}</span>`).join('')}</div>
  <div class="gridwrap">${grid}</div>
  <div class="card" style="margin-top:12px"><h2>الحصص غير الموضوعة ${un.length ? `(${un.length})` : ''}</h2>
   ${un.length ? `<div class="chips">${un.map(c => `<span class="cardx" draggable="true" data-cid="${c.id}" style="background:${subColor(c.sub)};${c === selCard ? 'outline:2px solid #000' : ''}">${esc(subShort(c.sub))} ${c.cls}${c.len > 1 ? ' ×2' : ''}</span>`).join('')}</div><p class="mute">اسحبها إلى خانة فارغة، أو اضغط عليها ثم على الخانة.</p>` : '<p class="ok">✓ كل الحصص موضوعة</p>'}
   ${S.cards.some(c => !c.teachers.length) ? `<p class="warn">⚠ ${S.cards.filter(c => !c.teachers.length).length} حصة بدون معلم — راجع تبويب التوزيع</p>` : ''}
  </div>`;
  $('#vw').value = ttView;
  const run = keep => {
    if (!S.cards.length) syncCards(); if (!S.cards.length) return toast('أدخل المواد والمعلمين أولاً');
    const bad = checkData().filter(x => x[0] === 'bad'); if (bad.length && !confirm('توجد مشاكل في البيانات:\n' + bad.map(x => x[1]).join('\n') + '\n\nمتابعة التوليد؟')) return;
    snap(); $('#gen').disabled = true; $('#gen').innerHTML = '<b>⏳</b>جارٍ...';
    setTimeout(() => { const r = generate(keep); selCard = null; render(); toast(r.un ? `تم مع ${r.un} حصة لم تُوضع — اضغط "إكمال" أو راجع القواعد والفحص` : `✓ اكتمل الجدول خلال ${(r.ms / 1000).toFixed(1)} ث`, 5000); }, 30);
  };
  $('#gen').onclick = () => { if (S.cards.some(c => c.d != null && !c.locked) && !confirm('سيُعاد توليد كل الحصص غير المقفلة. متابعة؟')) return; run(false); };
  $('#gen2').onclick = () => run(true);
  $('#und').onclick = undo;
  $('#clr').onclick = () => { if (!confirm('مسح كل الحصص غير المقفلة؟')) return; snap(); S.cards.forEach(c => { if (!c.locked) { c.d = c.p = null; c.room = null; } }); save(); render(); };
  $('#lockAll').onclick = () => { S.cards.forEach(c => { if (c.d != null) c.locked = true; }); save(); render(); toast('تم قفل كل الحصص الموضوعة'); };
  $('#unlockAll2').onclick = () => { S.cards.forEach(c => c.locked = false); save(); render(); };
  $('#vw').onchange = e => { ttView = e.target.value; ttSel = null; render(); };
  if ($('#who')) $('#who').onchange = e => { ttSel = e.target.value; render(); };
  if ($('#lk')) { $('#lk').onclick = () => { selCard.locked = !selCard.locked; save(); render(); }; $('#rmv').onclick = () => { if (selCard.locked) return toast('فك القفل أولاً'); snap(); selCard.d = selCard.p = null; selCard.room = null; selCard = null; save(); render(); }; $('#cs').onclick = () => { selCard = null; render(); }; }
  const byId = id => S.cards.find(c => c.id === id);
  $('#main').querySelectorAll('.chips [data-cid]').forEach(s => s.onclick = () => { selCard = byId(s.dataset.cid); render(); });
  $('#main').querySelectorAll('[draggable=true]').forEach(el => el.ondragstart = e => { dragCard = byId(el.dataset.cid); e.dataTransfer.setData('text/plain', el.dataset.cid); e.dataTransfer.effectAllowed = 'move'; });
  const okRow = (card, key) => byTeacher ? card.teachers.includes(key) : card.cls === key;
  $('#main').querySelectorAll('td.cell').forEach(td => {
    const key = td.dataset.k, d = +td.dataset.d, p = +td.dataset.p;
    td.ondragover = e => { if (dragCard && okRow(dragCard, key)) { e.preventDefault(); td.classList.add('over'); } };
    td.ondragleave = () => td.classList.remove('over');
    td.ondrop = e => { e.preventDefault(); td.classList.remove('over'); const c = dragCard; dragCard = null; if (c && moveCard(c, d, p)) { selCard = null; render(); } };
    td.onclick = () => {
      const c = cellOf(key, d, p)[0];
      if (!selCard) { if (c) { selCard = c; render(); } return; }
      if (c === selCard) { selCard = null; render(); return; }
      if (!okRow(selCard, key)) { selCard = c || null; render(); return; }
      if (moveCard(selCard, d, p)) { selCard = null; render(); }
    };
  });
  // تمييز الخانات المتاحة أثناء التحديد
  if (selCard) $('#main').querySelectorAll('td.cell').forEach(td => { if (!okRow(selCard, td.dataset.k) || cellOf(td.dataset.k, +td.dataset.d, +td.dataset.p).length) return; if (!canMove(selCard, +td.dataset.d, +td.dataset.p)) td.classList.add('can'); });
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
    if (!S.cards.some(c => c.d === day && c.teachers.includes(id))) { toast('هذا المعلم ليس لديه حصص في هذا اليوم'); return; }
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
    ts.forEach((t, i) => rows += `<tr style="background:${COLORPRINT ? s.color : 'transparent'}">${i === 0 ? `<td class="dep" rowspan="${ts.length}" style="background:${s.color}">${esc(s.name)}</td>` : ''}<td>${i + 1}</td><td class="nm">${esc(t.name)}</td>${teacherRowCells(om, t.id)}</tr>`);
  }
  const cols = `<colgroup><col style="width:70px"><col style="width:22px"><col style="width:150px">${'<col>'.repeat(5 * P())}</colgroup>`;
  return page('الجدول المدرسي', `<table class="sm">${cols}<thead>${dayHead('<th rowspan="2">القسم</th><th rowspan="2">الرقم</th><th rowspan="2">اسم المعلم</th>')}${perHead()}</thead><tbody>${rows}</tbody></table>`);
}
function printClasses(only) {
  const om = occMaps();
  return (only ? [only] : classes()).map(c => page(`الجدول الأسبوعي للصف ${c}`, `<div class="cls"><table><tr><th style="width:90px"></th>${PH().map(p => `<th>الحصة ${ORD[p]}</th>`).join('')}</tr>
   ${DAYS.map((dn, d) => `<tr><th>${dn}</th>${PH().map(p => { const x = (om.cls[c + '|' + d + '|' + p] || [])[0]; return `<td style="background:${x && COLORPRINT ? subColor(x.sub) : ''}">${x ? `<b>${esc(subShort(x.sub))}</b><small>${x.teachers.map(t => esc(tch(t)?.name || '')).join(' + ')}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</table></div>`, 'landscape', 'cls')).join('');
}
function printTeachers(mode, sel) {
  const om = occMaps();
  const groups = mode === 'dept' ? S.subjects.filter(s => !sel || s.id === sel).map(s => [s.name, S.teachers.filter(t => t.sub === s.id)]).filter(g => g[1].length)
    : S.teachers.filter(t => !sel || t.id === sel).map(t => [t.name, [t]]);
  return groups.map(([title, ts]) => page(mode === 'dept' ? 'جدول قسم ' + esc(title) : 'جدول المعلم: ' + esc(title),
    `<table style="font-size:11px"><colgroup><col style="width:160px">${'<col>'.repeat(5 * P())}</colgroup>${dayHead('<th rowspan="2">اسم المعلم</th>')}${perHead()}
     ${ts.map(t => `<tr style="height:30px"><td class="nm">${esc(t.name)}</td>${teacherRowCells(om, t.id)}</tr>`).join('')}</table>
     <p style="font-size:12px">${ts.map(t => `${esc(t.name)}: ${S.cards.filter(c => c.d != null && c.teachers.includes(t.id)).reduce((a, c) => a + c.len, 0)} حصة`).join(' &nbsp;|&nbsp; ')}</p>${ts.filter(t => t.notes).map(t => `<p style="font-size:12px"><b>ملاحظات ${esc(t.name)}:</b> ${esc(t.notes)}</p>`).join('')}`)).join('');
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
let lastPrint = ''; let COLORPRINT = true;
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
   <label style="display:flex;gap:4px;color:var(--ink);margin:0"><input type="checkbox" id="pcol" ${COLORPRINT ? 'checked' : ''}>طباعة ملونة</label><button class="btn" id="pp">🖨 طباعة / حفظ PDF</button><button class="btn o" id="px">⬇ تصدير Excel</button></div>
   <p class="mute">المعاينة أدناه. اختر "حفظ كـ PDF" من نافذة الطباعة لحفظ ملف.</p></div>
   <div class="scroll" style="background:#fff;border:1px solid var(--line);border-radius:8px"><div class="pv" style="min-width:1000px">${html}</div></div>`;
  $('#pk').onchange = e => { VIEWS.print.k = e.target.value; VIEWS.print.sel = ''; render(); };
  if ($('#ps')) $('#ps').onchange = e => { VIEWS.print.sel = e.target.value; render(); };
  $('#pcol').onchange = e => { COLORPRINT = e.target.checked; render(); };
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
