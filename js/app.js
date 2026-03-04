import { rtdb } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const titleEl = document.getElementById('title');
const tableEl = document.getElementById('table');
const fsBtn = document.getElementById('fullscreenBtn');

function updateFsButton() {
    if (!fsBtn) return;
    const enterSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 9V3h6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 15v6h-6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3l-6 6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 21l6-6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    const exitSvg = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M9 3H3v6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 21h6v-6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 9l-6-6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 15l6 6" stroke="#002b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    if (document.fullscreenElement) {
        fsBtn.innerHTML = exitSvg;
        fsBtn.setAttribute('aria-label', 'Thoát toàn màn');
    } else {
        fsBtn.innerHTML = enterSvg;
        fsBtn.setAttribute('aria-label', 'Toàn màn');
    }
}

document.addEventListener('fullscreenchange', updateFsButton);
document.addEventListener('webkitfullscreenchange', updateFsButton);

if (!rtdb) console.error('Realtime DB not initialized');

// Real-time listener: update UI only when data changes
try {
    function getFloorFromPath() {
        const p = (location.pathname || '').replace(/\/$/, '');
        const seg = p.split('/')[1] || '';
        if (seg && /^tang\d+$/.test(seg)) return seg;
        return 'current';
    }
    const floor = getFloorFromPath();
    const planRef = ref(rtdb, 'plans/' + floor + '/current');
    onValue(planRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || !data.rows || data.rows.length === 0) {
            titleEl.innerText = data?.title || '';
            tableEl.innerHTML = '<div class="no-data">Chưa có dữ liệu</div>';
            return;
        }

        titleEl.innerText = data.title || '';
        // determine column order (col1, col2, ...). fallback to object keys order
        const first = data.rows[0] || {};
        let cols = Object.keys(first).filter(k => /^col\d+$/.test(k));
        if (cols.length === 0) cols = Object.keys(first);
        cols.sort((a,b) => {
            const na = parseInt(a.replace(/[^0-9]/g,'')) || 0;
            const nb = parseInt(b.replace(/[^0-9]/g,'')) || 0;
            return na - nb;
        });

        tableEl.innerHTML = '';
        const frag = document.createDocumentFragment();
        data.rows.forEach(r => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            cols.forEach((c, idx) => {
                const cell = document.createElement('div');
                // ensure col1 is treated as role, other cols as content
                if (c === 'col1') cell.className = 'role';
                else cell.className = 'content';

                const raw = r ? r[c] : undefined;
                let text = '';
                let size = 'normal';
                if (raw && typeof raw === 'object') {
                    text = raw.text || '';
                    size = raw.size || 'normal';
                } else {
                    text = raw || '';
                }
                cell.textContent = text;
                // apply font size mapping
                if (size === 'small') cell.style.fontSize = '14px';
                else if (size === 'large') cell.style.fontSize = '26px';
                else cell.style.fontSize = '18px';
                rowDiv.appendChild(cell);
            });
            frag.appendChild(rowDiv);
        });
        tableEl.appendChild(frag);
    }, (err) => {
        console.error('RTDB onValue error', err);
        titleEl.innerText = '';
        tableEl.innerHTML = '<div class="no-data">Chưa có dữ liệu</div>';
    });
} catch (err) {
    console.error('Failed to attach RTDB listener', err);
}

// Fullscreen toggle
if (fsBtn) {
    fsBtn.addEventListener('click', () => {
        const container = document.querySelector('.container') || document.documentElement;
        if (!document.fullscreenElement) {
            (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen)?.call(container).catch(err => console.error('FS enter failed', err));
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen)?.call(document).catch(err => console.error('FS exit failed', err));
        }
    });
    updateFsButton();
}