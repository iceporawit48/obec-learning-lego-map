// map.js - ตัวควบคุมแผนที่เวกเตอร์ประเทศไทยและหมุดโฮโลแกรมล้ำยุค (Futuristic Cyber Beacons)

let currentScale = 1;
let currentTranslate = { x: 0, y: 0 };
let isPointerDown = false;
let isDragging = false;
let hasMoved = false;
let pointerStartPos = { x: 0, y: 0 };
let startPan = { x: 0, y: 0 };
const DRAG_THRESHOLD = 5;

window.isMapDragging = false;
window.hasMapMoved = false;

function initThailandMap() {
  const svg = document.getElementById('thailand-map-svg');
  if (!svg || typeof THAILAND_MAP_PROVINCES === 'undefined') {
    console.error('Map SVG or THAILAND_MAP_PROVINCES not found');
    return;
  }

  svg.setAttribute('viewBox', '0 0 600 960');
  svg.innerHTML = `
    <defs>
      <!-- Cyber Neon Glow Filters -->
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2"/>
        <feMerge>
          <feMergeNode in="blur2"/>
          <feMergeNode in="blur1"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <filter id="hud-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.7)"/>
      </filter>

      <!-- Multi-Node Cyber Gradient -->
      <linearGradient id="cyber-multi-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF2E63" />
        <stop offset="30%" stop-color="#FFD000" />
        <stop offset="65%" stop-color="#00FFA3" />
        <stop offset="100%" stop-color="#00F0FF" />
      </linearGradient>
    </defs>
    <g id="map-pan-zoom-container">
      <g id="provinces-layer"></g>
      <g id="markers-layer"></g>
    </g>
  `;

  renderProvinces();
  renderLegoMarkers();
  setupMapInteractions();
}

// วาดจังหวัดทั้ง 77 จังหวัด
function renderProvinces() {
  const layer = document.getElementById('provinces-layer');
  if (!layer) return;

  const currentFilter = window.activeFilter || 'ALL';

  // รวบรวมข้อมูลจังหวัดที่มี Node
  const provinceNodesMap = {};
  LOCATIONS_DATA.forEach(loc => {
    const pTh = loc.provinceTh;
    if (!provinceNodesMap[pTh]) provinceNodesMap[pTh] = [];
    provinceNodesMap[pTh].push(loc);

    if (loc.secondaryProvinceTh) {
      if (!provinceNodesMap[loc.secondaryProvinceTh]) provinceNodesMap[loc.secondaryProvinceTh] = [];
      provinceNodesMap[loc.secondaryProvinceTh].push(loc);
    }
  });

  layer.innerHTML = '';

  THAILAND_MAP_PROVINCES.forEach(prov => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', prov.path);
    path.setAttribute('id', 'prov-' + prov.id);
    path.setAttribute('data-name-th', prov.name_th);
    path.setAttribute('data-name-en', prov.name_en);

    const nodesInProv = provinceNodesMap[prov.name_th] || [];
    let matchingNodes = nodesInProv;
    if (currentFilter !== 'ALL') {
      matchingNodes = nodesInProv.filter(n => n.typeId === parseInt(currentFilter));
    }

    let cssClass = 'province-path';
    if (matchingNodes.length > 0) {
      const types = [...new Set(matchingNodes.map(n => n.typeId))];
      if (types.length > 1) {
        cssClass += ' province-multi-node';
      } else {
        cssClass += ` province-has-node-${types[0]}`;
      }
    }

    path.setAttribute('class', cssClass);

    path.addEventListener('mouseenter', (e) => {
      if (window.playHoverBlip) window.playHoverBlip();
      showProvinceTooltip(prov, nodesInProv, e);
    });

    path.addEventListener('mousemove', (e) => {
      updateTooltipPosition(e);
    });

    path.addEventListener('mouseleave', () => {
      hideProvinceTooltip();
    });

    path.addEventListener('click', (e) => {
      if (window.isMapDragging || window.hasMapMoved) return;
      if (window.playCyberClick) window.playCyberClick();
      if (nodesInProv.length > 0) {
        openProvinceModal(prov.name_th, nodesInProv);
      } else {
        showTemporaryNotice(`[RADAR] จังหวัด${prov.name_th} — ยังไม่มี Node ในระบบ`);
      }
    });

    layer.appendChild(path);
  });
}

// วาดหมุดโฮโลแกรมล้ำยุค (Futuristic Hologram Beacons)
function renderLegoMarkers() {
  const layer = document.getElementById('markers-layer');
  if (!layer) return;

  const currentFilter = window.activeFilter || 'ALL';

  const provGroups = {};
  LOCATIONS_DATA.forEach(loc => {
    if (currentFilter !== 'ALL' && loc.typeId !== parseInt(currentFilter)) {
      return;
    }
    const p = loc.provinceTh;
    if (!provGroups[p]) provGroups[p] = [];
    provGroups[p].push(loc);

    if (loc.secondaryProvinceTh) {
      const sp = loc.secondaryProvinceTh;
      if (!provGroups[sp]) provGroups[sp] = [];
      provGroups[sp].push(loc);
    }
  });

  layer.innerHTML = '';

  Object.keys(provGroups).forEach(provTh => {
    const provInfo = THAILAND_MAP_PROVINCES.find(p => p.name_th === provTh);
    if (!provInfo || !provInfo.center) return;

    const [cx, cy] = provInfo.center;
    const nodes = provGroups[provTh];
    const types = [...new Set(nodes.map(n => n.typeId))];

    // กำหนดสีเลเซอร์ไฮเทค
    let neonColor = '#00F0FF';
    let glowColor = 'rgba(0, 240, 255, 0.5)';
    if (types.length === 1) {
      const t = types[0];
      if (t === 1) { neonColor = '#FF2E63'; glowColor = 'rgba(255, 46, 99, 0.6)'; }
      else if (t === 2) { neonColor = '#FFD000'; glowColor = 'rgba(255, 208, 0, 0.6)'; }
      else if (t === 3) { neonColor = '#00FFA3'; glowColor = 'rgba(0, 255, 163, 0.6)'; }
      else if (t === 4) { neonColor = '#0099FF'; glowColor = 'rgba(0, 153, 255, 0.6)'; }
    } else {
      neonColor = 'url(#cyber-multi-grad)';
      glowColor = 'rgba(176, 38, 255, 0.6)';
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'lego-marker');
    g.setAttribute('transform', `translate(${cx}, ${cy})`);
    g.setAttribute('data-province', provTh);

    // Futuristic Cyber Beacon SVG: Outer group maintains translation, inner group scales cleanly
    g.innerHTML = `
      <!-- Invisible stable hit circle to prevent jitter -->
      <circle cx="0" cy="-14" r="24" fill="transparent" />

      <!-- Inner visual badge that scales without disturbing parent SVG translate -->
      <g class="marker-beacon-body" filter="url(#hud-shadow)">
        <!-- Vertical Laser Beam downwards to province center -->
        <line x1="0" y1="-4" x2="0" y2="4" stroke="${neonColor}" stroke-width="2" stroke-linecap="round" />
        <circle cx="0" cy="4" r="2.5" fill="#FFFFFF" />

        <!-- Futuristic Hexagonal/Diamond HUD Badge -->
        <polygon points="0,-30 16,-22 16,-6 0,2 -16,-6 -16,-22" fill="#060913" stroke="${neonColor}" stroke-width="2" />
        
        <!-- Inner glow accents -->
        <circle cx="0" cy="-14" r="10" fill="${glowColor}" opacity="0.3" />
        
        <!-- Count Text in Sci-Fi Font -->
        <text x="0" y="-13" fill="#FFFFFF" 
              font-family="'Orbitron', sans-serif" font-size="11" font-weight="900" 
              text-anchor="middle" dominant-baseline="central" letter-spacing="0.5">${nodes.length}</text>
      </g>
    `;

    g.addEventListener('mouseenter', (e) => {
      if (window.playHoverBlip) window.playHoverBlip();
      showProvinceTooltip(provInfo, nodes, e);
    });

    g.addEventListener('mousemove', (e) => {
      updateTooltipPosition(e);
    });

    g.addEventListener('mouseleave', () => {
      hideProvinceTooltip();
    });

    g.addEventListener('click', (e) => {
      if (window.isMapDragging || window.hasMapMoved) return;
      e.stopPropagation();
      if (window.playCyberClick) window.playCyberClick();
      openProvinceModal(provTh, nodes);
    });

    layer.appendChild(g);
  });
}

// Tooltip แบบ Holographic HUD
function showProvinceTooltip(provInfo, nodes, event) {
  const tooltip = document.getElementById('map-tooltip');
  if (!tooltip) return;

  let nodesHtml = '';
  if (nodes && nodes.length > 0) {
    nodesHtml = nodes.map(n => {
      const type = NODE_TYPES[n.typeId];
      return `
        <div style="margin-top: 8px; padding: 8px 10px; border-radius: 6px; background: rgba(15, 23, 42, 0.7); border-left: 3px solid ${type.color};">
          <div style="font-family: var(--font-hud); font-weight: 700; font-size: 0.75rem; color: ${type.color}; letter-spacing: 0.04em;">
            [${type.code.toUpperCase()}] ${type.shortName}
          </div>
          <div style="font-size: 0.84rem; font-weight: 700; color: #FFF; margin-top: 2px;">${n.title}</div>
          <div style="font-size: 0.74rem; color: #94A3B8;">${n.subTitle}</div>
        </div>
      `;
    }).join('');
  } else {
    nodesHtml = '<div style="font-size: 0.78rem; color: #64748B; margin-top: 6px; font-family: var(--font-mono);">[NO ACTIVE NODES DETECTED]</div>';
  }

  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span>📍 ${provInfo.name_th}</span>
      <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--neon-cyan); opacity: 0.85;">${provInfo.name_en.toUpperCase()}</span>
    </div>
    <div class="tooltip-body">
      ${nodes.length > 0 ? `<div style="font-family: var(--font-mono); font-size: 0.76rem; color: #38BDF8;">● SYSTEM DETECTED: ${nodes.length} SITES</div>` : ''}
      ${nodesHtml}
      ${nodes.length > 0 ? '<div style="margin-top: 10px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--neon-cyan); font-weight: 700;">▶ CLICK FOR TELEMETRY & SPECS</div>' : ''}
    </div>
  `;

  tooltip.classList.add('visible');
  updateTooltipPosition(event);
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('map-tooltip');
  const viewport = document.querySelector('.map-viewport');
  if (!tooltip || !viewport) return;

  const rect = viewport.getBoundingClientRect();
  const tooltipWidth = tooltip.offsetWidth || 300;
  const tooltipHeight = tooltip.offsetHeight || 180;

  // Offset safely from cursor position
  let x = event.clientX - rect.left + 20;
  let y = event.clientY - rect.top + 20;

  // Clamp horizontally within viewport
  if (x + tooltipWidth > rect.width - 15) {
    x = event.clientX - rect.left - tooltipWidth - 20;
  }
  if (x < 15) {
    x = 15;
  }

  // Clamp vertically within viewport
  if (y + tooltipHeight > rect.height - 15) {
    y = event.clientY - rect.top - tooltipHeight - 20;
  }
  if (y < 15) {
    y = 15;
  }

  tooltip.style.left = `${Math.round(x)}px`;
  tooltip.style.top = `${Math.round(y)}px`;
}

function hideProvinceTooltip() {
  const tooltip = document.getElementById('map-tooltip');
  if (tooltip) {
    tooltip.classList.remove('visible');
  }
}

function setupMapInteractions() {
  const viewport = document.querySelector('.map-viewport');
  const container = document.getElementById('map-pan-zoom-container');
  if (!viewport || !container) return;

  const updateTransform = () => {
    container.setAttribute('transform', 
      `translate(${currentTranslate.x}, ${currentTranslate.y}) scale(${currentScale})`);
  };

  document.getElementById('zoom-in-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.playCyberClick) window.playCyberClick();
    currentScale = Math.min(3.8, currentScale + 0.3);
    updateTransform();
  });

  document.getElementById('zoom-out-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.playCyberClick) window.playCyberClick();
    currentScale = Math.max(0.7, currentScale - 0.3);
    updateTransform();
  });

  document.getElementById('zoom-reset-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.playCyberClick) window.playCyberClick();
    currentScale = 1;
    currentTranslate = { x: 0, y: 0 };
    updateTransform();
  });

  viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.map-btn') || e.target.closest('#map-tooltip')) return;
    if (e.button !== 0) return; // Only left-click triggers pan

    isPointerDown = true;
    isDragging = false;
    hasMoved = false;
    window.isMapDragging = false;
    window.hasMapMoved = false;

    pointerStartPos = { x: e.clientX, y: e.clientY };
    startPan = { x: e.clientX - currentTranslate.x, y: e.clientY - currentTranslate.y };
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPointerDown) return;

    const dx = e.clientX - pointerStartPos.x;
    const dy = e.clientY - pointerStartPos.y;

    // Only engage drag if movement exceeds threshold (avoids micro-shaking on click)
    if (!isDragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      isDragging = true;
      hasMoved = true;
      window.isMapDragging = true;
      window.hasMapMoved = true;
      viewport.style.cursor = 'grabbing';
    }

    if (isDragging) {
      currentTranslate = {
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      };
      updateTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    viewport.style.cursor = '';

    // Small delay to let click handlers inspect hasMoved before clearing
    setTimeout(() => {
      isDragging = false;
      hasMoved = false;
      window.isMapDragging = false;
      window.hasMapMoved = false;
    }, 60);
  });

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    currentScale = Math.min(3.8, Math.max(0.7, currentScale * zoomFactor));
    updateTransform();
  }, { passive: false });
}

function zoomToProvince(provinceNameTh) {
  const prov = THAILAND_MAP_PROVINCES.find(p => p.name_th === provinceNameTh);
  if (!prov || !prov.center) return;

  const container = document.getElementById('map-pan-zoom-container');
  if (!container) return;

  const [cx, cy] = prov.center;
  isPointerDown = false;
  isDragging = false;
  hasMoved = false;
  window.isMapDragging = false;
  window.hasMapMoved = false;

  currentScale = 2.2;
  currentTranslate = {
    x: 300 - cx * currentScale,
    y: 480 - cy * currentScale
  };

  container.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
  container.setAttribute('transform', 
    `translate(${currentTranslate.x}, ${currentTranslate.y}) scale(${currentScale})`);

  setTimeout(() => {
    container.style.transition = '';
  }, 450);

  const path = document.getElementById('prov-' + prov.id);
  if (path) {
    path.style.stroke = '#00F0FF';
    path.style.strokeWidth = '3';
    path.style.filter = 'drop-shadow(0 0 16px #00F0FF)';
    setTimeout(() => {
      path.style.stroke = '';
      path.style.strokeWidth = '';
      path.style.filter = '';
    }, 2200);
  }
}
