let islands = [];
const itemSelect = document.getElementById('itemSelect');
const tableWrap = document.getElementById('tableWrap');
const bestInfo = document.getElementById('bestInfo');
const routesEl = document.getElementById('routes');
const minProfitInput = document.getElementById('minProfit');
const refreshBtn = document.getElementById('refreshBtn');
const legendEl = document.getElementById('legend');

// Danh sách item + icon + tên
const ITEM_META = {
  ca: { icon: '🐟', label: 'Cá' },
  go: { icon: '🪵', label: 'Gỗ' },
  da: { icon: '🪨', label: 'Đá' },
  bac: { icon: '🪙', label: 'Bạc' },
  vang: { icon: '🥇', label: 'Vàng' },
  kimcuong: { icon: '💎', label: 'Kim cương' }
};

// Load dữ liệu JSON
async function loadData() {
  try {
    // Trên GitHub Pages: dùng đường dẫn tương đối
    const resp = await fetch('islands.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    islands = await resp.json();

    populateItemList();
    renderLegend();
    render();
  } catch (err) {
    tableWrap.innerHTML = `<div class="text-danger">❌ Lỗi load islands.json: ${err.message}</div>`;
  }
}

// Lấy keys các item có trong data
function getAllItemKeys() {
  const present = new Set();
  islands.forEach(is => {
    Object.keys(is.items || {}).forEach(k => present.add(k));
  });
  return Object.keys(ITEM_META).filter(k => present.has(k));
}

// Đổ danh sách mặt hàng vào select
function populateItemList() {
  const keys = getAllItemKeys();
  itemSelect.innerHTML = '';
  keys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = `${ITEM_META[k]?.icon || ''} ${ITEM_META[k]?.label || k}`;
    itemSelect.appendChild(opt);
  });
  if (keys.length > 0) itemSelect.value = keys[0];
}

// Hiển thị bảng legend
function renderLegend() {
  if (!legendEl) return;
  legendEl.innerHTML = '';
  Object.keys(ITEM_META).forEach(k => {
    const meta = ITEM_META[k];
    const div = document.createElement('div');
    div.className = 'd-flex align-items-center gap-2 mb-1';
    div.innerHTML = `<span>${meta.icon}</span><span><strong>${meta.label}</strong> <small class="text-muted">(${k})</small></span>`;
    legendEl.appendChild(div);
  });
}

// Render toàn bộ
function render() {
  const item = itemSelect.value;
  if (!item) {
    tableWrap.innerHTML = '<div class="small">Không có loại hàng.</div>';
    return;
  }
  renderTableForItem(item);
  renderBestAndRoutes(item);
}

// Bảng giá theo đảo
function renderTableForItem(item) {
  let html = `
    <table class="table table-sm table-striped">
      <thead>
        <tr>
          <th>Đảo</th>
          <th>Buy (đảo → thuyền)</th>
          <th>Sell (thuyền → đảo)</th>
        </tr>
      </thead>
      <tbody>
  `;
  islands.forEach(is => {
    const it = is.items[item];
    html += `
      <tr>
        <td><strong>${escapeHtml(is.name)}</strong></td>
        <td>${it?.buy ?? '—'}</td>
        <td>${it?.sell ?? '—'}</td>
      </tr>
    `;
  });
  html += '</tbody></table>';
  tableWrap.innerHTML = html;
}

// Best Buy / Sell + Routes
function renderBestAndRoutes(item) {
  const avail = islands.map(is => {
    const it = is.items[item];
    return { name: is.name, buy: it?.buy ?? null, sell: it?.sell ?? null };
  });

  const buys = avail.filter(a => a.buy !== null).sort((a, b) => a.buy - b.buy);
  const sells = avail.filter(a => a.sell !== null).sort((a, b) => b.sell - a.sell);

  const bestBuy = buys[0] || null;
  const bestSell = sells[0] || null;

  let html = '';
  if (bestBuy) {
    html += `<p>🏝️ <strong>Mua rẻ nhất</strong>: ${escapeHtml(bestBuy.name)} (${bestBuy.buy})</p>`;
  }
  if (bestSell) {
    html += `<p>🏝️ <strong>Bán đắt nhất</strong>: ${escapeHtml(bestSell.name)} (${bestSell.sell})</p>`;
  }
  bestInfo.innerHTML = html || '<div class="small">Không có dữ liệu</div>';

  // Routes
  const routes = [];
  for (const b of buys) {
    for (const s of sells) {
      if (b.name === s.name) continue;
      const profit = s.sell - b.buy;
      if (profit > 0) {
        routes.push({ from: b.name, to: s.name, buy: b.buy, sell: s.sell, profit });
      }
    }
  }

  const minProfit = Number(minProfitInput.value) || 0;
  const good = routes.filter(r => r.profit >= minProfit).sort((a, b) => b.profit - a.profit);

  if (good.length === 0) {
    routesEl.innerHTML = `<div class="small">Không có route có lời ≥ ${minProfit} vàng.</div>`;
    return;
  }

  routesEl.innerHTML = '';
  good.forEach(r => {
    const div = document.createElement('div');
    div.className = 'border rounded p-2 mb-2';
    div.innerHTML = `
      <div>🚢 <strong>${escapeHtml(r.from)}</strong> (buy ${r.buy}) → 
           <strong>${escapeHtml(r.to)}</strong> (sell ${r.sell})</div>
      <div class="small text-success">Lãi: +${r.profit} vàng</div>
    `;
    routesEl.appendChild(div);
  });
}

// Escape HTML
function escapeHtml(s) {
  return (s + '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Event listeners
itemSelect?.addEventListener('change', render);
minProfitInput?.addEventListener('input', render);
refreshBtn?.addEventListener('click', render);

// Chạy
document.addEventListener('DOMContentLoaded', loadData);
