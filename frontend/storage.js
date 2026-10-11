/* Menambahkan penyimpanan Google Drive dan daftar file ke halaman dashboard. */
(async () => {
    const BUCKET = 'shapefiles';
    const TRIAL = new URLSearchParams(location.search).get('mode') === 'trial';
    const $ = s => document.querySelector(s);
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    if (TRIAL) {
        document.documentElement.classList.remove('guard');
        const pick = $('#pick');
        pick.insertAdjacentHTML('beforebegin', '<span class="usr" title="Data yang diunggah tidak disimpan">Mode Trial · data tidak disimpan</span><button class="btn ghost" id="tlogin">Masuk / Daftar</button><button class="btn ghost" id="thome">Beranda</button>');
        $('#tlogin').onclick = () => location.href = 'login.html?next=index.html';
        $('#thome').onclick = () => location.href = '../index.html';
        return;
    }

    const { data: { session } } = await supa.auth.getSession();
    if (!session) { location.replace('../index.html'); return }
    const user = session.user;
    document.documentElement.classList.remove('guard');
    supa.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace('../index.html') });

    const iconFiles = '<svg class="i" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>';
    const iconOut = '<svg class="i" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>';
    const pick = $('#pick');
    pick.insertAdjacentHTML('beforebegin', '<button class="btn ghost" id="connect-drive">Hubungkan Google Drive</button><button class="btn ghost" id="myfiles">' + iconFiles + 'File Saya</button>');
    pick.insertAdjacentHTML('afterend', `<span class="usr" title="${esc(user.email)}">${esc(user.email)}</span><button class="icon-btn" id="logout" title="Keluar" aria-label="Keluar">${iconOut}</button>`);
    document.body.insertAdjacentHTML('beforeend', '<div class="modal" id="fmod" hidden><div class="mbox" role="dialog" aria-label="File Saya"><div class="mh"><b>File Saya · Google Drive</b><button class="btn sm ghost" id="fclose">Tutup</button></div><div class="fl" id="flist"></div></div></div>');

    const modal = $('#fmod'), list = $('#flist');
    const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 5000) };
    const size = b => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
    const date = s => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    $('#connect-drive').onclick = async () => {
        const button = $('#connect-drive');
        button.disabled = true;
        try {
            const email = await DriveStorage.connect();
            button.textContent = 'Drive: ' + email;
            toast('Google Drive terhubung. File baru akan disimpan ke Drive akun tersebut.');
        } catch (error) { toast('Gagal menghubungkan Google Drive: ' + error.message) }
        finally { button.disabled = false }
    };
    $('#logout').onclick = async () => { await supa.auth.signOut(); location.replace('../index.html') };
    $('#fclose').onclick = () => modal.hidden = true;
    modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.hidden = true });

    const orig = load;
    load = async (file, skipSave) => {
        const before = rows;
        await orig(file);
        if (skipSave || !file || rows === before) return;
        try {
            await DriveStorage.upload(new Blob([file], { type: 'application/zip' }), file.name, 'application/zip');
            toast('File shapefile tersimpan di Google Drive.');
        } catch (error) { toast('Data berhasil dibaca, tetapi gagal disimpan ke Google Drive: ' + error.message) }
    };

    async function refresh() {
        list.innerHTML = '<p class="mu">Memuat daftar file...</p>';
        try {
            const legacy = await supa.from('files').select('*').order('created_at', { ascending: false });
            if (legacy.error) throw new Error('Daftar file lama di Supabase gagal dimuat: ' + legacy.error.message);
            const oldFiles = legacy.data || [];
            let driveFiles = [], driveError = '';
            try { driveFiles = await DriveStorage.listFiles() }
            catch (error) { driveError = error.message }
            const driveRows = driveFiles.map(f => `<div class="fr"><div class="fi"><div class="fn" title="${esc(f.name)}">${esc(f.name)}</div><div class="fm2">${size(Number(f.size || 0))} · Google Drive · ${f.createdTime ? date(f.createdTime) : ''}</div></div><button class="btn sm" data-drive-open="${esc(f.id)}">Buka</button><button class="btn sm del" data-drive-delete="${esc(f.id)}">Hapus</button></div>`).join('');
            const oldRows = oldFiles.map(f => `<div class="fr"><div class="fi"><div class="fn" title="${esc(f.name)}">${esc(f.name)}</div><div class="fm2">${size(f.size)} · Penyimpanan lama</div></div><button class="btn sm" data-old-open="${esc(f.id)}">Buka</button><button class="btn sm del" data-old-delete="${esc(f.id)}">Hapus</button></div>`).join('');
            list.innerHTML = (driveError ? `<p class="mu">Google Drive belum tersedia: ${esc(driveError)} Tekan “Hubungkan Google Drive” untuk menyambungkan.</p>` : '') +
                (driveRows || oldRows ? '' : '<p class="mu">Belum ada file tersimpan. Hubungkan Drive, lalu unggah ZIP shapefile.</p>') +
                (driveRows ? '<b>Google Drive</b>' + driveRows : '') +
                (oldRows ? '<b>File tersimpan sebelumnya</b>' + oldRows : '');
            list._driveFiles = driveFiles;
            list._oldFiles = oldFiles;
        } catch (error) {
            list.innerHTML = `<p class="mu">Gagal memuat file: ${esc(error.message)}</p><p class="mu">Jika belum terhubung, tekan “Hubungkan Google Drive” terlebih dahulu.</p>`;
        }
    }

    $('#myfiles').onclick = () => { modal.hidden = false; refresh() };
    list.addEventListener('click', async e => {
        const button = e.target.closest('button');
        if (!button) return;
        const driveFile = list._driveFiles && list._driveFiles.find(f => f.id === (button.dataset.driveOpen || button.dataset.driveDelete));
        const oldFile = list._oldFiles && list._oldFiles.find(f => f.id === (button.dataset.oldOpen || button.dataset.oldDelete));
        try {
            if (button.dataset.driveOpen && driveFile) {
                modal.hidden = true;
                $('#empty').style.display = 'none'; $('#load').style.display = 'flex'; setProg('Mengunduh file...', 10);
                await load(await DriveStorage.download(driveFile), true);
            } else if (button.dataset.oldOpen && oldFile) {
                modal.hidden = true;
                $('#empty').style.display = 'none'; $('#load').style.display = 'flex'; setProg('Mengunduh file...', 10);
                const { data, error } = await supa.storage.from(BUCKET).download(oldFile.path);
                if (error) throw error;
                await load(new File([data], oldFile.name), true);
            } else if ((button.dataset.driveDelete && driveFile) || (button.dataset.oldDelete && oldFile)) {
                const file = driveFile || oldFile;
                if (!confirm(`Hapus "${file.name}" dari akun Anda?`)) return;
                button.disabled = true;
                if (driveFile) await DriveStorage.remove(driveFile.id);
                else {
                    const removed = await supa.storage.from(BUCKET).remove([oldFile.path]);
                    if (removed.error) throw removed.error;
                    const deleted = await supa.from('files').delete().eq('id', oldFile.id);
                    if (deleted.error) throw deleted.error;
                }
                await refresh();
            }
        } catch (error) {
            $('#load').style.display = 'none';
            if (!rows.length) $('#empty').style.display = 'flex';
            button.disabled = false;
            toast('Operasi file gagal: ' + error.message);
        }
    });
})();
