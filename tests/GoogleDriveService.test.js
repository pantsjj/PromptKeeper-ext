/**
 * @jest-environment jsdom
 */

import GoogleDriveService from '../services/GoogleDriveService.js';

// Mock Chrome APIs
global.chrome = {
    identity: {
        getAuthToken: jest.fn(),
        removeCachedAuthToken: jest.fn()
    },
    runtime: {
        lastError: undefined
    }
};

// Mock fetch
global.fetch = jest.fn();

describe('GoogleDriveService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        chrome.runtime.lastError = undefined;
    });

    describe('authenticate', () => {
        it('should return token on successful authentication', async () => {
            const mockToken = 'mock-oauth-token-123';
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback(mockToken);
            });

            const token = await GoogleDriveService.authenticate();

            expect(token).toBe(mockToken);
            expect(chrome.identity.getAuthToken).toHaveBeenCalledWith(
                { interactive: true },
                expect.any(Function)
            );
        });

        it('should reject on authentication error', async () => {
            chrome.runtime = { lastError: { message: 'Auth failed' } };
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback(null);
            });

            await expect(GoogleDriveService.authenticate()).rejects.toThrow('Auth failed');
        });
    });

    describe('getUserInfo', () => {
        it('should return user info from Google OAuth API', async () => {
            const mockUserInfo = { email: 'test@example.com', name: 'Test User' };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockUserInfo
            });

            const userInfo = await GoogleDriveService.getUserInfo('mock-token');

            expect(userInfo).toEqual(mockUserInfo);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                { headers: { Authorization: 'Bearer mock-token' } }
            );
        });

        it('should fallback to Drive API if userinfo fails', async () => {
            global.fetch
                .mockResolvedValueOnce({ ok: false }) // Userinfo fails
                .mockResolvedValueOnce({ // Drive API succeeds
                    ok: true,
                    json: async () => ({
                        user: {
                            emailAddress: 'drive@example.com',
                            displayName: 'Drive User'
                        }
                    })
                });

            const userInfo = await GoogleDriveService.getUserInfo('mock-token');

            expect(userInfo.email).toBe('drive@example.com');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should return generic info if all APIs fail', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const userInfo = await GoogleDriveService.getUserInfo('mock-token');

            expect(userInfo.email).toBe('Signed In');
        });
    });

    describe('backupToDrive', () => {
        it('should upload prompts to Google Drive', async () => {
            const mockPrompts = [{ id: '1', text: 'Test prompt' }];
            const mockProjects = [{ id: 'p1', name: 'Project 1' }];

            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback('mock-token');
            });

            // Mock findBackupFile
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }) // No existing file
            });

            // Mock upload
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'file-123' })
            });

            const result = await GoogleDriveService.backupToDrive(mockPrompts, mockProjects);

            expect(result.fileId).toBe('file-123');
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('restoreFromDrive', () => {
        it('should download and parse backup file', async () => {
            const mockBackupData = {
                version: '2.0.0',
                timestamp: '2024-12-08T00:00:00Z',
                prompts: [{ id: '1', text: 'Backup prompt' }],
                projects: [{ id: 'p1', name: 'Backup project' }]
            };

            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback('mock-token');
            });

            // Mock findBackupFile
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [{ id: 'backup-file-id' }] })
            });

            // Mock download
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackupData
            });

            const data = await GoogleDriveService.restoreFromDrive();

            expect(data.prompts).toHaveLength(1);
            expect(data.projects).toHaveLength(1);
            expect(data.timestamp).toBe(mockBackupData.timestamp);
        });

        it('should throw error if no backup found', async () => {
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback('mock-token');
            });

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] }) // No backup
            });

            await expect(GoogleDriveService.restoreFromDrive()).rejects.toThrow('No backup found');
        });
    });

    describe('signOut', () => {
        it('should remove cached token', async () => {
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback('mock-token');
            });

            chrome.identity.removeCachedAuthToken.mockImplementation((options, callback) => {
                callback();
            });

            await GoogleDriveService.signOut();

            expect(chrome.identity.removeCachedAuthToken).toHaveBeenCalledWith(
                { token: 'mock-token' },
                expect.any(Function)
            );
        });
    });

    describe('isAuthenticated', () => {
        it('should return true if token exists', async () => {
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback('mock-token');
            });

            const isAuth = await GoogleDriveService.isAuthenticated();

            expect(isAuth).toBe(true);
        });

        it('should return false if no token', async () => {
            chrome.identity.getAuthToken.mockImplementation((options, callback) => {
                callback(null);
            });

            const isAuth = await GoogleDriveService.isAuthenticated();

            expect(isAuth).toBe(false);
        });
    });
});
