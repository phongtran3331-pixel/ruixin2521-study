/**
 * 睿信2521学习交流站 - 主逻辑
 */

let _allCompetitions = [];
let _classFilesData = [];
let _currentPath = '';

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    loadCompetitions();
    loadClassFiles();
    loadNotices();
});

function initNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        if (link.classList.contains('disabled')) return;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.section;
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            sections.forEach(sec => sec.classList.remove('active'));
            const targetSection = document.getElementById(target);
            if (targetSection) targetSection.classList.add('active');
        });
    });
}

// ==================== 竞赛信息 ====================
async function loadCompetitions() {
    try {
        const response = await fetch('data/competitions.txt');
        if (!response.ok) throw new Error('未找到数据文件');
        const text = await response.text();
        _allCompetitions = parseCompetitions(text);
        renderCompetitions(_allCompetitions);
        initCommentSystem();
        initCompetitionFilters();
    } catch (err) {
        console.log('竞赛信息加载失败:', err);
        document.getElementById('competitionEmpty').style.display = 'block';
        document.getElementById('competitionTable').style.display = 'none';
    }
}

function parseCompetitions(text) {
    const blocks = text.split(/---+/).map(b => b.trim()).filter(Boolean);
    const results = [];
    for (let idx = 0; idx < blocks.length; idx++) {
        const block = blocks[idx];
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const item = {};
        for (const line of lines) {
            const match = line.match(/^(.+?)[:：]\s*(.+)$/);
            if (match) item[match[1].trim()] = match[2].trim();
        }
        if (item['竞赛名称']) {
            const evalStr = item['评价'] || '';
            const evalMap = {};
            evalStr.split(/[,，]/).forEach(part => {
                const m = part.match(/^(.+?)\s*[=：:]\s*(.+)$/);
                if (m) evalMap[m[1].trim()] = m[2].trim();
            });
            item._eval = evalMap;
            item._id = 'comp_' + hashCode(item['竞赛名称']);
            results.push(item);
        }
    }
    return results;
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
}

function renderCompetitions(list) {
    const tbody = document.getElementById('competitionBody');
    if (!list.length) {
        document.getElementById('competitionEmpty').style.display = 'block';
        document.getElementById('competitionTable').style.display = 'none';
        return;
    }
    document.getElementById('competitionEmpty').style.display = 'none';
    document.getElementById('competitionTable').style.display = '';

    const today = new Date(); today.setHours(0, 0, 0, 0);

    tbody.innerHTML = list.map(item => {
        const evalMap = item._eval || {};
        const diff = evalMap['难易程度'] || '-';
        const impo = evalMap['重要性'] || '-';
        const level = evalMap['等级'] || '-';
        const ratio = evalMap['性价比'] || '-';

        const diffClass = diff === '低' ? 'tag-easy' : diff === '高' ? 'tag-hard' : 'tag-medium';
        const impoClass = impo === '高' ? 'tag-high' : impo === '低' ? 'tag-low' : 'tag-medium';
        const ratioClass = ratio === '高' ? 'tag-high' : ratio === '低' ? 'tag-low' : 'tag-medium';
        const levelClass = level === '院级' ? 'tag-dept' : level === '校级' ? 'tag-school' : level === '省部级' ? 'tag-province' : level === '国家级' ? 'tag-national' : level === '国际级' ? 'tag-intl' : 'tag-medium';

        const regDate = item['报名截止时间'] ? new Date(item['报名截止时间']) : null;
        const daysLeft = regDate ? Math.ceil((regDate - today) / 86400000) : null;
        const dateClass = (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) ? 'date-soon' : 'date-normal';
        const dateHint = (daysLeft !== null && daysLeft >= 0 && daysLeft <= 7) ? ` (剩${daysLeft}天)` : '';

        const link = item['官网链接'] || '#';
        const compId = item._id;

        return `
            <tr data-id="${compId}" data-diff="${diff}" data-impo="${impo}" data-level="${level}" data-ratio="${ratio}">
                <td><span class="comp-name">${escapeHtml(item['竞赛名称'])}</span></td>
                <td class="${dateClass}">${escapeHtml(item['报名截止时间'] || '-')}${dateHint}</td>
                <td>${escapeHtml(item['比赛时间'] || '-')}</td>
                <td>${escapeHtml(item['竞赛种类'] || '-')}</td>
                <td><span class="tag ${diffClass}">${diff}</span></td>
                <td><span class="tag ${impoClass}">${impo}</span></td>
                <td><span class="tag ${levelClass}">${level}</span></td>
                <td><span class="tag ${ratioClass}">${ratio}</span></td>
                <td><a href="${escapeHtml(link)}" target="_blank" class="link-btn">官网 ↗</a></td>
                <td><button class="comment-toggle" data-comment="${compId}">💬 讨论</button></td>
            </tr>
        `;
    }).join('');
}

function initCompetitionFilters() {
    const checkboxes = document.querySelectorAll('#competitionFilter input[type="checkbox"]');
    const clearBtn = document.getElementById('clearFilter');
    checkboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    clearBtn.addEventListener('click', () => { checkboxes.forEach(cb => cb.checked = false); applyFilters(); });
}

function applyFilters() {
    const checked = document.querySelectorAll('#competitionFilter input[type="checkbox"]:checked');
    const rows = document.querySelectorAll('#competitionBody tr');
    const filters = { diff: [], impo: [], level: [], ratio: [] };
    checked.forEach(cb => { const t = cb.dataset.filter; if (filters[t]) filters[t].push(cb.value); });
    const hasFilter = Object.values(filters).some(a => a.length > 0);

    rows.forEach(row => {
        if (!hasFilter) { row.classList.remove('hidden'); return; }
        const match = (type) => filters[type].length === 0 || filters[type].includes(row.dataset[type]);
        if (match('diff') && match('impo') && match('level') && match('ratio')) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

// ==================== 评论区 ====================
function initCommentSystem() {
    const container = document.getElementById('commentSections');
    if (!container) return;

    container.innerHTML = _allCompetitions.map(item => {
        const compId = item._id;
        return `
            <div class="comment-section" id="comment-${compId}">
                <div class="comment-header">
                    <span>💬 ${escapeHtml(item['竞赛名称'])} - 讨论区</span>
                    <button class="comment-close" data-close="${compId}">&times;</button>
                </div>
                <div class="comment-body">
                    <div class="comment-list" id="commentList-${compId}">
                        <div class="comment-empty">暂无评论，快来发表第一条吧！</div>
                    </div>
                    <div class="comment-form">
                        <div class="comment-form-row">
                            <input type="text" class="comment-input" id="commentName-${compId}" placeholder="你的昵称" maxlength="20">
                        </div>
                        <textarea class="comment-textarea" id="commentText-${compId}" placeholder="发表你的看法..." maxlength="500"></textarea>
                        <button class="comment-submit" data-submit="${compId}">发表评论</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    _allCompetitions.forEach(item => renderComments(item._id));

    document.querySelectorAll('.comment-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const compId = e.target.dataset.comment;
            const section = document.getElementById(`comment-${compId}`);
            document.querySelectorAll('.comment-section.open').forEach(sec => {
                if (sec.id !== `comment-${compId}`) {
                    sec.classList.remove('open');
                    const b = document.querySelector(`.comment-toggle[data-comment="${sec.id.replace('comment-', '')}"]`);
                    if (b) b.classList.remove('active');
                }
            });
            section.classList.toggle('open');
            e.target.classList.toggle('active');
            if (section.classList.contains('open')) {
                setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            }
        });
    });

    document.querySelectorAll('.comment-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const compId = e.target.dataset.close;
            document.getElementById(`comment-${compId}`).classList.remove('open');
            const b = document.querySelector(`.comment-toggle[data-comment="${compId}"]`);
            if (b) b.classList.remove('active');
        });
    });

    document.querySelectorAll('.comment-submit').forEach(btn => {
        btn.addEventListener('click', (e) => submitComment(e.target.dataset.submit));
    });

    document.querySelectorAll('.comment-textarea').forEach(ta => {
        ta.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') submitComment(ta.id.replace('commentText-', ''));
        });
    });
}

function getComments(compId) {
    try { const d = localStorage.getItem('rx2521_comments_' + compId); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
}
function saveComments(compId, comments) {
    try { localStorage.setItem('rx2521_comments_' + compId, JSON.stringify(comments)); }
    catch (e) { console.warn('评论保存失败:', e); }
}
function submitComment(compId) {
    const name = (document.getElementById(`commentName-${compId}`)?.value || '匿名').trim();
    const text = (document.getElementById(`commentText-${compId}`)?.value || '').trim();
    if (!text) { alert('请输入评论内容'); return; }
    const comments = getComments(compId);
    comments.push({ name, text, time: new Date().toLocaleString('zh-CN') });
    saveComments(compId, comments);
    renderComments(compId);
    document.getElementById(`commentText-${compId}`).value = '';
}
function renderComments(compId) {
    const container = document.getElementById(`commentList-${compId}`);
    const comments = getComments(compId);
    if (!comments.length) { container.innerHTML = '<div class="comment-empty">暂无评论，快来发表第一条吧！</div>'; return; }
    container.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-meta">
                <span class="comment-author">${escapeHtml(c.name)}</span>
                <span class="comment-time">${escapeHtml(c.time)}</span>
            </div>
            <div class="comment-text">${escapeHtml(c.text)}</div>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

// ==================== 班级文件（树状浏览） ====================
async function loadClassFiles() {
    try {
        const response = await fetch('data/class_files_index.json');
        if (!response.ok) throw new Error('未找到索引');
        _classFilesData = await response.json();
        _currentPath = '';
        renderClassFiles();
    } catch (err) {
        console.log('班级文件加载失败:', err);
        document.getElementById('classfilesEmpty').style.display = 'block';
    }
}

function renderClassFiles() {
    const folderGrid = document.getElementById('folderGrid');
    const fileList = document.getElementById('fileList');
    const breadcrumb = document.getElementById('classfilesBreadcrumb');
    const backBtn = document.getElementById('backBtn');
    const emptyTip = document.getElementById('classfilesEmpty');

    // 获取当前路径下的直接子项
    const children = getChildren(_currentPath);
    const folders = children.filter(x => x.type === 'folder');
    const files = children.filter(x => x.type === 'file');

    if (!folders.length && !files.length) {
        emptyTip.style.display = 'block';
        folderGrid.style.display = 'none';
        fileList.style.display = 'none';
    } else {
        emptyTip.style.display = 'none';
    }

    // 面包屑
    const parts = _currentPath ? _currentPath.split('/') : [];
    let bcHtml = '<span class="breadcrumb-item" data-path="">📁 根目录</span>';
    let accum = '';
    for (let i = 0; i < parts.length; i++) {
        accum = accum ? accum + '/' + parts[i] : parts[i];
        bcHtml += '<span class="breadcrumb-sep">/</span>';
        bcHtml += `<span class="breadcrumb-item" data-path="${escapeHtml(accum)}">${escapeHtml(parts[i])}</span>`;
    }
    breadcrumb.innerHTML = bcHtml;
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.path));
    });

    // 返回按钮
    backBtn.style.display = _currentPath ? 'inline-block' : 'none';
    backBtn.onclick = () => {
        const parts = _currentPath.split('/');
        parts.pop();
        navigateTo(parts.join('/'));
    };

    // 文件夹卡片
    if (folders.length) {
        folderGrid.style.display = 'grid';
        folderGrid.innerHTML = folders.map(f => {
            const childCount = getChildren(f.path).length;
            const folderName = f.path.split('/').pop();
            return `
                <div class="folder-card" data-path="${escapeHtml(f.path)}">
                    <div class="folder-icon">📁</div>
                    <div class="folder-name">${escapeHtml(folderName)}</div>
                    <div class="folder-count">${childCount} 项</div>
                </div>
            `;
        }).join('');
        folderGrid.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', () => navigateTo(card.dataset.path));
        });
    } else {
        folderGrid.style.display = 'none';
        folderGrid.innerHTML = '';
    }

    // 文件列表
    if (files.length) {
        fileList.style.display = 'flex';
        const iconMap = { '.pdf': '📄', '.docx': '📝', '.doc': '📝', '.pptx': '📊', '.ppt': '📊', '.xlsx': '📈', '.xls': '📈', '.zip': '📦', '.rar': '📦', '.7z': '📦', '.txt': '📃', '.md': '📃' };
        fileList.innerHTML = files.map(f => {
            const ext = f.path.slice(f.path.lastIndexOf('.')).toLowerCase();
            const icon = iconMap[ext] || '📄';
            const size = formatSize(f.size || 0);
            const fileName = f.path.split('/').pop();
            const filePath = 'class_files/' + f.path;
            return `
                <div class="file-row">
                    <div class="file-row-icon">${icon}</div>
                    <div class="file-row-info">
                        <div class="file-row-name">${escapeHtml(fileName)}</div>
                        <div class="file-row-meta">${ext.toUpperCase().replace('.', '')} · ${size}</div>
                    </div>
                    <div class="file-row-actions">
                        <a href="${filePath}" target="_blank" class="file-row-btn view">打开</a>
                        <a href="${filePath}" download class="file-row-btn dl">下载</a>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        fileList.style.display = 'none';
        fileList.innerHTML = '';
    }
}

function getChildren(path) {
    return _classFilesData.filter(item => {
        const itemPath = item.path;
        if (path === '') {
            // 根目录：没有斜杠的一级项
            return !itemPath.includes('/');
        }
        // 非根目录：路径以当前路径开头，且去掉当前路径后只剩一层
        if (!itemPath.startsWith(path + '/')) return false;
        const remainder = itemPath.slice(path.length + 1);
        return remainder && !remainder.includes('/');
    });
}

function navigateTo(path) {
    _currentPath = path;
    renderClassFiles();
}

// ==================== 通知（新体系） ====================
async function loadNotices() {
    try {
        const response = await fetch('data/notices_index.json');
        if (!response.ok) throw new Error('未找到索引');
        const notices = await response.json();
        renderNotices(notices);
    } catch (err) {
        console.log('通知加载失败:', err);
        document.getElementById('noticeEmpty').style.display = 'block';
    }
}

function renderNotices(list) {
    const container = document.getElementById('noticeList');
    if (!list || !list.length) {
        document.getElementById('noticeEmpty').style.display = 'block';
        return;
    }

    container.innerHTML = list.map(item => {
        const isUrgent = item.urgent;
        const urgentBadge = isUrgent ? '<span class="notice-urgent-badge">紧急</span>' : '';
        const cardClass = isUrgent ? 'notice-card urgent' : 'notice-card';

        let attachHtml = '';
        if (item.attachments && item.attachments.length) {
            attachHtml = `
                <div class="notice-attachments">
                    <span class="notice-attach-label">📎 附件</span>
                    ${item.attachments.map(a => {
                        const aPath = `notices/${item.folder}/${encodeURIComponent(a)}`;
                        return `<a href="${aPath}" download class="notice-attach-item">${escapeHtml(a)}</a>`;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div class="${cardClass}">
                <div class="notice-header">
                    <span class="notice-title">${escapeHtml(item.title)}${urgentBadge}</span>
                    <span class="notice-time">${escapeHtml(item.time || '')}</span>
                </div>
                <div class="notice-content">${escapeHtml(item.content || '')}</div>
                ${attachHtml}
            </div>
        `;
    }).join('');
}

// ==================== 工具函数 ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
