import config from "../data/data.js";
import { db, rtdbUrl } from "./firebase.js";

const titleEl = document.getElementById('title');
const rowsEl = document.getElementById('rows');
const addRowBtn = document.getElementById('addRow');
const saveBtn = document.getElementById('saveBtn');

// Initialize UI from config
if (titleEl) titleEl.value = config.title || '';

function createRowItem(item = { role: '', content: '' }) {
	const wrapper = document.createElement('div');
	wrapper.className = 'admin-row';
	wrapper.style = 'margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:8px';

	const roleLabel = document.createElement('input');
	roleLabel.value = item.role || '';
	roleLabel.placeholder = 'Vai trò';
	roleLabel.style = 'width:40%; margin-right:8px';

	const contentInput = document.createElement('textarea');
	contentInput.value = item.content || '';
	contentInput.placeholder = 'Nội dung';
	contentInput.style = 'width:50%; margin-right:8px; min-height:48px; padding:8px; border-radius:6px; overflow:hidden; resize:none';

	// auto-resize helper
	function autoResize(el) {
		el.style.height = 'auto';
		el.style.height = (el.scrollHeight) + 'px';
	}

	contentInput.addEventListener('input', (e) => autoResize(e.target));


	const delBtn = document.createElement('button');
	delBtn.textContent = 'Xóa';
	delBtn.onclick = () => wrapper.remove();

	wrapper.appendChild(roleLabel);
	wrapper.appendChild(contentInput);
	wrapper.appendChild(delBtn);

	// ensure textarea height matches initial content after it's inserted
	setTimeout(() => autoResize(contentInput), 0);

	return wrapper;
}

async function populateFromData(obj) {
	// clear existing
	rowsEl.innerHTML = '';
	titleEl.value = obj.title || '';
	(obj.rows || []).forEach(it => rowsEl.appendChild(createRowItem(it)));
}

// Try to load existing data from Realtime DB; fall back to config
async function loadInitial() {
	if (rtdbUrl) {
		try {
			const endpoint = rtdbUrl.replace(/\/$/, '') + '/plans/current.json';
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

	// fallback to config
	(config.list || []).forEach(it => rowsEl.appendChild(createRowItem(it)));
	titleEl.value = config.title || '';
}

loadInitial();


addRowBtn.addEventListener('click', () => {
    rowsEl.appendChild(createRowItem({ role: '', content: '' }));
});

if (!saveBtn) console.error('`saveBtn` element not found');
if (!addRowBtn) console.error('`addRow` element not found');
if (!rowsEl) console.error('`rows` element not found');

saveBtn?.addEventListener('click', async () => {
	const rows = Array.from(rowsEl.children).map(div => {
		const role = div.querySelector('input')?.value || '';
		// prefer textarea for multi-line content, fall back to second input if present
		const content = div.querySelector('textarea')?.value || (div.querySelectorAll('input')[1]?.value) || '';
		return { role, content };
	}).filter(r => r.role.trim() !== '');

	const data = {
		title: titleEl.value || '',
		rows
	};

	console.log('Saving data to Firestore:', data);
	const previousText = saveBtn.textContent;
	saveBtn.disabled = true;
	saveBtn.textContent = 'Đang lưu...';
	try {
		// Simplified: push JSON to Realtime Database REST endpoint
		if (!rtdbUrl) throw new Error('Realtime DB URL not available');
		console.log('Calling RTDB PUT...');
		const endpoint = rtdbUrl.replace(/\/$/, '') + '/plans/current.json';
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
