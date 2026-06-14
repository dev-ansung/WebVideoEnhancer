import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - Video & Telemetry', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Loads Video and Updates Telemetry', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);
        
        const video = page.locator('#main-video');
        await expect(video).toHaveAttribute('src', /^blob:/);

        await page.waitForFunction(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            if (v && v.readyState >= 1) {
                v.currentTime = 10;
                return true;
            }
            return false;
        });
        
        await page.waitForTimeout(1000); // Wait for frame decode and paint

        const chapters = page.locator('#chapters-container button');
        await expect(chapters).toHaveCount(10);
        await expect(page).toHaveScreenshot('video-loaded-chapters.png', { maxDiffPixelRatio: 0.05 });
    });
});
