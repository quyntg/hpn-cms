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
    const planRef = ref(rtdb, 'plans/current');
    onValue(planRef, (snapshot) => {
        const data = snapshot.val();
        if (!data || !data.rows || data.rows.length === 0) {
            titleEl.innerText = data?.title || '';
            tableEl.innerHTML = '<div class="no-data">Chưa có dữ liệu</div>';
            return;
        }

        titleEl.innerText = data.title || '';
        tableEl.innerHTML = data.rows.map(r => `
            <div class="row">
                <div class="role">${r.role}</div>
                <div class="content">${r.content}</div>
            </div>
        `).join('');
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