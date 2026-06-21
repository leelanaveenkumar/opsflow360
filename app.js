/* OpsFlow360 - static portfolio dashboard using synthetic operations data.
   This is a demo app only. It does not use real employer data. */
const APP = {
  user: null,
  route: 'dashboard',
  rows: [],
  filtered: [],
  uploaded: false,
  sort: { key: 'date', dir: 'desc' },
  page: 1,
  filters: {
    preset: 'last30', start: '2026-04-01', end: '2026-04-30', station: 'All', department: 'All', shift: 'All', process_path: 'All'
  }
};

const STATIONS = ['LHR-East', 'DRT-London', 'BHX-Midlands', 'MAN-North', 'BRS-West', 'EMA-Central'];
const DEPARTMENTS = ['Inbound', 'Stow', 'Pick', 'Pack', 'SLAM', 'Dispatch'];
const SHIFTS = ['Morning', 'Twilight', 'Night'];
const PROCESS_PATHS = {
  Inbound: ['Receive', 'Decant'],
  Stow: ['Random Stow', 'Pod Replenishment'],
  Pick: ['Single Pick', 'Multi Pick'],
  Pack: ['Pack Single', 'Pack Multi'],
  SLAM: ['Scan Label Apply Manifest', 'Problem Solve'],
  Dispatch: ['Ship Sort', 'Truck Load']
};
const ROLE_ACCESS = {
  Admin: ['dashboard','departments','capacity','reports'],
  Manager: ['dashboard','departments','capacity','reports'],
  Viewer: ['dashboard','departments','capacity','reports']
};
const NAV = [
  ['dashboard','📊','Dashboard'],
  ['departments','🏭','Department Summary'],
  ['capacity','🧮','Shift Planning'],
  ['reports','⬇️','Reports']
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function fmt(n, digits = 0) { return Number(n || 0).toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits }); }
function pct(n, digits = 1) { return `${fmt(n, digits)}%`; }
function money(n) { return `£${fmt(n, 2)}`; }
function parseDate(v) { return new Date(`${v}T00:00:00`); }
function isoDate(d) { return d.toISOString().slice(0,10); }
function daysBetween(start, end) {
  const out = [];
  let d = parseDate(start);
  const stop = parseDate(end);
  while (d <= stop) { out.push(isoDate(d)); d.setDate(d.getDate()+1); }
  return out;
}
function escapeHtml(str='') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

function initialUsers() {
  return [
    { id: 1, name: 'Leela Naveen Kumar Guduru', email: 'admin@opsflow360.demo', username: 'admin', password: '1000', role: 'Admin', modules: ROLE_ACCESS.Admin },
    { id: 2, name: 'Operations Manager Demo', email: 'manager@opsflow360.demo', username: 'manager', password: '1000', role: 'Manager', modules: ROLE_ACCESS.Manager },
    { id: 3, name: 'Recruiter Viewer Demo', email: 'viewer@opsflow360.demo', username: 'viewer', password: '1000', role: 'Viewer', modules: ROLE_ACCESS.Viewer }
  ];
}
function getUsers() {
  const stored = localStorage.getItem('opsflow_users');
  if (!stored) { localStorage.setItem('opsflow_users', JSON.stringify(initialUsers())); return initialUsers(); }
  try { return JSON.parse(stored); } catch { return initialUsers(); }
}
function saveUsers(users) { localStorage.setItem('opsflow_users', JSON.stringify(users)); }

function generateSyntheticData() {
  const existing = localStorage.getItem('opsflow_uploaded_rows');
  if (existing) {
    try { APP.uploaded = true; return JSON.parse(existing); } catch { localStorage.removeItem('opsflow_uploaded_rows'); }
  }
  const rows = [];
  const dates = daysBetween('2025-01-01', '2026-04-30');
  let id = 1;
  dates.forEach((date, di) => {
    const month = parseDate(date).getMonth()+1;
    const peak = [10,11,12].includes(month) ? 1.35 : month === 7 ? 1.12 : 1;
    STATIONS.forEach((station, si) => {
      DEPARTMENTS.forEach((department, depi) => {
        SHIFTS.forEach((shift, shi) => {
          const seed = id * 13 + di * 7 + si * 11 + depi * 17 + shi * 19;
          const rand = seededRandom(seed);
          const stationFactor = [1.02, 0.96, 1.08, 0.92, 0.98, 1.04][si];
          const deptBase = { Inbound: 5200, Stow: 4750, Pick: 6100, Pack: 5750, SLAM: 5600, Dispatch: 5900 }[department];
          const shiftFactor = { Morning: 1.05, Twilight: 0.96, Night: 0.91 }[shift];
          const planned = Math.round(deptBase * peak * stationFactor * shiftFactor * (0.86 + rand * 0.28));
          const process_path = PROCESS_PATHS[department][Math.floor(rand * PROCESS_PATHS[department].length)];
          const labour = Math.round((planned / (department === 'Pick' ? 95 : department === 'Pack' ? 88 : 80)) * (0.92 + rand * 0.22));
          const incidentBase = department === 'Dispatch' || department === 'Inbound' ? 0.18 : 0.08;
          const safetyIncidents = seededRandom(seed + 4) > 0.965 ? 2 : (seededRandom(seed + 5) > 0.86 ? 1 : 0);
          const defectRate = clamp((department === 'Pack' ? 1.6 : department === 'SLAM' ? 1.25 : 0.9) + (0.8-rand) * 1.2 + (shift === 'Night' ? 0.22 : 0), 0.15, 5.8);
          const actual = Math.round(planned * clamp(0.86 + seededRandom(seed+2) * 0.25 - (safetyIncidents*0.015), 0.78, 1.12));
          const actualLabour = Math.max(1, Math.round(labour * (0.88 + seededRandom(seed+3)*0.32)));
          const uph = actual / actualLabour;
          const backlog = Math.max(0, planned - actual + Math.round(seededRandom(seed+6)*120));
          const sla = Math.round(clamp((backlog / Math.max(1, planned)) * 100 + seededRandom(seed+7)*8, 0, 24));
          const onTime = clamp(99.2 - (sla*0.75) - safetyIncidents*1.2 + seededRandom(seed+8)*2, 72, 99.9);
          const absenteeism = clamp(2.5 + seededRandom(seed+9)*7.5 + (shift === 'Night' ? 1.4 : 0), 1, 15);
          const cpu = clamp(0.18 + (actualLabour / Math.max(actual, 1)) * 11 + seededRandom(seed+10)*0.08, 0.22, 0.85);
          rows.push({
            id: id++, date, station, department, shift, process_path,
            planned_volume: planned, actual_volume: actual,
            planned_labour_hours: labour, actual_labour_hours: actualLabour,
            units_per_hour: Number(uph.toFixed(2)), defects: Math.round(actual * defectRate / 100),
            defect_rate: Number(defectRate.toFixed(2)), backlog,
            on_time_dispatch_pct: Number(onTime.toFixed(2)), sla_breaches: sla,
            safety_incidents: safetyIncidents, absenteeism_pct: Number(absenteeism.toFixed(2)),
            cost_per_unit: Number(cpu.toFixed(2)),
            manager_notes: buildManagerNote(department, backlog, onTime, defectRate, safetyIncidents)
          });
        });
      });
    });
  });
  return rows;
}
function buildManagerNote(dept, backlog, onTime, defect, incidents) {
  if (incidents > 0) return 'Safety coaching and area standard check required.';
  if (backlog > 700) return `${dept} backlog above expected level; review labour allocation and flow.`;
  if (onTime < 92) return 'Dispatch/SLA watch: investigate handoff and sorter availability.';
  if (defect > 3) return 'Quality watch: refresh standard work and audit sample orders.';
  return 'On track. Continue hourly performance monitoring.';
}

function applyFilters() {
  const f = APP.filters;
  APP.filtered = APP.rows.filter(r => {
    return r.date >= f.start && r.date <= f.end &&
      (f.station === 'All' || r.station === f.station) &&
      (f.department === 'All' || r.department === f.department) &&
      (f.shift === 'All' || r.shift === f.shift) &&
      (f.process_path === 'All' || r.process_path === f.process_path);
  });
}
function sum(rows, key) { return rows.reduce((a,b)=>a+Number(b[key]||0),0); }
function avg(rows, key) { return rows.length ? sum(rows,key)/rows.length : 0; }
function aggregate(rows = APP.filtered) {
  const actual = sum(rows, 'actual_volume');
  const planned = sum(rows, 'planned_volume');
  const hours = sum(rows, 'actual_labour_hours');
  const defects = sum(rows, 'defects');
  return {
    records: rows.length,
    actual, planned, hours,
    uph: hours ? actual / hours : 0,
    onTime: avg(rows, 'on_time_dispatch_pct'),
    defectRate: actual ? defects / actual * 100 : 0,
    backlog: sum(rows, 'backlog'),
    capacity: planned ? actual / planned * 100 : 0,
    incidents: sum(rows, 'safety_incidents'),
    sla: sum(rows, 'sla_breaches'),
    cost: avg(rows, 'cost_per_unit'),
    absenteeism: avg(rows, 'absenteeism_pct')
  };
}
function groupBy(rows, key) {
  return rows.reduce((acc, row) => { (acc[row[key]] ||= []).push(row); return acc; }, {});
}
function currentAccess() {
  if (!APP.user) return [];
  return APP.user.modules?.length ? APP.user.modules : ROLE_ACCESS[APP.user.role] || [];
}

function mount() {
  APP.rows = generateSyntheticData();
  const savedUser = localStorage.getItem('opsflow_current_user');
  if (savedUser) {
    try { APP.user = JSON.parse(savedUser); } catch { APP.user = null; }
  }
  render();
}
function render() {
  const root = document.getElementById('app');
  if (!APP.user) { root.innerHTML = loginView(); bindLogin(); return; }
  if (!currentAccess().includes(APP.route)) APP.route = 'dashboard';
  applyFilters();
  root.innerHTML = shellView();
  bindShell();
}
function loginView() {
  return `
  <main class="login-shell simple-login">
    <form id="loginForm" class="login-card simple-login-card">
      <div class="login-brand">
        <div class="logo"><span class="logo-mark">O</span><span>OpsFlow360</span></div>
      </div>
      <h2>Login</h2>
      <p>Access the fulfilment operations dashboard using demo credentials.</p>
      <div class="form-group"><label>Username or email</label><input id="loginUser" value="admin" autocomplete="username" /></div>
      <div class="form-group"><label>Password</label><input id="loginPass" type="password" value="1000" autocomplete="current-password" /></div>
      <button class="primary-btn full">Open Dashboard</button>
      <div id="loginError" class="error"></div>
      <div class="demo-box">
        <b>Demo users</b><br/>
        Admin: <code>admin</code> / <code>1000</code><br/>
        Manager: <code>manager</code> / <code>1000</code><br/>
        Viewer: <code>viewer</code> / <code>1000</code>
      </div>
      <small class="login-disclaimer">Portfolio demo using synthetic operations data. Not affiliated with any employer.</small>
    </form>
  </main>`;
}
function bindLogin() {
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const ident = document.getElementById('loginUser').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    const found = getUsers().find(u => [u.username, u.email].includes(ident) && u.password === pass);
    if (!found) { document.getElementById('loginError').textContent = 'Invalid demo login. Try admin / 1000.'; return; }
    APP.user = found;
    localStorage.setItem('opsflow_current_user', JSON.stringify(found));
    APP.route = 'dashboard';
    render();
  });
}
function shellView() {
  const access = currentAccess();
  const nav = NAV.filter(([id])=>access.includes(id)).map(([id,icon,label]) => `<button class="${APP.route===id?'active':''}" data-route="${id}">${icon}<span>${label}</span></button>`).join('');
  return `
  <div class="app-shell">
    <aside id="sidebar" class="sidebar">
      <div class="logo"><span class="logo-mark">O</span><span>OpsFlow360</span></div>
      <nav class="nav">${nav}</nav>
      <div class="side-card">
        <b>${APP.user.role} access</b><br/>${APP.user.email}<br/><br/>
        Synthetic records loaded: <b>${fmt(APP.rows.length)}</b><br/>
        Data source: <b>${APP.uploaded ? 'Uploaded CSV' : 'Seeded demo data'}</b>
      </div>
    </aside>
    <main class="content">
      <header class="topbar">
        <button id="mobileMenu" class="ghost-btn mobile-menu">☰</button>
        <div><h1>${pageTitle(APP.route)}</h1><small>${pageSubtitle(APP.route)}</small></div>
        <div class="user-pill"><span class="avatar">${APP.user.name[0]}</span><span>${APP.user.name}<br/><small>${APP.user.role}</small></span><button id="logout" class="tiny-btn">Logout</button></div>
      </header>
      <section class="page">${pageContent()}</section>
    </main>
  </div>`;
}
function pageTitle(route) {
  return Object.fromEntries(NAV.map(([id,,label])=>[id,label]))[route] || 'Dashboard';
}
function pageSubtitle(route) {
  return {
    dashboard:'Simple overview of volume, productivity, service and backlog.',
    departments:'Quick comparison across Receive, Stow, Pick, Pack, SLAM and Dispatch.',
    capacity:'Simple labour planning and headcount estimate for a shift.',
    reports:'Download simple CSV reports and a printable summary.',
    story:'STAR explanation to present this project in an interview.',
    notes:'Project notes, data source and usage guide.'
  }[route] || '';
}

function bindShell() {
  document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', () => { APP.route = btn.dataset.route; APP.page = 1; render(); }));
  document.getElementById('logout').addEventListener('click', () => { localStorage.removeItem('opsflow_current_user'); APP.user = null; render(); });
  const mobile = document.getElementById('mobileMenu');
  if (mobile) mobile.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  bindPageSpecific();
}
function pageContent() {
  const noFilterPages = ['story','notes'];
  const filter = noFilterPages.includes(APP.route) ? '' : filtersView();
  const content = {
    dashboard: dashboardView,
    departments: departmentsView,
    capacity: capacityView,
    reports: reportsView,
    story: storyView,
    notes: notesView
  }[APP.route]();
  return `${filter}${content}<div class="footer-note">Portfolio demo using synthetic operations data. Not affiliated with any employer.</div>`;
}

function filtersView() {
  const f = APP.filters;
  return `<div class="filters no-print simple-filters">
    <div><label>Date preset</label><select id="preset"><option value="last30" ${f.preset==='last30'?'selected':''}>Last 30 Days</option><option value="last7" ${f.preset==='last7'?'selected':''}>Last 7 Days</option><option value="mtd" ${f.preset==='mtd'?'selected':''}>Month to Date</option><option value="qtd" ${f.preset==='qtd'?'selected':''}>Quarter to Date</option><option value="custom" ${f.preset==='custom'?'selected':''}>Custom</option></select></div>
    <div><label>Station</label>${select('station', ['All',...STATIONS], f.station)}</div>
    <div><label>Department</label>${select('department', ['All',...DEPARTMENTS], f.department)}</div>
    <div><label>Shift</label>${select('shift', ['All',...SHIFTS], f.shift)}</div>
    <div><label>Start</label><input type="date" id="start" value="${f.start}" /></div>
    <div><label>End</label><input type="date" id="end" value="${f.end}" /></div>
    <div class="filter-action"><button id="resetFilters" class="ghost-btn full">Reset</button></div>
  </div>`;
}

function select(id, options, value) { return `<select id="${id}">${options.map(o=>`<option ${o===value?'selected':''}>${o}</option>`).join('')}</select>`; }
function bindFilters() {
  ['station','department','shift','process_path'].forEach(id => document.getElementById(id)?.addEventListener('change', e => { APP.filters[id] = e.target.value; APP.page=1; render(); }));
  document.getElementById('start')?.addEventListener('change', e => { APP.filters.start = e.target.value; APP.filters.preset='custom'; APP.page=1; render(); });
  document.getElementById('end')?.addEventListener('change', e => { APP.filters.end = e.target.value; APP.filters.preset='custom'; APP.page=1; render(); });
  document.getElementById('preset')?.addEventListener('change', e => { setPreset(e.target.value); APP.page=1; render(); });
  document.getElementById('resetFilters')?.addEventListener('click', () => { APP.filters = { preset:'last30', start:'2026-04-01', end:'2026-04-30', station:'All', department:'All', shift:'All', process_path:'All' }; APP.page=1; render(); });
}
function setPreset(preset) {
  const end = parseDate('2026-04-30');
  let start = new Date(end);
  if (preset === 'last7') start.setDate(end.getDate()-6);
  else if (preset === 'last30') start.setDate(end.getDate()-29);
  else if (preset === 'mtd') start = new Date(end.getFullYear(), end.getMonth(), 1);
  else if (preset === 'qtd') start = new Date(end.getFullYear(), Math.floor(end.getMonth()/3)*3, 1);
  else { APP.filters.preset = 'custom'; return; }
  APP.filters.preset = preset; APP.filters.start = isoDate(start); APP.filters.end = isoDate(end);
}

function dashboardView() {
  const a = aggregate();
  return `${kpiGrid(a)}
  <div class="simple-dashboard-grid">
    <div class="panel"><h2>Daily Volume Trend</h2><p>Shows processed units and average productivity for the selected period.</p>${lineChart(dailySeries(APP.filtered), 'actual', 'uph')}</div>
    <div class="panel"><h2>Key Insights</h2>${insightsView()}</div>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Department Snapshot</h2><p>Quick summary by process area.</p>${departmentSummaryTable()}</div>`;
}

function kpiGrid(a) {
  const cards = [
    ['Total Units', fmt(a.actual), 'Processed units in the selected view', a.capacity >= 98 ? 'good' : a.capacity >= 92 ? 'warn' : 'bad'],
    ['UPH', fmt(a.uph,1), 'Units per labour hour', a.uph >= 80 ? 'good' : a.uph >= 65 ? 'warn' : 'bad'],
    ['On-Time Dispatch', pct(a.onTime,1), 'Service reliability', a.onTime >= 96 ? 'good' : a.onTime >= 92 ? 'warn' : 'bad'],
    ['Backlog', fmt(a.backlog), 'Unprocessed planned units', a.backlog < 25000 ? 'good' : a.backlog < 70000 ? 'warn' : 'bad']
  ];
  return `<div class="card-grid simple-card-grid">${cards.map(c=>`<div class="kpi-card"><div class="label">${c[0]}</div><div class="value">${c[1]}</div><div class="hint">${c[2]}</div><span class="trend ${c[3]}">${statusText(c[3])}</span></div>`).join('')}</div>`;
}

function statusText(s) { return s==='good'?'On track':s==='warn'?'Watch':'Action required'; }
function dailySeries(rows) {
  const g = groupBy(rows, 'date');
  return Object.entries(g).sort(([a],[b])=>a.localeCompare(b)).map(([date, r]) => ({ date, actual: sum(r,'actual_volume'), uph: aggregate(r).uph }));
}
function groupMetric(rows, key, metric) {
  const g = groupBy(rows, key);
  return Object.entries(g).map(([name, r]) => ({ name, value: metric === 'uph' ? aggregate(r).uph : sum(r, metric) })).sort((a,b)=>b.value-a.value);
}
function lineChart(series, key1, key2) {
  const data = series.slice(-60);
  if (!data.length) return '<p>No records for selected filters.</p>';
  const w=720,h=280,p=38;
  const max1 = Math.max(...data.map(d=>d[key1]));
  const max2 = Math.max(...data.map(d=>d[key2]));
  const x = i => p + i * ((w-p*2)/Math.max(data.length-1,1));
  const y1 = v => h-p - (v/max1)*(h-p*2);
  const y2 = v => h-p - (v/max2)*(h-p*2);
  const path1 = data.map((d,i)=>`${i?'L':'M'}${x(i)},${y1(d[key1])}`).join(' ');
  const path2 = data.map((d,i)=>`${i?'L':'M'}${x(i)},${y2(d[key2])}`).join(' ');
  return `<svg class="svg-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Trend chart">
    <line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#dbe5f0"/><line x1="${p}" y1="${p}" x2="${p}" y2="${h-p}" stroke="#dbe5f0"/>
    <path d="${path1}" fill="none" stroke="#1f6feb" stroke-width="4" stroke-linecap="round"/>
    <path d="${path2}" fill="none" stroke="#0d9488" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8"/>
    <text x="${p}" y="20" fill="#50627a" font-size="13">Blue: units | Green: UPH</text>
    <text x="${w-p-120}" y="${h-12}" fill="#50627a" font-size="12">Last ${data.length} days</text>
  </svg>`;
}
function barChart(data, label) {
  if (!data.length) return '<p>No data available.</p>';
  const max = Math.max(...data.map(d=>d.value));
  return `<div style="display:grid;gap:12px">${data.map(d=>`<div><div style="display:flex;justify-content:space-between;font-weight:800;font-size:.88rem"><span>${escapeHtml(d.name)}</span><span>${fmt(d.value, d.value < 1000 ? 1 : 0)}</span></div><div style="height:12px;background:#edf2f7;border-radius:99px;overflow:hidden"><div style="height:100%;width:${max ? d.value/max*100 : 0}%;background:linear-gradient(90deg,#1f6feb,#0d9488);border-radius:99px"></div></div><small style="color:#617188">${label}</small></div>`).join('')}</div>`;
}
function insightsView() {
  const a = aggregate();
  const deptRisk = groupMetric(APP.filtered, 'department', 'sla_breaches')[0];
  const stationRisk = groupMetric(APP.filtered, 'station', 'sla_breaches')[0];
  const defectRisk = groupMetric(APP.filtered, 'department', 'defects')[0];
  const messages = [
    a.capacity < 94 ? ['bad','Capacity below plan','Actual volume is below planned volume. Review labour allocation, absenteeism and process bottlenecks.'] : ['good','Capacity on track','Actual volume is close to plan for the selected period. Continue hourly monitoring.'],
    a.incidents > 8 ? ['bad','Safety focus required','Incident count is elevated. Run stand-up coaching, PPE checks and area standard audits.'] : ['good','Safety stable','Safety incident rate is controlled in the selected view.'],
    deptRisk ? ['warn',`${deptRisk.name} has highest SLA breach load`,`This department should be reviewed first in the start-of-shift deep dive.`] : null,
    stationRisk ? ['warn',`${stationRisk.name} is the main station risk`,`Station ranking shows this location needs priority follow-up.`] : null,
    defectRisk ? ['warn',`${defectRisk.name} has highest defect volume`,`Quality audit and standard-work refresh may reduce rework.`] : null
  ].filter(Boolean);
  return messages.map(m=>`<div class="story-step"><span class="step-num">${m[0]==='good'?'✓':m[0]==='bad'?'!':'?'}</span><div><b>${m[1]}</b><p>${m[2]}</p><span class="badge ${m[0]}">${statusText(m[0])}</span></div></div>`).join('');
}
function dataTable(rows, cols) {
  if (!rows.length) return '<p>No records for this filter.</p>';
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th data-sort="${c}">${c.replaceAll('_',' ')}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${formatCell(c,r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function formatCell(key, v) {
  if (key.includes('pct') || key === 'defect_rate' || key === 'absenteeism_pct') return pct(v,2);
  if (key === 'cost_per_unit') return money(v);
  if (typeof v === 'number') return fmt(v, key.includes('hour') || key.includes('rate') ? 2 : 0);
  return escapeHtml(v);
}


function departmentSummaryTable() {
  const grouped = groupBy(APP.filtered, 'department');
  const rows = DEPARTMENTS.map(dept => {
    const g = grouped[dept] || [];
    const a = aggregate(g);
    return {
      department: dept,
      units: fmt(a.actual),
      uph: fmt(a.uph, 1),
      on_time: pct(a.onTime, 1),
      backlog: fmt(a.backlog)
    };
  });
  return `<div class="table-wrap"><table><thead><tr><th>Department</th><th>Units</th><th>UPH</th><th>On-Time %</th><th>Backlog</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.department}</b></td><td>${r.units}</td><td>${r.uph}</td><td>${r.on_time}</td><td>${r.backlog}</td></tr>`).join('')}</tbody></table></div>`;
}

function departmentsView() {
  const grouped = DEPARTMENTS.map(d => ({ department: d, agg: aggregate(APP.filtered.filter(r => r.department === d)) }));
  return `<div class="two-col">
    <div class="panel"><h2>Units by Department</h2><p>Simple view of processed units by process area.</p>${barChart(groupMetric(APP.filtered,'department','actual_volume'), 'Units')}</div>
    <div class="panel"><h2>Department Summary</h2><p>Use this page to explain where bottlenecks are happening.</p>${departmentSummaryTable()}</div>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Manager Notes</h2><div class="table-wrap"><table><thead><tr><th>Department</th><th>Focus</th></tr></thead><tbody>${grouped.map(g=>`<tr><td><b>${g.department}</b></td><td>${g.agg.backlog > 12000 ? 'Backlog elevated; review labour allocation and flow.' : g.agg.onTime < 94 ? 'Service risk; review handoff speed and process delays.' : g.agg.defectRate > 2 ? 'Quality watch; refresh standard work and audit defects.' : 'On track. Continue hourly checks.'}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function stationsView() {
  const ranked = STATIONS.map(s => ({ station:s, a: aggregate(APP.filtered.filter(r=>r.station===s)) }))
    .map(x => ({...x, score: x.a.onTime - x.a.defectRate*3 - (x.a.incidents*0.15) - Math.min(12, x.a.sla/400)}))
    .sort((a,b)=>b.score-a.score);
  return `<div class="dashboard-grid"><div class="panel"><h2>Station Ranking</h2>${stationTable(ranked)}</div><div class="panel"><h2>Best / Watch Areas</h2>${ranked.slice(0,2).map(x=>`<div class="story-step"><span class="step-num">✓</span><div><b>${x.station}</b><p>Strong reliability score with ${pct(x.a.onTime,1)} on-time dispatch and ${pct(x.a.defectRate,2)} defect rate.</p></div></div>`).join('')}${ranked.slice(-2).reverse().map(x=>`<div class="story-step"><span class="step-num">!</span><div><b>${x.station}</b><p>Review SLA breaches, backlog and safety actions. Current risk score: ${fmt(x.score,1)}.</p></div></div>`).join('')}</div></div><div class="panel"><h2>Station Volume</h2>${barChart(groupMetric(APP.filtered,'station','actual_volume'),'Actual units')}</div>`;
}
function stationTable(rows) {
  return `<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Station</th><th>Units</th><th>On Time</th><th>Defect</th><th>Incidents</th><th>Status</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td><b>${x.station}</b></td><td>${fmt(x.a.actual)}</td><td>${pct(x.a.onTime,1)}</td><td>${pct(x.a.defectRate,2)}</td><td>${fmt(x.a.incidents)}</td><td><span class="badge ${x.score>90?'good':x.score>84?'warn':'bad'}">${x.score>90?'Strong':x.score>84?'Watch':'Action'}</span></td></tr>`).join('')}</tbody></table></div>`;
}
function capacityView() {
  const a = aggregate();
  return `<div class="two-col">
    <div class="panel"><h2>Manpower Calculator</h2><p>Formula: required headcount = target units ÷ (UPH × shift hours), adjusted for absenteeism.</p>
      <div class="form-group"><label>Target units</label><input id="targetUnits" type="number" value="${Math.round(a.planned / Math.max(1, new Set(APP.filtered.map(r=>r.date)).size || 1))}" /></div>
      <div class="form-group"><label>Target UPH</label><input id="targetUph" type="number" value="${Math.round(a.uph || 80)}" /></div>
      <div class="form-group"><label>Shift hours</label><input id="shiftHours" type="number" value="9" /></div>
      <div class="form-group"><label>Absenteeism %</label><input id="absenteeism" type="number" value="${fmt(a.absenteeism,1)}" /></div>
      <button id="calcBtn" class="primary-btn">Calculate Headcount</button><div id="calcResult" class="demo-box"></div>
    </div>
    <div class="panel"><h2>Capacity Action Plan</h2>${capacityActions(a)}</div>
  </div>
  <div class="panel" style="margin-top:16px"><h2>Capacity Table</h2>${dataTable(APP.filtered.slice(0,220), ['date','station','department','shift','planned_volume','actual_volume','planned_labour_hours','actual_labour_hours','units_per_hour','absenteeism_pct'])}</div>`;
}
function capacityActions(a) {
  const actions = [];
  if (a.capacity < 94) actions.push(['bad','Labour gap risk','Move cross-trained associates from lower backlog paths to the bottleneck department.']);
  if (a.absenteeism > 8) actions.push(['warn','Absenteeism watch','Prepare backup labour and check start-of-shift attendance early.']);
  if (a.uph < 70) actions.push(['warn','Productivity coaching','Run hourly rate check, remove blockers and refresh standard work.']);
  if (!actions.length) actions.push(['good','Plan stable','Capacity, productivity and labour utilisation are within expected range.']);
  return actions.map(a=>`<div class="story-step"><span class="step-num">${a[0]==='good'?'✓':'!'}</span><div><b>${a[1]}</b><p>${a[2]}</p><span class="badge ${a[0]}">${statusText(a[0])}</span></div></div>`).join('');
}
function safetyView() {
  const incidents = APP.filtered.filter(r=>r.safety_incidents>0).slice(0,240);
  const statuses = [
    { name: 'Open', value: Math.round(incidents.length*0.22) }, { name:'In Review', value: Math.round(incidents.length*0.34) }, { name:'Closed', value: Math.max(0, incidents.length - Math.round(incidents.length*0.56)) }
  ];
  return `<div class="dashboard-grid"><div class="panel"><h2>Escalation Status</h2>${barChart(statuses,'Incident count')}</div><div class="panel"><h2>Safety Playbook</h2><p>Use stand-up coaching, PPE checks, blocked-area clearance, trailer-entry rules and follow-up audits. Prioritise hazards that can stop flow or put associates at risk.</p>${insightsView()}</div></div><div class="panel"><h2>Incident Log</h2>${dataTable(incidents, ['date','station','department','shift','safety_incidents','manager_notes'])}</div>`;
}
function reportsView() {
  const reports = [
    ['daily','Daily Summary','Daily volume, UPH, backlog, SLA and safety KPIs.'], ['department','Department Report','Performance split by inbound, stow, pick, pack, SLAM and dispatch.'],
    ['station','Station Report','Location-level comparison and risk view.'], ['capacity','Shift Capacity Report','Labour hours, UPH, absenteeism and volume gap.'],
    ['exceptions','Exception Report','SLA breaches, defects, backlog and safety incident rows.'], ['leadership','Leadership Summary','Printable overview for interview discussion.']
  ];
  return `<div class="download-list">${reports.map(r=>`<div class="report-card"><h3>${r[1]}</h3><p>${r[2]}</p><button class="primary-btn full" data-download="${r[0]}">Download CSV</button></div>`).join('')}</div><div class="panel" style="margin-top:16px"><h2>Printable Leadership Summary</h2>${leadershipSummary()}<button class="ghost-btn no-print" onclick="window.print()">Print / Save as PDF</button></div>`;
}
function leadershipSummary() {
  const a = aggregate();
  return `<p><b>Selected period:</b> ${APP.filters.start} to ${APP.filters.end}. <b>Records:</b> ${fmt(a.records)}. <b>Units:</b> ${fmt(a.actual)}. <b>UPH:</b> ${fmt(a.uph,1)}. <b>On-time dispatch:</b> ${pct(a.onTime,1)}. <b>Defect rate:</b> ${pct(a.defectRate,2)}. <b>SLA breaches:</b> ${fmt(a.sla)}.</p><p>This dashboard demonstrates how an Area/Shift Manager can combine hourly performance control, root-cause investigation, safety awareness and capacity planning to deliver customer outcomes.</p>`;
}
function uploadView() {
  if (!['Admin','Manager'].includes(APP.user.role)) return `<div class="panel"><h2>Read only</h2><p>Your role cannot upload data.</p></div>`;
  return `<div class="two-col"><div class="panel"><h2>Upload Operations CSV</h2><p>Replace or append synthetic demo records. Required headers are shown on the right.</p><input type="file" id="csvFile" accept=".csv" /><div class="form-group"><label>Upload mode</label><select id="uploadMode"><option value="replace">Replace current demo data</option><option value="append">Append to current data</option></select></div><button id="uploadBtn" class="primary-btn">Upload CSV</button><button id="restoreData" class="ghost-btn">Restore seeded demo data</button><div id="uploadMsg" class="demo-box"></div></div><div class="panel"><h2>CSV Schema</h2><p><code>date, station, department, shift, process_path, planned_volume, actual_volume, planned_labour_hours, actual_labour_hours, units_per_hour, defects, defect_rate, backlog, on_time_dispatch_pct, sla_breaches, safety_incidents, absenteeism_pct, cost_per_unit, manager_notes</code></p><button class="ghost-btn" id="sampleCsv">Download sample CSV</button></div></div>`;
}
function usersView() {
  if (APP.user.role !== 'Admin') return `<div class="panel"><h2>Admin only</h2><p>User management is available only for Admin.</p></div>`;
  const users = getUsers();
  return `<div class="two-col"><div class="panel"><h2>Add Demo User</h2><div class="form-group"><label>Name</label><input id="newName" placeholder="Name" /></div><div class="form-group"><label>Email</label><input id="newEmail" placeholder="email@example.com" /></div><div class="form-group"><label>Username</label><input id="newUsername" placeholder="username" /></div><div class="form-group"><label>Password</label><input id="newPassword" value="1000" /></div><div class="form-group"><label>Role</label><select id="newRole"><option>Viewer</option><option>Manager</option><option>Admin</option></select></div><button id="addUser" class="primary-btn">Add user</button><div id="userMsg" class="demo-box"></div></div><div class="panel"><h2>Existing Users</h2><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>${users.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${u.role}</td><td><button class="danger-btn tiny-btn" data-delete-user="${u.id}" ${u.id===APP.user.id?'disabled':''}>Delete</button></td></tr>`).join('')}</tbody></table></div></div></div><div class="panel" style="margin-top:16px"><h2>Module Access</h2><p>Default access: Admin can manage all pages; Manager can upload and view reports; Viewer is read-only.</p>${dataTable(users.map(u=>({name:u.name, role:u.role, modules:(u.modules||[]).join(', ')})), ['name','role','modules'])}</div>`;
}
function storyView() {
  const steps = [
    ['Situation','Fulfilment operations depend on multiple process paths: trucks arrive in inbound, products are received, stowed, picked, packed, checked through SLAM, sorted and dispatched. Managers need quick visibility across volume, labour, quality, safety and SLA risk.'],
    ['Task','Create an interview-ready online dashboard that shows how I would monitor a shift, identify bottlenecks, plan labour, reduce exceptions and communicate actions to leadership.'],
    ['Action','I designed OpsFlow360 with synthetic data, filters, KPI cards, station/department comparisons, capacity calculator, safety log, downloads and leadership summaries. The process flow mirrors Receive → Stow → Pick → Pack → SLAM → Dispatch.'],
    ['Result','The project demonstrates operations ownership, data-driven decision-making, root-cause analysis and customer-focused delivery without using confidential employer data.']
  ];
  return `<div class="panel"><h2>STAR Interview Story</h2>${steps.map((s,i)=>`<div class="story-step"><span class="step-num">${i+1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div></div>`).join('')}</div>`;
}
function principlesView() {
  const rows = [
    ['Customer Obsession','On-time dispatch, SLA breach and backlog tracking focus on getting orders to customers reliably.'],
    ['Ownership','The dashboard gives one place to monitor flow, labour, safety and escalation actions.'],
    ['Dive Deep','Filters, station comparisons and root-cause notes help identify the true bottleneck.'],
    ['Bias for Action','Risk badges and insight cards highlight urgent actions for the current shift.'],
    ['Invent and Simplify','Complex fulfilment operations are simplified into clear process modules and automated reports.'],
    ['Deliver Results','KPI cards connect daily actions to productivity, quality, safety and cost outcomes.'],
    ['Earn Trust','Clear documentation, synthetic-data disclaimer and transparent calculations make the project easy to explain.'],
    ['Hire and Develop the Best','User roles and coaching actions show how managers can support teams and standard work.']
  ];
  return `<div class="panel"><h2>Leadership Principles Mapping</h2><div class="table-wrap"><table><thead><tr><th>Principle</th><th>Dashboard Evidence</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function notesView() {
  return `<div class="panel"><h2>README / Project Notes</h2><p><b>Tech stack:</b> HTML, CSS and vanilla JavaScript. This keeps the project simple, lightweight and easy to host on GitHub Pages without backend setup.</p><p><b>Data:</b> Seeded synthetic records from 2025-01-01 to 2026-04-30 across six fulfilment-style stations, six departments and three shifts. No real employer data is included.</p><p><b>How to use:</b> Login with admin / 1000, filter the dashboard, review insights, download CSV reports, open the Interview Story page and use the Leadership Principles page for interview explanation.</p><p><b>Data dictionary:</b> planned_volume, actual_volume, labour hours, UPH, defects, defect rate, backlog, on-time dispatch %, SLA breaches, safety incidents, absenteeism %, cost per unit and manager notes.</p><p><b>GitHub Pages:</b> Upload this folder to a public repository, enable Pages from main/root or GitHub Actions, then share the generated URL.</p></div>`;
}
function bindPageSpecific() {
  bindFilters();
  document.querySelectorAll('[data-dept-filter]').forEach(btn => btn.addEventListener('click', () => { APP.filters.department = btn.dataset.deptFilter; APP.route='departments'; render(); }));
  document.querySelectorAll('[data-download]').forEach(btn => btn.addEventListener('click', () => downloadReport(btn.dataset.download)));
  document.querySelectorAll('[data-delete-user]').forEach(btn => btn.addEventListener('click', () => deleteUser(Number(btn.dataset.deleteUser))));
  document.getElementById('addUser')?.addEventListener('click', addUser);
  document.getElementById('calcBtn')?.addEventListener('click', calculateHeadcount);
  document.getElementById('uploadBtn')?.addEventListener('click', uploadCsv);
  document.getElementById('restoreData')?.addEventListener('click', () => { localStorage.removeItem('opsflow_uploaded_rows'); APP.uploaded=false; APP.rows=generateSyntheticData(); render(); });
  document.getElementById('sampleCsv')?.addEventListener('click', () => downloadText('sample_operations_upload.csv', SAMPLE_CSV));
  document.querySelectorAll('[data-sort]').forEach(th => th.addEventListener('click', () => { APP.sort.key = th.dataset.sort; APP.sort.dir = APP.sort.dir === 'asc' ? 'desc' : 'asc'; }));
}
function calculateHeadcount() {
  const units = Number(document.getElementById('targetUnits').value || 0);
  const uph = Number(document.getElementById('targetUph').value || 1);
  const hours = Number(document.getElementById('shiftHours').value || 1);
  const abs = Number(document.getElementById('absenteeism').value || 0) / 100;
  const base = units / (uph * hours);
  const adjusted = Math.ceil(base / Math.max(0.01, 1-abs));
  document.getElementById('calcResult').innerHTML = `<b>Required headcount:</b> ${adjusted}<br/>Base need: ${fmt(base,1)} associates. Absenteeism-adjusted need: ${adjusted}.`;
}
function addUser() {
  const users = getUsers();
  const role = document.getElementById('newRole').value;
  const user = {
    id: Date.now(), name: document.getElementById('newName').value.trim() || 'Demo User',
    email: document.getElementById('newEmail').value.trim().toLowerCase(), username: document.getElementById('newUsername').value.trim().toLowerCase(),
    password: document.getElementById('newPassword').value || '1000', role, modules: ROLE_ACCESS[role]
  };
  if (!user.email || !user.username) { document.getElementById('userMsg').textContent = 'Email and username are required.'; return; }
  users.push(user); saveUsers(users); render();
}
function deleteUser(id) { saveUsers(getUsers().filter(u=>u.id !== id)); render(); }
function downloadReport(type) {
  let rows = APP.filtered;
  if (type === 'exceptions') rows = rows.filter(r => r.sla_breaches > 8 || r.defect_rate > 3 || r.backlog > 700 || r.safety_incidents > 0);
  if (type === 'department') rows = groupReport('department');
  if (type === 'station') rows = groupReport('station');
  if (type === 'daily') rows = groupReport('date');
  if (type === 'capacity') rows = rows.map(({date,station,department,shift,planned_volume,actual_volume,planned_labour_hours,actual_labour_hours,units_per_hour,absenteeism_pct,backlog}) => ({date,station,department,shift,planned_volume,actual_volume,planned_labour_hours,actual_labour_hours,units_per_hour,absenteeism_pct,backlog}));
  if (type === 'leadership') rows = [{...aggregate(), start: APP.filters.start, end: APP.filters.end, summary: 'Portfolio leadership summary using synthetic data.'}];
  downloadText(`opsflow360_${type}_report.csv`, toCsv(rows));
}
function groupReport(key) {
  const g = groupBy(APP.filtered, key);
  return Object.entries(g).map(([name, rows]) => ({ [key]: name, ...aggregate(rows) }));
}
function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replaceAll('"','""')}"`).join(','))].join('\n');
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(h=>h.trim());
  return lines.map((line, idx) => {
    const cells = line.match(/("[^"]*(""[^"]*)*"|[^,]+)/g) || [];
    const obj = { id: Date.now()+idx };
    headers.forEach((h,i) => { let v = (cells[i] || '').replace(/^"|"$/g,'').replaceAll('""','"'); obj[h] = isNaN(Number(v)) || v === '' ? v : Number(v); });
    return obj;
  });
}
function uploadCsv() {
  const file = document.getElementById('csvFile').files[0];
  const msg = document.getElementById('uploadMsg');
  if (!file) { msg.textContent = 'Choose a CSV file first.'; return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = parseCsv(e.target.result);
      const required = ['date','station','department','shift','process_path','planned_volume','actual_volume'];
      const ok = required.every(h => Object.prototype.hasOwnProperty.call(parsed[0] || {}, h));
      if (!ok) { msg.textContent = `CSV missing required headers: ${required.join(', ')}`; return; }
      const mode = document.getElementById('uploadMode').value;
      const rows = mode === 'append' ? APP.rows.concat(parsed) : parsed;
      localStorage.setItem('opsflow_uploaded_rows', JSON.stringify(rows));
      APP.rows = rows; APP.uploaded = true; msg.textContent = `Uploaded ${fmt(parsed.length)} rows successfully.`; render();
    } catch (err) { msg.textContent = `Upload failed: ${err.message}`; }
  };
  reader.readAsText(file);
}
const SAMPLE_CSV = `date,station,department,shift,process_path,planned_volume,actual_volume,planned_labour_hours,actual_labour_hours,units_per_hour,defects,defect_rate,backlog,on_time_dispatch_pct,sla_breaches,safety_incidents,absenteeism_pct,cost_per_unit,manager_notes
2026-04-30,LHR-East,Pick,Morning,Single Pick,6200,6030,72,70,86.14,64,1.06,190,97.8,4,0,4.2,0.34,On track
2026-04-30,LHR-East,Pack,Twilight,Pack Single,5700,5420,68,72,75.28,130,2.40,370,94.5,8,1,7.6,0.41,Quality and safety coaching required
2026-04-30,DRT-London,Dispatch,Night,Truck Load,5900,5310,74,79,67.22,78,1.47,610,91.2,11,0,9.1,0.48,Review labour gap and dispatch handoff`;

mount();
