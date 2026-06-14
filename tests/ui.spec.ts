import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - UI', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');
    const enSrtPath = path.resolve(__dirname, './artifacts/english.srt');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Subtitle Layout Customization', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);
        await page.locator('#srt-upload-1').setInputFiles(enSrtPath);
        
        const setInputValue = async (selector: string, value: string) => {
            await page.locator(selector).evaluate((el: HTMLInputElement, val) => {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }, value);
        };

        // Change Track 1 Font Size to 30px
        await setInputValue('#sub-size-0', '30');
        await expect(page.locator('#val-sub-size-0')).toContainText('30px');

        // Change Track 1 Color to Green
        await setInputValue('#sub-color-0', '#00ff00');
        await expect(page.locator('#val-sub-color-0')).toContainText('#00ff00');

        await page.waitForTimeout(100);

        // Snapshot settings panel logic
        await expect(page.locator('.border-t.border-gray-700.pt-3').first()).toHaveScreenshot('subtitle-customization-ui.png');
    });

    test('Audio Visualizer Toggle', async ({ page }) => {
        const toggleBtn = page.locator('#toggle-visualizer');
        const wrapper = page.locator('#visualizer-wrapper');

        await expect(wrapper).toBeVisible();

        await toggleBtn.click();
        await expect(wrapper).toBeHidden();

        await toggleBtn.click();
        await expect(wrapper).toBeVisible();
    });
});
