// ===== Supabase config =====
// publishable key ออกแบบมาให้อยู่ในโค้ดฝั่งเบราว์เซอร์ได้ (ความปลอดภัยอยู่ที่ RLS policy)
// ห้ามใส่ service_role key หรือรหัสผ่านฐานข้อมูลในไฟล์นี้เด็ดขาด
const DEFAULT_SUPABASE_URL = 'https://fjmzckykftsanoobdkzw.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_VCiIF0Fos8IKYcylkxJFxg_ms6QjLwW';

let supabaseClient = null;
let _realtimeChannel = null;

function getSupabaseCredentials() {
  return {
    url: localStorage.getItem('OBEC_SUPABASE_URL') || DEFAULT_SUPABASE_URL,
    anonKey: localStorage.getItem('OBEC_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_KEY
  };
}

function isSupabaseConfigured() {
  const c = getSupabaseCredentials();
  return !!(c.url && c.anonKey && window.supabase);
}

function getSupabaseClient() {
  if (!supabaseClient) {
    if (!isSupabaseConfigured()) return null;
    const c = getSupabaseCredentials();
    supabaseClient = window.supabase.createClient(c.url, c.anonKey);
  }
  return supabaseClient;
}

// ===== Mapping: JS (camelCase) <-> DB (snake_case) =====
const FIELD_MAP = {
  id: 'id',
  typeId: 'type_id',
  provinceTh: 'province_th',
  provinceEn: 'province_en',
  secondaryProvinceTh: 'secondary_province_th',
  secondaryProvinceEn: 'secondary_province_en',
  title: 'title',
  subTitle: 'sub_title',
  region: 'region',
  details: 'details',
  supervisor: 'supervisor',
  yearAdded: 'year_added',
  isSchool: 'is_school',
  networkLeader: 'network_leader',
  networkMembers: 'network_members',
  websiteUrl: 'website_url',
  websiteLabel: 'website_label',
  driveDocUrl: 'drive_doc_url',
  driveDocTitle: 'drive_doc_title'
};

function itemToRow(item) {
  const row = {};
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    if (item[camel] !== undefined) row[snake] = item[camel];
  }
  row.updated_at = new Date().toISOString();
  return row; // เฉพาะ field ที่มีค่า จึงไม่ทับคอลัมน์อื่นเป็น null ตอน upsert
}

function rowToItem(row) {
  const item = {};
  for (const [camel, snake] of Object.entries(FIELD_MAP)) {
    if (row[snake] !== undefined) item[camel] = row[snake];
  }
  item.networkMembers = item.networkMembers || [];
  // กันค่า null ที่ทำให้ app.js error (เช่น .toLowerCase() ของ null)
  item.subTitle = item.subTitle || '';
  item.details = item.details || '';
  item.region = item.region || '';
  if (!item.provinceEn && typeof THAILAND_MAP_PROVINCES !== 'undefined') {
    const p = THAILAND_MAP_PROVINCES.find(x => x.name_th === item.provinceTh);
    if (p) item.provinceEn = p.name_en;
  }
  item.provinceEn = item.provinceEn || '';
  return item;
}

// ===== Data =====
async function fetchLocationsFromCloud() {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('locations')
    .select('*')
    .order('type_id', { ascending: true })
    .order('province_th', { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToItem);
}

async function saveLocationToCloud(item) {
  const client = getSupabaseClient();
  if (!client) throw new Error('ยังไม่ได้เชื่อมต่อ Supabase');
  const { error } = await client.from('locations').upsert(itemToRow(item));
  if (error) throw error;
}

async function deleteLocationFromCloud(id) {
  const client = getSupabaseClient();
  if (!client) throw new Error('ยังไม่ได้เชื่อมต่อ Supabase');
  const { error } = await client.from('locations').delete().eq('id', id);
  if (error) throw error;
}

async function seedInitialDataToCloud(list) {
  const client = getSupabaseClient();
  if (!client) throw new Error('ยังไม่ได้เชื่อมต่อ Supabase');
  const rows = list.map(itemToRow);
  const { error } = await client.from('locations').upsert(rows);
  if (error) throw error;
  return rows.length;
}

function subscribeCloudRealtime(callback) {
  const client = getSupabaseClient();
  if (!client) return;
  if (_realtimeChannel) client.removeChannel(_realtimeChannel);
  _realtimeChannel = client
    .channel('locations-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, callback)
    .subscribe();
}

// ===== Admin Auth =====
async function getAdminSession() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session || null;
}

async function adminSignIn(email, password) {
  const client = getSupabaseClient();
  if (!client) throw new Error('ยังไม่ได้เชื่อมต่อ Supabase');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

async function adminSignOut() {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
}

// ===== โหลดข้อมูลจาก Supabase ทับ LOCATIONS_DATA (ใช้กับหน้า index.html) =====
// ไฟล์นี้ต้องโหลดหลัง data.js และก่อน map.js / app.js
// ดึงแบบ synchronous เพื่อให้เสร็จก่อนสคริปต์ถัดไปเริ่มทำงาน
// ถ้าดึงไม่ได้หรือตารางว่าง จะใช้ข้อมูลใน data.js ตามเดิม
(function loadCloudLocations() {
  try {
    if (typeof LOCATIONS_DATA === 'undefined' || !isSupabaseConfigured()) return;
    const { url, anonKey } = getSupabaseCredentials();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url + '/rest/v1/locations?select=*&order=type_id.asc,province_th.asc', false);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.send();
    if (xhr.status !== 200) throw new Error('HTTP ' + xhr.status);

    const rows = JSON.parse(xhr.responseText);
    if (!rows.length) return;

    const items = rows.map(rowToItem).map(it => {
      if (!it.provinceEn && typeof THAILAND_MAP_PROVINCES !== 'undefined') {
        const p = THAILAND_MAP_PROVINCES.find(x => x.name_th === it.provinceTh);
        if (p) it.provinceEn = p.name_en;
      }
      if (it.isSchool === undefined || it.isSchool === null) {
        it.isSchool = (it.typeId === 2 || it.typeId === 3);
      }
      return it;
    });

    LOCATIONS_DATA.length = 0;
    LOCATIONS_DATA.push(...items);
    console.log('[Supabase] โหลด ' + items.length + ' รายการ');
  } catch (e) {
    console.warn('[Supabase] ใช้ข้อมูลในเครื่องแทน:', e);
  }
})();

// ===== อัปเดตตัวเลขสถิติ/ปุ่มกรองใน index.html ให้ตรงกับข้อมูลจริง =====
document.addEventListener('DOMContentLoaded', () => {
  if (typeof LOCATIONS_DATA === 'undefined') return;
  if (!document.querySelector('.stat-brick')) return; // ไม่ใช่หน้า index
  const count = t => LOCATIONS_DATA.filter(x => x.typeId === t).length;
  const total = LOCATIONS_DATA.length;

  const setStat = (filter, text) => {
    const el = document.querySelector('.stat-brick[data-filter="' + filter + '"] .stat-value');
    if (el) el.textContent = text;
  };
  setStat('1', count(1) + ' เขต');
  setStat('2', count(2) + ' รร.');
  setStat('3', count(3) + ' ข่าย');
  setStat('4', count(4) + ' เขต');
  setStat('ALL', total + ' จุด');

  document.querySelectorAll('.filter-toolbar .node-btn').forEach(btn => {
    const f = btn.dataset.filter;
    const n = f === 'ALL' ? total : count(parseInt(f));
    btn.innerHTML = btn.innerHTML.replace(/\(\d+\)/, '(' + n + ')');
  });
});

// ===== ระบบล็อกอินหน้า admin (สร้างหน้าต่างล็อกอินด้วย JS ไม่ต้องแก้ HTML) =====
// ใช้งาน: ใน admin.html เปลี่ยน `await initAdminData();` เป็น `await requireLogin();`
function _injectLoginUI() {
  if (document.getElementById('login-modal')) return;
  const wrap = document.createElement('div');
  wrap.id = 'login-modal';
  wrap.className = 'modal-backdrop';
  wrap.innerHTML =
    '<div class="modal-window hud-corner-bracket" style="max-width:440px;">' +
      '<div class="modal-header"><div class="modal-title-box">' +
        '<h3>🔐 เข้าสู่ระบบผู้ดูแล</h3><p>ต้องล็อกอินก่อนจึงจะจัดการข้อมูลได้</p>' +
      '</div></div>' +
      '<form id="login-form">' +
        '<div class="modal-body">' +
          '<div class="form-group"><label for="login-email">อีเมล:</label>' +
          '<input type="email" id="login-email" class="form-input" autocomplete="username" required></div>' +
          '<div class="form-group"><label for="login-password">รหัสผ่าน:</label>' +
          '<input type="password" id="login-password" class="form-input" autocomplete="current-password" required></div>' +
          '<div id="login-error" style="color:var(--neon-red);font-size:0.85rem;min-height:20px;"></div>' +
        '</div>' +
        '<div class="modal-footer" style="padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--hud-border);">' +
          '<a href="index.html" class="cyber-btn" style="text-decoration:none;border-color:#64748B;color:#94A3B8;">← กลับหน้าแผนที่</a>' +
          '<button type="submit" id="login-submit" class="cyber-btn" style="border-color:var(--neon-green);color:var(--neon-green);">เข้าสู่ระบบ</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  document.body.appendChild(wrap);

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-submit');
    errEl.textContent = '';
    btn.disabled = true;
    try {
      await adminSignIn(
        document.getElementById('login-email').value.trim(),
        document.getElementById('login-password').value
      );
      document.getElementById('login-password').value = '';
      await requireLogin();
    } catch (err) {
      errEl.textContent = 'ล็อกอินไม่สำเร็จ: ' + err.message;
    } finally {
      btn.disabled = false;
    }
  });
}

function _injectLogoutButton() {
  const actions = document.querySelector('.admin-actions');
  if (!actions || document.getElementById('logout-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'logout-btn';
  btn.className = 'cyber-btn';
  btn.style.cssText = 'border-color:var(--neon-red);color:var(--neon-red);';
  btn.textContent = '🚪 ออกจากระบบ';
  btn.onclick = async () => { await adminSignOut(); location.reload(); };
  actions.appendChild(btn);
}

async function requireLogin() {
  _injectLoginUI();
  const main = document.querySelector('.admin-container');
  const modal = document.getElementById('login-modal');
  if (main) main.style.display = 'none'; // ซ่อนไว้ก่อนจนกว่าจะยืนยันตัวตน

  let session = null;
  try { session = await getAdminSession(); } catch (e) { console.warn(e); }

  if (session) {
    modal.classList.remove('open');
    if (main) main.style.display = '';
    _injectLogoutButton();
    if (typeof initAdminData === 'function') await initAdminData();
  } else {
    modal.classList.add('open');
  }
}
