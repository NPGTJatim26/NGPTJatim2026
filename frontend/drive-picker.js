(() => {
  const css = document.createElement('style');
  css.textContent = `
  .drive-picker-button{width:auto;margin:0;border:1px solid var(--bd,#cbd5e1);background:var(--surface,var(--card,#fff));color:var(--tx,#17251c);border-radius:9px;padding:8px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
  .drive-picker-button:hover{border-color:var(--ac,var(--acc,#477d2c))}
  .drive-picker-modal{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.58);display:grid;place-items:center;padding:16px}
  .drive-picker-modal[hidden]{display:none}
  .drive-picker-box{width:min(580px,100%);max-height:min(75vh,680px);display:flex;flex-direction:column;background:var(--surface,var(--card,#fff));color:var(--tx,#17251c);border:1px solid var(--bd,#cbd5e1);border-radius:14px;box-shadow:0 20px 70px rgba(0,0,0,.25)}
  .drive-picker-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd,#cbd5e1)}
  .drive-picker-head strong{flex:1}
  .drive-picker-list{overflow:auto;padding:10px}
  .drive-picker-row{display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px}
  .drive-picker-row:hover{background:var(--surface-2,var(--card2,#f0f5e9))}
  .drive-picker-name{flex:1;min-width:0;overflow-wrap:anywhere;font-size:13px}
  .drive-picker-meta,.drive-picker-status{color:var(--mu,#647568);font-size:12px}
  .drive-picker-status{padding:8px 12px}
  .drive-picker-modal button{border:1px solid var(--bd,#cbd5e1);border-radius:8px;background:var(--surface,var(--card,#fff));color:var(--tx,#17251c);padding:7px 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
  .drive-picker-modal button:hover:not(:disabled){border-color:var(--ac,var(--acc,#477d2c));background:var(--surface-2,var(--card2,#f0f5e9))}
  .drive-picker-modal button:disabled{opacity:.5;cursor:not-allowed}
  `;
  document.head.append(css);

  function mount(container, { accept, onSelect, buttonText = 'Ambil dari Drive' }) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'drive-picker-button';
    trigger.textContent = buttonText;
    trigger.addEventListener('click', event => event.stopPropagation());
    container.append(trigger);

    const modal = document.createElement('div');
    modal.className = 'drive-picker-modal';
    modal.hidden = true;
    modal.innerHTML = '<section class="drive-picker-box" role="dialog" aria-modal="true" aria-label="Pilih file dari Google Drive"><header class="drive-picker-head"><strong>File Google Drive</strong><button type="button" data-close>Tutup</button><button type="button" data-connect>Hubungkan Drive</button></header><div class="drive-picker-list"></div><div class="drive-picker-status" role="status" aria-live="polite"></div></section>';
    document.body.append(modal);
    const list = modal.querySelector('.drive-picker-list');
    const status = modal.querySelector('.drive-picker-status');

    const showFiles = async () => {
      list.replaceChildren();
      status.textContent = 'Memuat daftar file...';
      try {
        const files = (await DriveStorage.listFiles()).filter(file => accept(file));
        if (!files.length) {
          status.textContent = 'Tidak ada file yang sesuai di folder Google Drive aplikasi.';
          return;
        }
        status.textContent = '';
        for (const file of files) {
          const row = document.createElement('div');
          row.className = 'drive-picker-row';
          const name = document.createElement('span');
          name.className = 'drive-picker-name';
          name.textContent = file.name;
          const meta = document.createElement('span');
          meta.className = 'drive-picker-meta';
          meta.textContent = file.createdTime ? new Date(file.createdTime).toLocaleDateString('id-ID') : '';
          const open = document.createElement('button');
          open.type = 'button';
          open.textContent = 'Buka';
          open.onclick = async () => {
            open.disabled = true;
            status.textContent = 'Mengunduh ' + file.name + '...';
            try {
              await onSelect(await DriveStorage.download(file));
              modal.hidden = true;
            } catch (error) {
              status.textContent = 'Gagal membuka file: ' + (error.message || String(error));
            } finally {
              open.disabled = false;
            }
          };
          row.append(name, meta, open);
          list.append(row);
        }
      } catch (error) {
        status.textContent = 'Gagal memuat file: ' + (error.message || String(error)) + ' Jika Drive belum terhubung, pilih “Hubungkan Drive”.';
      }
    };

    trigger.onclick = () => { modal.hidden = false; showFiles() };
    modal.querySelector('[data-close]').onclick = () => { modal.hidden = true };
    modal.querySelector('[data-connect]').onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true;
      status.textContent = 'Menghubungkan Google Drive...';
      try {
        await DriveStorage.connect();
        await showFiles();
      } catch (error) {
        status.textContent = 'Gagal menghubungkan Google Drive: ' + (error.message || String(error));
      } finally {
        button.disabled = false;
      }
    };
    modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') modal.hidden = true });
    return trigger;
  }

  window.DrivePicker = { mount };
})();
