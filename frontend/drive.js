/* Google Drive access for the signed-in application user. Access tokens stay in memory. */
(() => {
    const SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
    const FOLDER_NAME = 'Analisis Penggunaan Tanah';
    const FOLDER_MIME = 'application/vnd.google-apps.folder';
    const CHUNK_SIZE = 8 * 1024 * 1024;
    let tokenClient, pendingToken, token = '', expiresAt = 0, connectedEmail = '', folderId = '';

    function apiError(response, message) {
        return response.text().then(text => {
            let detail = text;
            try { detail = JSON.parse(text).error.message || text } catch (e) { }
            return new Error(`${message} (${response.status}): ${detail || response.statusText}`);
        });
    }

    function requestToken(prompt) {
        if (pendingToken) return pendingToken;
        if (!GOOGLE_DRIVE_CLIENT_ID) return Promise.reject(new Error('Google Drive belum dikonfigurasi. Pemilik aplikasi perlu mengisi OAuth Client ID.'));
        if (!window.google || !google.accounts || !google.accounts.oauth2) return Promise.reject(new Error('Layanan login Google belum termuat. Muat ulang halaman dan coba lagi.'));

        pendingToken = new Promise((resolve, reject) => {
            tokenClient = tokenClient || google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_DRIVE_CLIENT_ID,
                scope: SCOPE,
                callback: response => {
                    if (response.error || !response.access_token) {
                        reject(new Error(response.error_description || response.error || 'Google tidak memberikan izin akses Drive.'));
                        return;
                    }
                    token = response.access_token;
                    expiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
                    resolve(token);
                },
                error_callback: error => reject(new Error(error.message || 'Jendela izin Google gagal dibuka. Izinkan pop-up lalu coba lagi.'))
            });
            try { tokenClient.requestAccessToken({ prompt: prompt || '' }) } catch (error) { reject(error) }
        }).finally(() => { pendingToken = null });
        return pendingToken;
    }

    async function accessToken() {
        if (token && Date.now() < expiresAt - 60_000) return token;
        try { return await requestToken('') }
        catch (error) {
            throw new Error('Sesi Google Drive berakhir. Tekan “Hubungkan Google Drive” untuk menyambungkan kembali. ' + error.message);
        }
    }

    async function connect() {
        token = '';
        expiresAt = 0;
        folderId = '';
        const access = await requestToken('consent');
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access}` }
        });
        if (!response.ok) throw await apiError(response, 'Gagal membaca akun Google');
        const profile = await response.json();
        if (!profile.email) throw new Error('Google tidak mengembalikan alamat email akun.');
        connectedEmail = profile.email;
        return connectedEmail;
    }

    async function driveRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: { ...(options.headers || {}), Authorization: `Bearer ${await accessToken()}` }
        });
        if (!response.ok) throw await apiError(response, 'Permintaan Google Drive gagal');
        return response;
    }

    async function getFolder() {
        if (folderId) return folderId;
        const query = new URLSearchParams({
            q: `name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id,name)',
            pageSize: '100'
        });
        const response = await driveRequest(`https://www.googleapis.com/drive/v3/files?${query}`);
        const result = await response.json();
        if (result.files && result.files.length) {
            folderId = result.files[0].id;
            return folderId;
        }
        const created = await driveRequest('https://www.googleapis.com/drive/v3/files?fields=id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME })
        });
        folderId = (await created.json()).id;
        return folderId;
    }

    async function listFiles() {
        const parent = await getFolder();
        const files = [];
        let pageToken = '';
        do {
            const query = new URLSearchParams({
                q: `'${parent}' in parents and trashed=false`,
                spaces: 'drive',
                fields: 'nextPageToken,files(id,name,size,createdTime,mimeType)',
                orderBy: 'createdTime desc',
                pageSize: '100'
            });
            if (pageToken) query.set('pageToken', pageToken);
            const response = await driveRequest(`https://www.googleapis.com/drive/v3/files?${query}`);
            const result = await response.json();
            files.push(...(result.files || []));
            pageToken = result.nextPageToken || '';
        } while (pageToken);
        return files;
    }

    async function upload(file, name = file.name, mimeType = file.type || 'application/octet-stream') {
        const parent = await getFolder();
        const response = await driveRequest('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,createdTime,mimeType', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': mimeType,
                'X-Upload-Content-Length': String(file.size)
            },
            body: JSON.stringify({ name, mimeType, parents: [parent] })
        });
        const uploadUrl = response.headers.get('Location');
        if (!uploadUrl) throw new Error('Google Drive tidak mengembalikan alamat unggah resumable.');

        let offset = 0;
        let retries = 0;
        const resume = async () => {
            const check = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${await accessToken()}`,
                    'Content-Range': `bytes */${file.size}`
                }
            });
            if (check.status === 308) {
                const range = check.headers.get('Range');
                const received = range && range.match(/bytes=0-(\d+)/i);
                return { offset: received ? Number(received[1]) + 1 : offset };
            }
            if (check.ok) return { result: await check.json() };
            throw await apiError(check, 'Gagal melanjutkan unggahan ke Google Drive');
        };
        while (offset < file.size) {
            const end = Math.min(offset + CHUNK_SIZE, file.size);
            const chunk = file.slice(offset, end);
            let part;
            try {
                part = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${await accessToken()}`,
                        'Content-Range': `bytes ${offset}-${end - 1}/${file.size}`
                    },
                    body: chunk
                });
            } catch (error) {
                if (++retries > 4) throw new Error('Unggahan terputus dan tidak dapat dilanjutkan: ' + error.message);
                await new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** retries, 8000)));
                const state = await resume();
                if (state.result) return state.result;
                if (state.offset > offset) { offset = state.offset; retries = 0 }
                continue;
            }
            if (part.status === 308) {
                offset = end;
                retries = 0;
                continue;
            }
            if (part.ok) return part.json();
            if (part.status >= 500 && ++retries <= 4) {
                await new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** retries, 8000)));
                const state = await resume();
                if (state.result) return state.result;
                if (state.offset > offset) { offset = state.offset; retries = 0 }
                continue;
            }
            throw await apiError(part, 'Gagal mengunggah bagian file ke Google Drive');
        }
        throw new Error('Unggahan selesai tanpa konfirmasi dari Google Drive.');
    }

    async function download(file) {
        const response = await driveRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`);
        return new File([await response.blob()], file.name, { type: file.mimeType || 'application/zip' });
    }

    async function remove(fileId) {
        await driveRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' });
    }

    window.DriveStorage = { connect, listFiles, upload, download, remove, getEmail: () => connectedEmail };
})();
