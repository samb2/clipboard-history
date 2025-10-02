let lastClipboard;

function formatTime(date) {
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
}

async function copyToClipboard(text) {
    if (!text) return;
    if (window.clipboardAPI?.writeText) {
        await window.clipboardAPI.writeText(text);
    } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }
}

function renderList(items) {
    const out = document.getElementById('list');
    out.innerHTML = '';
    if (!items || items.length === 0) {
        document.querySelector('.empty').style.display = '';
        return;
    }
    document.querySelector('.empty').style.display = 'none';

    for (const row of items) {
        const item = document.createElement('div');
        item.className = 'item';

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `${row.type || 'Text'} · ${formatTime(new Date(row.created_at))}`;

        const content = document.createElement('div');
        content.className = 'content';
        content.textContent = row.content;

        item.appendChild(meta);
        item.appendChild(content);
        out.appendChild(item);
    }
}

async function loadHistory(q = null) {
    const items = await window.historyAPI.list(100, q);
    renderList(items);
}

window.addEventListener('DOMContentLoaded', () => {
    const out = document.getElementById('list');
    const search = document.getElementById('q');
    const clearBtn = document.getElementById('clear');

    // Click to copy from history
    out.addEventListener('click', async (e) => {
        const item = e.target.closest('.item');
        if (!item) return;
        const text = item.querySelector('.content')?.textContent?.trim();
        if (!text) return;
        await copyToClipboard(text);
        item.classList.add('copied');
        setTimeout(() => item.classList.remove('copied'), 1000);
    });

    // Search
    search?.addEventListener('input', () => {
        const q = search.value.trim();
        loadHistory(q || null);
    });

    // Clear DB
    clearBtn?.addEventListener('click', async () => {
        await window.historyAPI.clear();
        loadHistory();
    });

    // Initial load
    loadHistory();

    // Called when your app wants to refresh (optional)
    window.clipboardAPI.onRefresh?.(() => updateFromClipboard());

    async function updateFromClipboard() {
        const text = await window.clipboardAPI.readText() || undefined;
        if (text && text !== lastClipboard) {
            lastClipboard = text;
            await window.historyAPI.add(text, 'text');
            await loadHistory(); // refresh the visible list
        }
    }

    // If you want periodic polling, uncomment:
    setInterval(updateFromClipboard, 1000);
});