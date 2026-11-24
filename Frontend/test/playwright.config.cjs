const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: __dirname,
    testMatch: '**/*.spec.cjs',
    fullyParallel: true,
    workers: 2,
    timeout: 30000,
    use: {
        baseURL: 'http://127.0.0.1:3187',
        channel:
            process.env.PLAYWRIGHT_CHANNEL ||
            (process.platform === 'win32' ? 'msedge' : undefined),
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
        {
            name: 'mobile',
            use: {
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true
            }
        }
    ],
    webServer: {
        command: 'node Backend/src/server.js',
        cwd: require('node:path').resolve(__dirname, '../..'),
        env: { PORT: '3187' },
        url: 'http://127.0.0.1:3187/store',
        reuseExistingServer: false
    }
});
