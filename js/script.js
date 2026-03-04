import config from "../data/data.js";
import { db, rtdbUrl } from "./firebase.js";

const titleEl = document.getElementById('title');
const rowsEl = document.getElementById('rows');
const columnsEl = document.getElementById('columns');
const addRowBtn = document.getElementById('addRow');
const saveBtn = document.getElementById('saveBtn');

// Initialize UI from config
if (titleEl) titleEl.value = config.title || '';

// floors
const floors = ['tang1','tang2','tang3'];
let currentFloor = floors[0];
// detect initial floor from URL (supports ?floor= or path containing tangN)
try { currentFloor = detectFloorFromUrl(); } catch (e) { currentFloor = floors[0]; }

let columns = ['col1','col2'];

const floorTabsEl = document.getElementById('floorTabs');

function detectFloorFromUrl() {
	try {
		const p = (location.pathname || '').replace(/\/$/, '');
		// look for tangN anywhere in path
		const m = p.match(/tang\d+/i);
		if (m && floors.includes(m[0].toLowerCase())) return m[0].toLowerCase();
		const sp = new URLSearchParams(location.search || '');
		const q = sp.get('floor');
		if (q && floors.includes(q.toLowerCase())) return q.toLowerCase();
	} catch (e) { /* ignore */ }
	return floors[0];
}

function setUrlFloor(floor) {
	try {
		const sp = new URLSearchParams(location.search || '');
		sp.set('floor', floor);
		const newUrl = location.pathname + '?' + sp.toString();
		history.replaceState(null, '', newUrl);
	} catch (e) { /* ignore */ }
}

function renderFloorTabs() {
	if (!floorTabsEl) return;
	floorTabsEl.innerHTML = '';
	const floorLabels = { tang1: 'Tầng 1', tang2: 'Tầng 2', tang3: 'Tầng 3' };
	floors.forEach(f => {
		const btn = document.createElement('button');
		btn.textContent = floorLabels[f] || f.toUpperCase();
		btn.className = (f === currentFloor) ? 'floor-tab active' : 'floor-tab';
		btn.onclick = () => {
			if (f === currentFloor) return;
			currentFloor = f;
			// update active state
			renderFloorTabs();
			// update URL so this tab is shareable
			setUrlFloor(currentFloor);
			// load data for selected floor
			loadInitial(currentFloor);
		};
		floorTabsEl.appendChild(btn);
	});
}

function renderColumnsUI() {
	if (!columnsEl) return;
	columnsEl.innerHTML = '';
	columns.forEach((c, idx) => {
		const chip = document.createElement('span');
		chip.style = 'display:inline-flex; align-items:center; margin-right:8px; padding:6px 8px; border-radius:8px; background:rgba(255,255,255,0.03)';
		chip.textContent = 'Cột ' + (idx+1);
		const rm = document.createElement('button');
		rm.textContent = '✕';
		rm.style = 'margin-left:8px; padding:4px; border-radius:6px; background:transparent; color:var(--muted); border:none; cursor:pointer';
		rm.onclick = () => {
			if (!confirm('Xóa ' + ('Cột ' + (idx+1)) + '? Dữ liệu sẽ bị xoá.')) return;
			removeColumn(idx);
		};
		chip.appendChild(rm);
		columnsEl.appendChild(chip);
	});
	// add new column button
	const btn = document.createElement('button');
	btn.textContent = 'Thêm cột';
	btn.onclick = () => addColumn('col' + (columns.length + 1));
	columnsEl.appendChild(btn);
}

function addColumn(name) {
	columns.push(name);
	// append input for each existing row
	Array.from(rowsEl.children).forEach(row => {
		const el = createInputForColumn(name, '');
		const del = row.querySelector('button');
		row.insertBefore(el, del);
	});
	renderColumnsUI();
}

function removeColumn(index) {
	const name = columns[index];
	columns.splice(index, 1);
	// remove inputs for that column
	Array.from(rowsEl.children).forEach(row => {
		const el = row.querySelector('[data-col="' + name + '"]');
		if (el) el.remove();
	});
	renderColumnsUI();
}

function createInputForColumn(col, value) {
	// value may be a string or an object { text, size }
	let textVal = '';
	let sizeVal = 'normal';
	if (value && typeof value === 'object') {
		textVal = value.text || '';
		sizeVal = value.size || 'normal';
	} else {
		textVal = value || '';
	}

	// always use textarea for better multiline editing and consistent sizing
	const input = document.createElement('textarea');
	input.style = 'flex:1; margin-right:8px; min-height:56px; padding:10px; border-radius:8px; overflow:hidden; resize:none; background:transparent; border:2px solid rgba(255,255,255,0.06); color:inherit';
	// auto-resize
	function autoResize(inner) { inner.style.height = 'auto'; inner.style.height = inner.scrollHeight + 'px'; }
	input.addEventListener('input', (e) => autoResize(e.target));
	setTimeout(() => autoResize(input), 0);
	input.value = textVal;
	// placeholder as 'Cột N'
	const idx = columns.indexOf(col);
	input.placeholder = 'Cột ' + (idx >= 0 ? (idx+1) : '');

	// create size selector
	const sizeSel = document.createElement('select');
	sizeSel.style = 'width:110px; margin-left:8px; padding:6px; border-radius:6px; border:2px solid rgba(255,255,255,0.06); background:transparent; color:inherit';
	[['small','Nhỏ'],['normal','Bình thường'],['large','Lớn']].forEach(([val,label]) => {
		const o = document.createElement('option'); o.value = val; o.textContent = label; if (val===sizeVal) o.selected = true; sizeSel.appendChild(o);
	});

	// wrapper holds input + selector and bears data-col attr
	const wrapper = document.createElement('span');
	wrapper.setAttribute('data-col', col);
	const colIdx = columns.indexOf(col);
	if (colIdx === 0) {
		// first column: fixed smaller width
		wrapper.style = 'display:flex;align-items:center;flex:0 0 22%;gap:8px;min-width:120px';
		input.style.width = '100%';
	} else {
		// other columns: flexible
		wrapper.style = 'display:flex;align-items:flex-start;flex:1;gap:8px;min-width:0';
	}
	wrapper.appendChild(input);
	wrapper.appendChild(sizeSel);
	return wrapper;
}

function createRowItem(item = {}) {
	const wrapper = document.createElement('div');
	wrapper.className = 'admin-row';
	wrapper.style = 'margin-bottom:12px; padding:10px; border-radius:10px; border:2px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.01)';

	// create inputs for each column
	columns.forEach(col => {
		const val = item[col] || '';
		const el = createInputForColumn(col, val);
		wrapper.appendChild(el);
	});

	const delBtn = document.createElement('button');
	delBtn.textContent = 'Xóa';
	delBtn.onclick = () => wrapper.remove();

	wrapper.appendChild(delBtn);

	return wrapper;
}

async function populateFromData(obj) {
	// clear existing
	rowsEl.innerHTML = '';
	titleEl.value = obj.title || '';
	// determine columns and map data to colN keys (generic: no special role/content handling)
	if (obj.rows && obj.rows.length > 0) {
		const rawRows = obj.rows;
		// if rows are arrays, convert by position
		const isArrayRows = rawRows.every(r => Array.isArray(r));
		if (isArrayRows) {
			let max = 0;
			rawRows.forEach(a => { if (a.length > max) max = a.length; });
			if (max < 1) max = 1;
			columns = [];
			for (let i = 1; i <= max; i++) columns.push('col' + i);
			obj.rows = rawRows.map(a => {
				const o = {};
				for (let i = 0; i < columns.length; i++) o[columns[i]] = a[i] || '';
				return o;
			});
		} else {
			// rows are objects: detect max col index across all rows
			let maxIdx = 0;
			rawRows.forEach(r => {
				if (!r || typeof r !== 'object') return;
				Object.keys(r).forEach(k => {
					const m = k.match(/^col(\d+)$/);
					if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
				});
			});
			if (maxIdx < 1) maxIdx = 1;
			columns = [];
			for (let i = 1; i <= maxIdx; i++) columns.push('col' + i);
			// normalize rows: ensure each row has keys for all columns
			obj.rows = rawRows.map(r => {
				const o = {};
				for (let i = 0; i < columns.length; i++) {
					const k = columns[i];
					if (r && Object.prototype.hasOwnProperty.call(r, k)) o[k] = r[k];
					else o[k] = '';
				}
				return o;
			});
		}
	}
	renderColumnsUI();
	(obj.rows || []).forEach(it => rowsEl.appendChild(createRowItem(it)));
}

// Try to load existing data from Realtime DB; fall back to config
async function loadInitial(floor = currentFloor) {
	// clear existing UI first to avoid duplicates when switching floors
	if (rowsEl) rowsEl.innerHTML = '';
	if (rtdbUrl) {
		try {
			const endpoint = rtdbUrl.replace(/\/$/, '') + '/plans/' + encodeURIComponent(floor) + '/current.json';
			console.log('Loading existing data from', endpoint);
			const res = await fetch(endpoint);
			if (res.ok) {
				const data = await res.json();
				if (data && (data.rows && data.rows.length > 0 || data.title)) {
					await populateFromData(data);
					return;
				}
			} else {
				console.warn('RTDB load responded', res.status);
			}
		} catch (err) {
			console.warn('Failed to load from RTDB', err);
		}
	}

	// fallback to config: treat each config row as values list, map by position to colN
	if (config.list && config.list.length > 0) {
		// reset columns and UI to avoid accumulating previous state
		const rows = config.list.map(r => Array.isArray(r) ? r : Object.values(r || {}));
		let max = 0; rows.forEach(a => { if (a.length > max) max = a.length; });
		if (max < 1) max = 1;
		columns = [];
		for (let i = 1; i <= max; i++) columns.push('col' + i);
		const mapped = rows.map(a => {
			const o = {};
			for (let i = 0; i < columns.length; i++) o[columns[i]] = a[i] || '';
			return o;
		});
		renderColumnsUI();
		// ensure rows container is empty before appending
		if (rowsEl) rowsEl.innerHTML = '';
		mapped.forEach(it => rowsEl.appendChild(createRowItem(it)));
	}
	titleEl.value = config.title || '';
}

// initial render of tabs and initial load
renderFloorTabs();
loadInitial(currentFloor);


addRowBtn.addEventListener('click', () => {
	// create empty row with keys for each column
	const obj = {};
	columns.forEach(c => obj[c] = '');
	rowsEl.appendChild(createRowItem(obj));
});

if (!saveBtn) console.error('`saveBtn` element not found');
if (!addRowBtn) console.error('`addRow` element not found');
if (!rowsEl) console.error('`rows` element not found');

saveBtn?.addEventListener('click', async () => {
	const rows = Array.from(rowsEl.children).map(div => {
		const obj = {};
		columns.forEach(col => {
			const wrap = div.querySelector('[data-col="' + col + '"]');
			if (!wrap) { obj[col] = { text: '', size: 'normal' }; return; }
			const input = wrap.querySelector('input, textarea');
			const sizeSel = wrap.querySelector('select');
			const text = input ? input.value : '';
			const size = sizeSel ? sizeSel.value : 'normal';
			obj[col] = { text, size };
		});
		return obj;
	}).filter(r => Object.values(r).some(v => (v && v.text || '').toString().trim() !== ''));

	const data = {
		title: titleEl.value || '',
		rows
	};

	console.log('Saving data to Firestore:', data);
	const previousText = saveBtn.textContent;
	saveBtn.disabled = true;
	saveBtn.textContent = 'Đang lưu...';
	try {
		// Simplified: push JSON to Realtime Database REST endpoint, per-floor
		if (!rtdbUrl) throw new Error('Realtime DB URL not available');
		console.log('Calling RTDB PUT for floor', currentFloor);
		const endpoint = rtdbUrl.replace(/\/$/, '') + '/plans/' + encodeURIComponent(currentFloor) + '/current.json';
		const writePromise = fetch(endpoint, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		}).then(res => {
			if (!res.ok) throw new Error('RTDB response ' + res.status);
			return res.json();
		});
		const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Save timed out (15s)')), 15000));
		await Promise.race([writePromise, timeout]);
		console.log('Save successful');
		alert('Lưu thành công');
	} catch (err) {
		console.error('Save failed', err);
		alert('Lưu thất bại: ' + (err?.message || err));
	} finally {
		saveBtn.disabled = false;
		saveBtn.textContent = previousText;
	}
});
