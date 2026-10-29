// app.js - ตัวควบคุม UI ล้ำยุคและระบบเสียง Sci-Fi Cybernetic Web Audio

let audioCtx = null;
let isSoundEnabled = true;
window.activeFilter = 'ALL';
let currentSearchQuery = '';

// ==========================================================================
// 1. FUTURISTIC WEB AUDIO SYNTHESIZER
// ==========================================================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

window.playCyberClick = function() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (err) {
    console.warn(err);
  }
};

window.playHoverBlip = function() {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (err) {
    console.warn(err);
  }
};

window.playLegoSnap = window.playCyberClick;
window.playLegoPop = window.playHoverBlip;

// ==========================================================================
// 2. INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSoundToggle();
  initFilterButtons();
  initSearch();
  initModalEvents();

  if (typeof initThailandMap === 'function') {
    initThailandMap();
  }

  updateActiveFilterDisplay();
  renderDirectoryList();
  initCloudSync();
});

// ==========================================================================
// 2.1 SUPABASE CLOUD SYNC & REFRESH
// ==========================================================================
window.refreshAllMapData = function() {
  if (typeof renderProvinces === 'function') renderProvinces();
  if (typeof renderLegoMarkers === 'function') renderLegoMarkers();
  if (typeof renderDirectoryList === 'function') renderDirectoryList();
  if (typeof updateActiveFilterDisplay === 'function') updateActiveFilterDisplay();
  updateTotalSiteCounts();
};

function updateTotalSiteCounts() {
  const statValEl = document.querySelector('.stat-brick.lego-orange .stat-value');
  if (statValEl && window.LOCATIONS_DATA) {
    statValEl.textContent = `${window.LOCATIONS_DATA.length} จุด`;
  }
}

async function initCloudSync() {
  if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured()) {
    return;
  }

  const liveBadge = document.querySelector('.status-live-pill');
  if (liveBadge) {
    liveBadge.innerHTML = '<span class="status-dot-pulse"></span> SUPABASE LIVE';
    liveBadge.title = 'เชื่อมต่อฐานข้อมูล Supabase Cloud Realtime';
    liveBadge.style.borderColor = 'var(--neon-green)';
    liveBadge.style.color = 'var(--neon-green)';
  }

  try {
    const cloudLocations = await fetchLocationsFromCloud();
    if (cloudLocations && cloudLocations.length > 0) {
      window.LOCATIONS_DATA = cloudLocations;
      window.refreshAllMapData();
      console.log(`[Supabase] Live data synced: ${cloudLocations.length} locations loaded.`);
    }
  } catch (err) {
    console.warn('[Supabase] Initial sync failed, staying on fallback data:', err);
  }

  // Subscribe to real-time changes
  if (typeof subscribeCloudRealtime === 'function') {
    subscribeCloudRealtime(async () => {
      const freshData = await fetchLocationsFromCloud();
      if (freshData && freshData.length > 0) {
        window.LOCATIONS_DATA = freshData;
        window.refreshAllMapData();
        if (typeof window.showTemporaryNotice === 'function') {
          window.showTemporaryNotice('📡 [SUPABASE REALTIME] อัปเดตข้อมูลบนแผนที่แล้ว');
        }
      }
    });
  }
}

function initSoundToggle() {
  const btn = document.getElementById('sound-toggle-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    btn.classList.toggle('active', isSoundEnabled);
    btn.innerHTML = isSoundEnabled 
      ? '⚡ <span>AUDIO: ON</span>' 
      : '🔇 <span>AUDIO: MUTED</span>';
    if (isSoundEnabled) {
      window.playCyberClick();
    }
  });
}

function initFilterButtons() {
  const buttons = document.querySelectorAll('.node-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      window.activeFilter = filter;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      window.playCyberClick();

      if (typeof renderProvinces === 'function') renderProvinces();
      if (typeof renderLegoMarkers === 'function') renderLegoMarkers();

      updateActiveFilterDisplay();
      renderDirectoryList();
    });
  });

  document.querySelectorAll('.stat-brick').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      if (filter) {
        const targetBtn = document.querySelector(`.node-btn[data-filter="${filter}"]`);
        if (targetBtn) targetBtn.click();
      }
    });
  });
}

function initSearch() {
  const input = document.getElementById('directory-search');
  const clearBtn = document.getElementById('search-clear-btn');
  if (!input) return;

  input.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim().toLowerCase();
    if (clearBtn) {
      clearBtn.style.display = currentSearchQuery ? 'block' : 'none';
    }
    renderDirectoryList();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      currentSearchQuery = '';
      clearBtn.style.display = 'none';
      input.focus();
      renderDirectoryList();
    });
  }
}

// ==========================================================================
// 3. UI RENDERING
// ==========================================================================
function updateActiveFilterDisplay() {
  const container = document.getElementById('node-overview-container');
  if (!container) return;

  const filter = window.activeFilter;

  if (filter === 'ALL') {
    container.innerHTML = `
      <div class="card-header">
        <span class="card-badge" style="background: rgba(0, 240, 255, 0.15); color: var(--neon-cyan); border-color: var(--neon-cyan);">
          🌐 SYSTEM OVERVIEW • 4 NODES
        </span>
        <span style="font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700; color: #38BDF8;">
          [33 TOTAL SITES ONLINE]
        </span>
      </div>
      <h3>กลุ่มวิจัยและพัฒนาองค์กรแห่งการเรียนรู้ (สพฐ.)</h3>
      <p class="node-tagline">การขับเคลื่อนชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) สู่ห้องเรียนแห่งความสุขประสิทธิภาพสูง</p>
      
      <div class="node-section-title">⚡ ภารกิจและแกนการขับเคลื่อนเชิงลึก</div>
      <div class="node-text">
        มุ่งเน้นการดำเนินงานเชิงลึกและคุณภาพของกระบวนการพัฒนา ไม่เน้นปริมาณโรงเรียนหรือการอบรมเพื่อขยายผล (เพิ่มจำนวน) แต่เน้นคุณภาพของวงจรพัฒนาอย่างเป็นระบบในโรงเรียน และการถอดบทเรียนจัดการความรู้อย่างต่อเนื่อง
      </div>

      <div class="node-section-title">✨ ข้อมูลสำคัญปี 2568</div>
      <div class="node-text" style="border-left-color: var(--neon-yellow);">
        • <strong>เพิ่มโรงเรียนต้นแบบการพัฒนา (รูปแบบที่ 2) 2 โรงเรียน:</strong> รร.บ้านห้วยติ้ว (น่าน) และ รร.แม่หลวงอุปถัมภ์ไทยคีรี (เชียงราย)<br>
        • <strong>สพท. แกนนำ 4 เขตใหม่ปี 2568:</strong> สพป.นนทบุรี เขต 2, สพป.นครศรีธรรมราช เขต 1, สพป.สงขลา เขต 2, สพม.นราธิวาส (มุ่งเน้นการศึกษากลุ่มทุนการพัฒนา)<br>
        • <strong>สพป.น่าน เขต 2:</strong> เป็นเจ้าภาพหลักดำเนินงานร่วมกับโรงเรียนทั้งรูปแบบที่ 2 และ 3
      </div>
    `;
    return;
  }

  const type = NODE_TYPES[filter];
  if (!type) return;

  let extraHtml = '';
  if (type.id === 3) {
    extraHtml = `
      <div class="node-section-title">🌐 โครงสร้างเครือข่ายโรงเรียน (2 เครือข่าย รวม 9 โรงเรียน)</div>
      <div class="network-cluster" style="margin-top: 10px;">
        <div class="lead-school-brick">
          <span>🏫 รร.วัดหัวกระสังข์ (รร.หลักพี่เลี้ยง)</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
            สพป.ฉะเชิงเทรา เขต 2
          </span>
        </div>
        <div class="network-pegs-container">
          <div class="member-school-peg">🔗 รร.บ้านหนองหว้า (ถนอมราษฎร์บำรุง)</div>
          <div class="member-school-peg">🔗 รร.วัดบ้านซ่อง</div>
          <div class="member-school-peg">🔗 รร.บ้านหนองสองห้อง</div>
          <div class="member-school-peg">🔗 รร.วัดธารพูด</div>
          <div class="member-school-peg">🔗 รร.วัดอ่าวช้างไล่</div>
        </div>
      </div>

      <div class="network-cluster">
        <div class="lead-school-brick">
          <span>🏫 รร.บ้านน้ำพุร้อน (รร.หลักพี่เลี้ยง)</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
            สพป.น่าน เขต 2
          </span>
        </div>
        <div class="network-pegs-container">
          <div class="member-school-peg">🔗 รร.บ้านนาบง</div>
          <div class="member-school-peg">🔗 รร.บ้านปางคอม</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="card-header">
      <span class="card-badge" style="background: rgba(255,255,255,0.06); color: ${type.color}; border-color: ${type.color};">
        ● ${type.code.toUpperCase()}
      </span>
      <span style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: #38BDF8;">${type.countLabel}</span>
    </div>
    <h3 style="color: #FFF;">${type.name}</h3>
    <p class="node-tagline">${type.tagline}</p>
    
    <div class="node-section-title">🎯 จุดเน้นการดำเนินงาน</div>
    <div class="node-text" style="border-left-color: ${type.color};">
      ${type.focus}
    </div>

    <div class="node-section-title">📖 การถอดบทเรียนและจัดการองค์ความรู้</div>
    <div class="node-text" style="border-left-color: ${type.color};">
      ${type.reflection}
    </div>

    ${extraHtml}
  `;
}

function renderDirectoryList() {
  const listEl = document.getElementById('directory-list');
  const countBadge = document.getElementById('directory-count-badge');
  if (!listEl) return;

  const currentFilter = window.activeFilter;
  const q = currentSearchQuery;

  const filtered = LOCATIONS_DATA.filter(loc => {
    if (currentFilter !== 'ALL' && loc.typeId !== parseInt(currentFilter)) {
      return false;
    }

    if (q) {
      const matchTitle = loc.title.toLowerCase().includes(q);
      const matchSub = loc.subTitle.toLowerCase().includes(q);
      const matchProv = loc.provinceTh.toLowerCase().includes(q) || loc.provinceEn.toLowerCase().includes(q);
      const matchDetails = (loc.details || '').toLowerCase().includes(q);
      const matchMembers = (loc.networkMembers || []).some(m => m.toLowerCase().includes(q));
      return matchTitle || matchSub || matchProv || matchDetails || matchMembers;
    }

    return true;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} SITES`;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 28px; color: var(--text-muted); font-family: var(--font-mono);">
        <div style="font-size: 2rem; margin-bottom: 8px;">📡</div>
        <div>[NO MATCHING SITES DETECTED]</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(loc => {
    const type = NODE_TYPES[loc.typeId];
    
    // แสดงป้ายลิ้งค์ด่วนถ้ามี
    let quickLinksHtml = '';
    if (loc.websiteUrl || loc.driveDocUrl) {
      quickLinksHtml = `
        <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
          ${loc.websiteUrl ? `<a href="${loc.websiteUrl}" target="_blank" onclick="event.stopPropagation();" style="padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; background: rgba(0,240,255,0.15); border: 1px solid var(--neon-cyan); color: var(--neon-cyan); text-decoration: none; font-weight: 700;">🌐 เว็บไซต์โรงเรียน</a>` : ''}
          ${loc.driveDocUrl ? `<a href="${loc.driveDocUrl}" target="_blank" onclick="event.stopPropagation();" style="padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; background: rgba(255,208,0,0.15); border: 1px solid var(--neon-yellow); color: #FFD000; text-decoration: none; font-weight: 700;">📄 แผนงาน/งานของเขต</a>` : ''}
        </div>
      `;
    }

    return `
      <div class="location-item" data-id="${loc.id}" data-province="${loc.provinceTh}">
        <div class="item-brick-indicator" style="background: ${type.color}; box-shadow: 0 0 10px ${type.color};"></div>
        <div class="item-content">
          <div class="item-title">
            <span>${loc.title}</span>
            ${loc.badge ? `<span class="item-badge-new">${loc.badge}</span>` : ''}
          </div>
          <div class="item-subtitle">${loc.subTitle}</div>
          <div class="item-tags">
            <span class="item-badge-province">📍 ${loc.provinceTh}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">ภาค${loc.region}</span>
            <span style="font-family: var(--font-mono); font-size: 0.72rem; color: ${type.color}; font-weight: 700;">
              • ${type.shortName}
            </span>
          </div>
          ${quickLinksHtml}
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.location-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id');
      const provTh = item.getAttribute('data-province');
      const loc = LOCATIONS_DATA.find(l => l.id === id);

      window.playCyberClick();

      listEl.querySelectorAll('.location-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (typeof zoomToProvince === 'function') {
        zoomToProvince(provTh);
      }

      if (loc) {
        openLocationDetailModal(loc);
      }
    });
  });
}

// ==========================================================================
// 4. MODAL DIALOGS
// ==========================================================================
function initModalEvents() {
  const backdrop = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function closeModal() {
  const backdrop = document.getElementById('detail-modal');
  if (backdrop) {
    backdrop.classList.remove('open');
    if (window.playHoverBlip) window.playHoverBlip();
  }
}

window.openProvinceModal = function(provinceTh, nodes) {
  const backdrop = document.getElementById('detail-modal');
  const header = document.getElementById('modal-header');
  const titleBox = document.getElementById('modal-title-box');
  const body = document.getElementById('modal-body');
  if (!backdrop || !body) return;

  header.style.background = 'rgba(6, 9, 19, 0.9)';
  titleBox.innerHTML = `
    <h3>📍 จังหวัด${provinceTh}</h3>
    <p>หน่วยงานและสถานศึกษาในระบบเครือข่าย (พบ ${nodes.length} แห่ง)</p>
  `;

  let contentHtml = '';
  nodes.forEach(loc => {
    const type = NODE_TYPES[loc.typeId];
    
    let networkDetails = '';
    if (loc.networkMembers && loc.networkMembers.length > 0) {
      networkDetails = `
        <div style="margin-top: 12px; background: rgba(6, 9, 19, 0.6); padding: 12px; border-radius: 8px; border: 1px solid var(--neon-green);">
          <div style="font-family: var(--font-hud); font-weight: 700; color: var(--neon-green); margin-bottom: 6px;">
            🏫 โรงเรียนหลัก (พี่เลี้ยง): ${loc.networkLeader}
          </div>
          <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-dim); margin-bottom: 6px;">
            โรงเรียนเครือข่ายร่วมพัฒนา (${loc.networkMembers.length} แห่ง):
          </div>
          <ul style="padding-left: 20px; font-size: 0.84rem; color: #A3FFDC; line-height: 1.6;">
            ${loc.networkMembers.map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // ลิงก์เอกสาร Google Drive และ เว็บไซต์
    let linkButtonsHtml = '';
    if (loc.websiteUrl || loc.driveDocUrl) {
      linkButtonsHtml = `
        <div style="margin-top: 14px; padding: 12px; background: rgba(0,0,0,0.4); border-radius: 8px; border: 1px solid rgba(0, 240, 255, 0.3);">
          <div style="font-family: var(--font-hud); font-size: 0.8rem; font-weight: 700; color: var(--neon-cyan); margin-bottom: 8px;">
            🔗 แหล่งข้อมูลและเอกสารสำคัญ:
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${loc.driveDocUrl ? `
              <a href="${loc.driveDocUrl}" target="_blank" class="cyber-btn" style="background: rgba(255, 208, 0, 0.15); border-color: var(--neon-yellow); color: #FFD000; text-decoration: none;">
                📄 ดูเอกสารงานของเขต (Google Drive)
              </a>
            ` : ''}
            ${loc.websiteUrl ? `
              <a href="${loc.websiteUrl}" target="_blank" class="cyber-btn" style="text-decoration: none;">
                🌐 เยี่ยมชมเว็บไซต์โรงเรียน (www.tupkk.ac.th)
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }

    contentHtml += `
      <div class="modal-section" style="border-left: 4px solid ${type.color};">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <h4 style="color: #FFF; font-size: 1.05rem; margin: 0;">${loc.title}</h4>
          <span style="background: rgba(255,255,255,0.06); color: ${type.color}; border: 1px solid ${type.color}; padding: 2px 10px; border-radius: 20px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700;">
            ${type.shortName}
          </span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 8px;">${loc.subTitle}</div>
        <p style="font-size: 0.88rem; color: var(--text-main);">${loc.details}</p>
        ${linkButtonsHtml}
        ${networkDetails}
      </div>
    `;
  });

  body.innerHTML = contentHtml;
  backdrop.classList.add('open');
};

function openLocationDetailModal(loc) {
  const backdrop = document.getElementById('detail-modal');
  const header = document.getElementById('modal-header');
  const titleBox = document.getElementById('modal-title-box');
  const body = document.getElementById('modal-body');
  if (!backdrop || !body) return;

  const type = NODE_TYPES[loc.typeId];

  header.style.background = 'rgba(6, 9, 19, 0.9)';
  titleBox.innerHTML = `
    <h3 style="color: #FFF;">${loc.title}</h3>
    <p style="color: ${type.color}; font-family: var(--font-mono);">[SITE ID: ${loc.id.toUpperCase()}] • จังหวัด${loc.provinceTh}</p>
  `;

  // แผงแสดงเอกสาร Google Drive และ เว็บไซต์
  let linksPanelHtml = '';
  if (loc.websiteUrl || loc.driveDocUrl) {
    linksPanelHtml = `
      <div class="modal-section" style="border-left: 4px solid var(--neon-cyan); background: rgba(0, 240, 255, 0.05); border-color: rgba(0, 240, 255, 0.3);">
        <h4 style="color: var(--neon-cyan);">🔗 ข้อมูลงานของเขตพื้นที่ & เว็บไซต์สถานศึกษา</h4>
        <p style="margin-bottom: 12px; font-size: 0.85rem; color: var(--text-dim);">
          สามารถกดเปิดดูเอกสารแผนงานการขับเคลื่อนของเขตพื้นที่ และเข้าชมเว็บไซต์โรงเรียนได้โดยตรง:
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${loc.driveDocUrl ? `
            <a href="${loc.driveDocUrl}" target="_blank" class="cyber-btn" style="background: rgba(255, 208, 0, 0.2); border-color: var(--neon-yellow); color: #FFD000; text-decoration: none; padding: 10px 18px; font-size: 0.88rem; box-shadow: 0 0 16px rgba(255, 208, 0, 0.3);">
              📄 เอกสาร/แผนงานของเขตพื้นที่ (Google Drive)
            </a>
          ` : ''}
          ${loc.websiteUrl ? `
            <a href="${loc.websiteUrl}" target="_blank" class="cyber-btn" style="text-decoration: none; padding: 10px 18px; font-size: 0.88rem;">
              🌐 เว็บไซต์โรงเรียน (www.tupkk.ac.th)
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  let networkHtml = '';
  if (loc.networkMembers && loc.networkMembers.length > 0) {
    networkHtml = `
      <div class="modal-section" style="border-left: 4px solid var(--neon-green);">
        <h4 style="color: var(--neon-green);">🌐 ผังโรงเรียนเครือข่ายการพัฒนา</h4>
        <div style="background: rgba(6, 9, 19, 0.7); padding: 14px; border-radius: 8px; border: 1px solid var(--neon-green); margin-top: 10px;">
          <div style="font-family: var(--font-hud); font-weight: 700; color: #FFF; font-size: 0.95rem; margin-bottom: 10px;">
            🏫 โรงเรียนหลัก: ${loc.networkLeader}
          </div>
          <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-dim); margin-bottom: 8px;">
            โรงเรียนเครือข่ายร่วมพัฒนา (${loc.networkMembers.length} แห่ง):
          </div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
            ${loc.networkMembers.map(m => `
              <div style="padding: 8px 12px; background: rgba(0, 255, 163, 0.1); border-radius: 6px; font-size: 0.84rem; color: #A3FFDC; border: 1px solid rgba(0, 255, 163, 0.3);">
                🔗 ${m}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  body.innerHTML = `
    <div class="modal-section" style="border-left: 4px solid ${type.color};">
      <h4>📌 ข้อมูลสถานศึกษา/หน่วยงาน</h4>
      <p><strong>ชื่อเต็ม:</strong> ${loc.subTitle}</p>
      <p><strong>พื้นที่:</strong> จังหวัด${loc.provinceTh} (${loc.provinceEn}) ภาค${loc.region}</p>
      <p><strong>ประเภท Node:</strong> ${type.name} (${type.code})</p>
      <p style="margin-top: 8px;"><strong>รายละเอียดการดำเนินงาน:</strong> ${loc.details}</p>
      ${loc.badge ? `<div style="margin-top: 10px;"><span class="item-badge-new">${loc.badge}</span></div>` : ''}
    </div>

    ${linksPanelHtml}
    ${networkHtml}

    <div class="modal-section">
      <h4>🎯 จุดเน้นของ ${type.shortName}</h4>
      <p>${type.focus}</p>
    </div>

    <div class="modal-section">
      <h4>📖 แนวทางการถอดบทเรียนและจัดการองค์ความรู้</h4>
      <p>${type.reflection}</p>
    </div>
  `;

  backdrop.classList.add('open');
}

window.showTemporaryNotice = function(msg) {
  const notice = document.createElement('div');
  notice.style.position = 'fixed';
  notice.style.bottom = '28px';
  notice.style.left = '50%';
  notice.style.transform = 'translateX(-50%)';
  notice.style.background = 'rgba(10, 16, 30, 0.95)';
  notice.style.color = 'var(--neon-cyan)';
  notice.style.border = '1px solid var(--neon-cyan)';
  notice.style.padding = '10px 22px';
  notice.style.borderRadius = '20px';
  notice.style.fontFamily = 'var(--font-mono)';
  notice.style.fontSize = '0.85rem';
  notice.style.fontWeight = '700';
  notice.style.boxShadow = '0 0 20px var(--neon-cyan-glow)';
  notice.style.zIndex = '9999';
  notice.textContent = msg;

  document.body.appendChild(notice);
  setTimeout(() => {
    notice.style.transition = 'opacity 0.3s ease';
    notice.style.opacity = '0';
    setTimeout(() => notice.remove(), 300);
  }, 2200);
};
