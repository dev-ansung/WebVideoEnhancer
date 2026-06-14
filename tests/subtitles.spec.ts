import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Advanced Player Studio - Subtitles', () => {
    const videoPath = path.resolve(__dirname, './artifacts/NeverGonnaGiveYouUp.mp4');
    const enSrtPath = path.resolve(__dirname, './artifacts/english.srt');
    const zhSrtPath = path.resolve(__dirname, './artifacts/chinese.srt');

    test.beforeEach(async ({ page }) => {
        const filePath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + filePath);
        await page.waitForSelector('#advanced-studio-app');
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
    });

    test('Uploads Bilingual Subtitles and Renders Transcripts', async ({ page }) => {
        await page.locator('#video-upload').setInputFiles(videoPath);
        await page.locator('#srt-upload-1').setInputFiles(enSrtPath);
        await page.locator('#srt-upload-2').setInputFiles(zhSrtPath);

        const transcript1 = page.locator('#transcript-box-1 .transcript-item').first();
        const transcript2 = page.locator('#transcript-box-2 .transcript-item').first();
        
        await expect(transcript1).toBeVisible();
        await expect(transcript2).toBeVisible();

        // Seek video to 20s where subtitle text exists ("We're no strangers to love")
        await page.evaluate(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            v.currentTime = 20;
        });
        await page.waitForTimeout(1000);

        // Snapshot the ENTIRE application state
        await expect(page).toHaveScreenshot('showcase-bilingual.png', { maxDiffPixelRatio: 0.05 });
    });
});
