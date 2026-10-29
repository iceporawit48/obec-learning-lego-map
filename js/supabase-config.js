// js/supabase-config.js - ตัวจัดการการเชื่อมต่อ Supabase Realtime Database สำหรับกลุ่มวิจัยฯ สพฐ.

// ค่า Config พื้นฐาน
const DEFAULT_SUPABASE_URL = "https://fjmzckykftsanoobdkzw.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_VCiIF0Fos8IKYcylkxJFxg_ms6QjLwW";

// ดึงการตั้งค่าจาก LocalStorage หรือค่าเริ่มต้น
function getSupabaseCredentials() {
  const storedUrl = localStorage.getItem('OBEC_SUPABASE_URL');
  const storedKey = localStorage.getItem('OBEC_SUPABASE_ANON_KEY');

  return {
    url: (storedUrl && storedUrl.trim()) || DEFAULT_SUPABASE_URL,
    anonKey: (storedKey && storedKey.trim()) || DEFAULT_SUPABASE_ANON_KEY
  };
}

let supabaseClient = null;

// เริ่มต้น Client ของ Supabase
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || typeof supabase === 'undefined') {
    return null;
  }

  try {
    supabaseClient = supabase.createClient(url, anonKey);
    return supabaseClient;
  } catch (err) {
    console.error('Supabase initialization error:', err);
    return null;
  }
}

// ตรวจสอบว่าระบบเชื่อมต่อ Supabase พร้อมใช้งานหรือไม่
function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

// แปลงข้อมูลจาก Supabase (snake_case) ให้เป็น Model ของแอปพลิเคชัน (camelCase)
function mapSupabaseToApp(row) {
  let members = [];
  if (Array.isArray(row.network_members)) {
    members = row.network_members;
  } else if (typeof row.network_members === 'string') {
    try {
      members = JSON.parse(row.network_members);
    } catch (e) {
      members = row.network_members.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }

  return {
    id: row.id,
    typeId: parseInt(row.type_id) || 1,
    provinceTh: row.province_th,
    provinceEn: row.province_en || '',
    secondaryProvinceTh: row.secondary_province_th || null,
    secondaryProvinceEn: row.secondary_province_en || null,
    title: row.title,
    subTitle: row.sub_title || '',
    region: row.region || '',
    details: row.details || '',
    yearAdded: row.year_added || 'เดิม',
    isSchool: Boolean(row.is_school),
    networkLeader: row.network_leader || '',
    networkMembers: members,
    websiteUrl: row.website_url || null,
    websiteLabel: row.website_label || null,
    driveDocUrl: row.drive_doc_url || null,
    driveDocTitle: row.drive_doc_title || null
  };
}

// แปลงข้อมูลจากแอปพลิเคชัน (camelCase) ให้เป็น Supabase (snake_case)
function mapAppToSupabase(item) {
  return {
    id: item.id || ('node-' + Date.now()),
    type_id: parseInt(item.typeId) || 1,
    province_th: item.provinceTh,
    province_en: item.provinceEn || '',
    secondary_province_th: item.secondaryProvinceTh || null,
    secondary_province_en: item.secondaryProvinceEn || null,
    title: item.title,
    sub_title: item.subTitle || '',
    region: item.region || '',
    details: item.details || '',
    year_added: item.yearAdded || '2568-2569',
    is_school: Boolean(item.isSchool),
    network_leader: item.networkLeader || '',
    network_members: Array.isArray(item.networkMembers) ? item.networkMembers : [],
    website_url: item.websiteUrl || null,
    website_label: item.websiteLabel || null,
    drive_doc_url: item.driveDocUrl || null,
    drive_doc_title: item.driveDocTitle || null,
    updated_at: new Date().toISOString()
  };
}

// --------------------------------------------------------------------------
// API ฟังก์ชันสำหรับดึงและจัดการข้อมูล
// --------------------------------------------------------------------------

// 1. ดึงรายการ Node ทั้งหมด
async function fetchLocationsFromCloud() {
  const client = getSupabaseClient();
  if (!client) {
    console.info('[Supabase] Not configured. Using local fallback data.');
    return null;
  }

  try {
    const { data, error } = await client
      .from('locations')
      .select('*')
      .order('type_id', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching locations:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.info('[Supabase] Table is empty. Fallback to local data.');
      return null;
    }

    return data.map(mapSupabaseToApp);
  } catch (err) {
    console.error('[Supabase] Network/fetch error:', err);
    return null;
  }
}

// 2. บันทึกหรืออัปเดตข้อมูล Node (Upsert)
async function saveLocationToCloud(locationItem) {
  const client = getSupabaseClient();
  if (!client) throw new Error('กรุณาตั้งค่า Supabase URL และ Anon Key ก่อนบันทึกข้อมูล');

  const row = mapAppToSupabase(locationItem);
  const { data, error } = await client
    .from('locations')
    .upsert(row, { onConflict: 'id' })
    .select();

  if (error) throw error;
  return data;
}

// 3. ลบข้อมูล Node
async function deleteLocationFromCloud(locationId) {
  const client = getSupabaseClient();
  if (!client) throw new Error('กรุณาตั้งค่า Supabase URL และ Anon Key ก่อนลบข้อมูล');

  const { error } = await client
    .from('locations')
    .delete()
    .eq('id', locationId);

  if (error) throw error;
  return true;
}

// 4. นำเข้าข้อมูลเริ่มต้น 33 รายการ (One-Click Seed)
async function seedInitialDataToCloud(sourceArray) {
  const client = getSupabaseClient();
  if (!client) throw new Error('กรุณาตั้งค่า Supabase URL และ Anon Key ก่อนนำเข้าข้อมูล');

  const dataToUpload = (sourceArray || LOCATIONS_DATA).map(mapAppToSupabase);

  const { data, error } = await client
    .from('locations')
    .upsert(dataToUpload, { onConflict: 'id' });

  if (error) throw error;
  return dataToUpload.length;
}

// 5. ติดตามการเปลี่ยนแปลงข้อมูลแบบ Real-time
function subscribeCloudRealtime(onDataChanged) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('public:locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        (payload) => {
          console.log('[Supabase Realtime] Event received:', payload);
          if (typeof onDataChanged === 'function') {
            onDataChanged(payload);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn('[Supabase Realtime] Subscription error:', err);
    return null;
  }
}
