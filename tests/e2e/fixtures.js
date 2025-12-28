
import { test as base, chromium } from '@playwright/test';
import path from 'path';

export const test = base.extend({
    context: async ({ }, use) => { // eslint-disable-line no-empty-pattern
        const pathToExtension = path.join(__dirname, '../../');
        const userDataDir = '/tmp/test-user-data-dir-' + Date.now();

        const context = await chromium.launchPersistentContext(userDataDir, {
            headless: false, // Extensions only work in headed mode
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
            ],
        });

        await use(context);
        await context.close();
    },
    extensionId: async ({ context }, use) => {
        // for manifestation v3
        let [background] = context.serviceWorkers();
        if (!background)
            background = await context.waitForEvent('serviceworker');

        const extensionId = background.url().split('/')[2];
        await use(extensionId);
    },
});
export const expect = test.expect;
