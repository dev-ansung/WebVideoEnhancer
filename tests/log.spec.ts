import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - Action Log', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Action Log rendering', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);
        await page.mouse.click(10, 10);
        
        // Generate some events
        await page.keyboard.press(' ');
        await page.waitForTimeout(100);
        await page.keyboard.press('x');
        await page.waitForTimeout(100);
        await page.keyboard.press(']');
        await page.waitForTimeout(100);
        
        const logPanel = page.locator('#action-log');
        await expect(logPanel).toContainText('Playback started');
        
        // Take screenshot of the log panel wrapper (allow small diff for changing timestamps)
        await expect(page.locator('#action-log').locator('..')).toHaveScreenshot('action-log-panel.png', { maxDiffPixelRatio: 0.05 });
    });
});
