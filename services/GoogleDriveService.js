/**
 * GoogleDriveService - Handles Google Drive backup and restore
 * Uses Chrome Identity API for OAuth authentication
 */

class GoogleDriveService {
    constructor() {
        this.BACKUP_FILENAME = 'promptkeeper_backup.json';
    }

    /**
     * Authenticate with Google using Chrome Identity API
     * @returns {Promise<string>} OAuth access token
     */
    async authenticate() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError) {
                    console.error('[GoogleDrive] Auth error:', chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (!token) {
                    reject(new Error('No token received'));
                } else {
                    console.log('[GoogleDrive] Authentication successful');
                    resolve(token);
                }
            });
        });
    }

    /**
     * Get user profile information
     * @param {string} token - OAuth token
     * @returns {Promise<{email: string, name: string}>}
     */
    async getUserInfo(token) {
        try {
            const response = await fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) {
                console.warn('[GoogleDrive] Userinfo failed, trying Drive About API');
                // Fallback: Get email from Drive API
                const driveResponse = await fetch(
                    'https://www.googleapis.com/drive/v3/about?fields=user',
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const driveData = await driveResponse.json();
                return {
                    email: driveData.user?.emailAddress || 'User',
                    name: driveData.user?.displayName || 'User'
                };
            }

            return response.json();
        } catch (err) {
            // If all fails, return generic info
            console.error('[GoogleDrive] Failed to get user info:', err);
            return { email: 'Signed In', name: 'User' };
        }
    }

    /**
     * Find backup file in Google Drive
     * @param {string} token - OAuth token
     * @returns {Promise<string|null>} File ID or null if not found
     */
    async findBackupFile(token) {
        const query = encodeURIComponent(`name='${this.BACKUP_FILENAME}'`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name,modifiedTime)`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Failed to search files: ${response.statusText}`);
        }

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0].id : null;
    }

    /**
     * Upload prompts to Google Drive (create or update)
     * @param {Array} prompts - Array of prompt objects
     * @param {Array} projects - Array of project objects
     * @returns {Promise<{fileId: string, timestamp: string}>}
     */
    async backupToDrive(prompts, projects) {
        console.log('[GoogleDrive] Starting backup...');
        const token = await this.authenticate();
        const fileId = await this.findBackupFile(token);

        const backupData = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            prompts: prompts,
            projects: projects
        };

        const metadata = {
            name: this.BACKUP_FILENAME,
            mimeType: 'application/json'
        };

        // Create multipart body
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;

        const metadataBody = delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(backupData, null, 2) +
            closeDelim;

        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        const response = await fetch(url, {
            method: fileId ? 'PATCH' : 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: metadataBody
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backup failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('[GoogleDrive] Backup successful:', result.id);

        return {
            fileId: result.id,
            timestamp: backupData.timestamp
        };
    }

    /**
     * Download prompts from Google Drive
     * @returns {Promise<{prompts: Array, projects: Array, timestamp: string}>}
     */
    async restoreFromDrive() {
        console.log('[GoogleDrive] Starting restore...');
        const token = await this.authenticate();
        const fileId = await this.findBackupFile(token);

        if (!fileId) {
            throw new Error('No backup found on Google Drive');
        }

        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
            throw new Error(`Restore failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[GoogleDrive] Restore successful');

        return {
            prompts: data.prompts || [],
            projects: data.projects || [],
            timestamp: data.timestamp
        };
    }

    /**
     * Sign out - revoke cached token
     */
    async signOut() {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                if (token) {
                    chrome.identity.removeCachedAuthToken({ token }, () => {
                        console.log('[GoogleDrive] Signed out');
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Check if user is currently authenticated
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: false }, (token) => {
                resolve(!!token && !chrome.runtime.lastError);
            });
        });
    }
}

export default new GoogleDriveService();
