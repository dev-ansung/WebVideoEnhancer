import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - Zoom & Pan', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Zoom and Pan interactions', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);

        await page.waitForFunction(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            if (v && v.readyState >= 1) {
                v.currentTime = 10;
                return true;
            }
            return false;
        });
        await page.waitForTimeout(1000);
        
        const videoWrapper = page.locator('#player-wrapper');
        const box = await videoWrapper.boundingBox();
        if(box) {
            // Move to center
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            
            // Simulate mouse wheel to zoom in
            await page.mouse.wheel(0, -100);
            await page.waitForTimeout(100);
            await page.mouse.wheel(0, -100);
            await page.waitForTimeout(100);
            
            // Mid click and pan
            await page.mouse.down({ button: 'middle' });
            await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
            await page.mouse.up({ button: 'middle' });
            await page.waitForTimeout(100);
        }
        
        // Assert telemetry changed
        await expect(page.locator('#tel-zoom')).not.toContainText('1.0x (0,0)');

        // Stop the audio visualizer canvas animation so Playwright can achieve "page stability"
        await page.evaluate(() => {
            const canvas = document.getElementById('audio-visualizer');
            if (canvas) canvas.style.display = 'none';
        });

        await page.waitForTimeout(1000); // Let UI stabilize
        // Snapshot the ENTIRE application state
        await expect(page).toHaveScreenshot('showcase-zoom-telemetry.png', { maxDiffPixelRatio: 0.05, timeout: 15000 });
    });
});
