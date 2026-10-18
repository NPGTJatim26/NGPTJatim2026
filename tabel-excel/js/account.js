// Mode akses untuk halaman Tabel: Trial tanpa simpan atau akun dengan Google Drive.
(async () => {
  const BUCKET = 'shapefiles';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TRIAL = new URLSearchParams(location.search).get('mode') === 'trial';
  const HOME = '../index.html', LOGIN = '../frontend/login.html?next=' + encodeURIComponent('../tabel-excel/index.html');

  const css = document.createElement('style');
  css.textContent = `
  html.guard body{visibility:hidden}
  header button.hb{margin-left:0;height:36px;padding:0 14px;border-radius:8px;background:var(--card);border:1px solid var(--bd);color:var(--tx);font-size:13px}
  header button.hb:hover{background:var(--card2)}
  #theme{margin-left:0!important}
  .hsp{flex:1}
  .usr{font-size:12px;color:var(--mut);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .trial{background:#f59e0b;color:#3b2300;font-weight:700;font-size:12px;padding:4px 10px;border-radius:999px;white-space:nowrap}
  .modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:50;padding:16px}
  .modal[hidden]{display:none}
  .mbox{background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:14px;width:min(560px,100%);max-height:80vh;display:flex;flex-direction:column}
  .mh{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--bd)}
  .fl{overflow:auto;padding:8px}
  .fr{display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px}
  .fr:hover{background:var(--card2)}
  .fi{flex:1;min-width:0}.fn{font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fm2{font-size:12px;color:var(--mut)}
  button.sm{padding:6px 12px;font-size:12px}
  button.del{background:var(--bad);color:#fff}
  .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--tx);color:var(--bg);padding:10px 16px;border-radius:10px;font-size:13px;z-index:60}
  .mu{color:var(--mut);font-size:13px;padding:8px}`;
  document.head.append(css);
  const theme = $('#theme');
  const toast = text => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = text; document.body.append(d); setTimeout(() => d.remove(), 5000) };

  if (TRIAL) {
    theme.insertAdjacentHTML('beforebegin', '<span class="hsp"></span><span class="trial" title="Data yang diunggah tidak disimpan">Mode Trial · data tidak disimpan</span><button class="hb" id="tlogin">Masuk / Daftar</button><button class="hb" id="thome">Beranda</button>');
    $('#tlogin').onclick = () => location.href = LOGIN;
    $('#thome').onclick = () => location.href = HOME;
    document.documentElement.classList.remove('guard');
    return;
  }

  const { data: { session } } = await supa.auth.getSession();
  if (!session) { location.replace(HOME); return }
  const user = session.user;
  document.documentElement.classList.remove('guard');
  supa.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') location.replace(HOME) });

  theme.insertAdjacentHTML('beforebegin', `<span class="hsp"></span><button class="hb" id="connect-drive">Hubungkan Google Drive</button><button class="hb" id="myfiles">File Saya</button><span class="usr" title="${esc(user.email)}">${esc(user.email)}</span><button class="hb" id="logout">Keluar</button>`);
  document.body.insertAdjacentHTML('beforeend', '<div class="modal" id="fmod" hidden><div class="mbox" role="dialog" aria-label="File Saya"><div class="mh"><b>File Saya · Google Drive</b><button class="sm" id="fclose">Tutup</button></div><div class="fl" id="flist"></div></div></div>');
  const modal = $('#fmod'), list = $('#flist'), saveButton = document.createElement('button');
  saveButton.id = 'save-xlsx';
  saveButton.textContent = 'Simpan Excel ke Google Drive';
  saveButton.disabled = true;
  $('#dl').after(saveButton);

  const size = b => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const date = s => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  $('#connect-drive').onclick = async () => {
    const button = $('#connect-drive');
    button.disabled = true;
    try {
      const email = await DriveStorage.connect();
      button.textContent = 'Drive: ' + email;
      toast('Google Drive terhubung. File sumber dan hasil Excel dapat disimpan di Drive.');
    } catch (error) { toast('Gagal menghubungkan Google Drive: ' + error.message) }
    finally { button.disabled = false }
  };
  $('#logout').onclick = async () => { await supa.auth.signOut(); location.replace(HOME) };
  $('#fclose').onclick = () => modal.hidden = true;
  modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.hidden = true });

  const orig = load;
  load = async (file, skipSave) => {
    const before = ROWS;
    await orig(file);
    saveButton.disabled = !ROWS.length;
    if (skipSave || !file || ROWS === before || !ROWS.length) return;
    try {
      await DriveStorage.upload(new Blob([file], { type: 'application/zip' }), file.name, 'application/zip');
      toast('File shapefile tersimpan di Google Drive.');
    } catch (error) { toast('Data berhasil dibaca, tetapi gagal disimpan ke Google Drive: ' + error.message) }
  };

  saveButton.onclick = async () => {
    if (!ROWS.length) return;
    saveButton.disabled = true;
    const oldText = saveButton.textContent;
    saveButton.textContent = 'Membuat Excel...';
    try {
      const blob = await downloadXLSX(false);
      await DriveStorage.upload(blob, 'Rekap_DJPA.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      toast('Hasil Excel tersimpan di Google Drive.');
    } catch (error) { toast('Gagal menyimpan Excel ke Google Drive: ' + error.message) }
    finally { saveButton.disabled = !ROWS.length; saveButton.textContent = oldText }
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
      const driveRows = driveFiles.map(f => `<div class="fr"><div class="fi"><div class="fn" title="${esc(f.name)}">${esc(f.name)}</div><div class="fm2">${size(Number(f.size || 0))} · Google Drive · ${f.createdTime ? date(f.createdTime) : ''}</div></div><button class="sm" data-drive-open="${esc(f.id)}">Buka</button><button class="sm del" data-drive-delete="${esc(f.id)}">Hapus</button></div>`).join('');
      const oldRows = oldFiles.map(f => `<div class="fr"><div class="fi"><div class="fn" title="${esc(f.name)}">${esc(f.name)}</div><div class="fm2">${size(f.size)} · Penyimpanan lama</div></div><button class="sm" data-old-open="${esc(f.id)}">Buka</button><button class="sm del" data-old-delete="${esc(f.id)}">Hapus</button></div>`).join('');
      list.innerHTML = (driveError ? `<p class="mu">Google Drive belum tersedia: ${esc(driveError)} Tekan “Hubungkan Google Drive” untuk menyambungkan.</p>` : '') +
        (!driveRows && !oldRows ? '<p class="mu">Belum ada file tersimpan. Hubungkan Drive, lalu unggah ZIP shapefile.</p>' : '') +
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
        $('#status').textContent = 'Mengunduh ' + driveFile.name + '…';
        await load(await DriveStorage.download(driveFile), true);
      } else if (button.dataset.oldOpen && oldFile) {
        modal.hidden = true;
        $('#status').textContent = 'Mengunduh ' + oldFile.name + '…';
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
      button.disabled = false;
      toast('Operasi file gagal: ' + error.message);
    }
  });
})();
