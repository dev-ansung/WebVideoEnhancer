import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - Filters', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Filter Adjustments (Gamma, Tint)', async ({ page }) => {
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
        
        const setRangeValue = async (selector: string, value: string) => {
            await page.locator(selector).evaluate((el: HTMLInputElement, val) => {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }, value);
        };

        await setRangeValue('#filter-gamma', '1.5');
        await expect(page.locator('#val-gamma')).toContainText('1.5x');

        await setRangeValue('#filter-tint-color', '#ff0000');
        await setRangeValue('#filter-tint-intensity', '50');
        await expect(page.locator('#val-tint-intensity')).toContainText('50%');
        
        // Snapshot the ENTIRE application state
        await expect(page).toHaveScreenshot('showcase-filters.png', { maxDiffPixelRatio: 0.05 });
    });
});
