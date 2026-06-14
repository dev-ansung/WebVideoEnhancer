import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - Hotkeys', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Playback Control Hotkeys (Space, Speed, Seek)', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);
        await page.mouse.click(10, 10); 

        // Play
        await page.keyboard.press(' ');
        await expect(page.locator('#visual-cue')).toContainText('Play');
        
        // Speed up
        await page.keyboard.press(']');
        await expect(page.locator('#visual-cue')).toContainText('1.5x');
        await expect(page.locator('#tel-rate')).toContainText('1.5x');

        // Seek forward 10s
        await page.keyboard.press('l');
        await expect(page.locator('#visual-cue')).toContainText('+10s');
        
        await expect(page.locator('#tel-rate')).toHaveScreenshot('telemetry-rate.png');
    });

    test('Subtitle Sync Hotkeys (Z / X)', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);
        await page.mouse.click(10, 10);

        // Shift forward +100ms
        await page.keyboard.press('x');
        await expect(page.locator('#visual-cue')).toContainText('Sync: +100ms');
        await expect(page.locator('#tel-sync')).toContainText('+100 ms');

        // Shift backward -100ms
        await page.keyboard.press('z');
        await expect(page.locator('#visual-cue')).toContainText('Sync: 0ms');
        await expect(page.locator('#tel-sync')).toContainText('0 ms');
    });
});
