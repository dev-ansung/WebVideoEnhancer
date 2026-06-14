import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const videoPath = path.resolve(__dirname, '../tests/artifacts/NeverGonnaGiveYouUp.mp4');
const srtPath1 = path.resolve(__dirname, '../tests/artifacts/english.srt');
const srtPath2 = path.resolve(__dirname, '../tests/artifacts/chinese.srt');
const htmlPath = 'file://' + path.resolve(__dirname, '../index.html');
const outDir = path.resolve(__dirname, '../screenshots');

async function recordDemo(name: string, action: (page: any) => Promise<void>) {
    console.log(`Generating demo: ${name}...`);
    const browser = await chromium.launch({ headless: true });
    
    const videoDir = path.resolve(__dirname, '../test-results/videos/');
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    const context = await browser.newContext({
        recordVideo: { dir: videoDir },
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    await page.goto(htmlPath);
    await page.waitForSelector('#advanced-studio-app');
    
    // Upload video
    await page.locator('#video-upload').setInputFiles(videoPath);
    await page.waitForFunction(() => {
        const v = document.getElementById('main-video') as HTMLVideoElement;
        return v && v.readyState >= 1;
    });

    await action(page);

    await context.close();
    await browser.close();

    // Find the generated video
    const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.webm'));
    if (files.length > 0) {
        // Find the most recently created webm
        const latestVideo = files.map(f => ({ name: f, time: fs.statSync(path.join(videoDir, f)).mtime.getTime() }))
                                 .sort((a, b) => b.time - a.time)[0].name;

        const webmPath = path.join(videoDir, latestVideo);
        const gifPath = path.join(outDir, `${name}.gif`);
        
        // Convert the WebM from Playwright into an optimized GIF for GitHub markdown compatibility
        const { execSync } = require('child_process');
        execSync(`ffmpeg -y -i "${webmPath}" -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${gifPath}"`, { stdio: 'ignore' });
        
        // Clean up the raw webm
        fs.unlinkSync(webmPath);
        console.log(`Saved ${name}.gif`);
    }
}

async function runAll() {
    // 1. Bilingual Showcase
    await recordDemo('showcase-bilingual', async (page) => {
        await page.locator('#srt-upload-1').setInputFiles(srtPath1);
        await page.locator('#srt-upload-2').setInputFiles(srtPath2);
        
        await page.evaluate(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            v.currentTime = 18; // Text is visible here
            v.play();
        });
        
        await page.waitForTimeout(4000); // Record for 4 seconds
    });

    // 2. Filters Showcase
    await recordDemo('showcase-filters', async (page) => {
        await page.evaluate(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            v.currentTime = 10;
            v.play();
        });
        
        await page.waitForTimeout(500);
        
        // Scroll down to the Advanced Controls section so it is visible in the GIF
        const gamma = page.locator('#filter-gamma');
        await gamma.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // Dynamically drag a slider to show it updating
        await gamma.evaluate((el: HTMLInputElement) => el.value = '1.5');
        await gamma.dispatchEvent('input');
        await page.waitForTimeout(500);
        
        await gamma.evaluate((el: HTMLInputElement) => el.value = '2.0');
        await gamma.dispatchEvent('input');
        await page.waitForTimeout(500);

        const hue = page.locator('#filter-hue');
        await hue.evaluate((el: HTMLInputElement) => el.value = '90');
        await hue.dispatchEvent('input');
        await page.waitForTimeout(1000);

        const tintMode = page.locator('#filter-tint-mode');
        await tintMode.selectOption('overlay');
        const tintInt = page.locator('#filter-tint-intensity');
        await tintInt.evaluate((el: HTMLInputElement) => el.value = '50');
        await tintInt.dispatchEvent('input');
        await page.waitForTimeout(1500);
    });

    // 3. Zoom & Telemetry Showcase
    await recordDemo('showcase-zoom-telemetry', async (page) => {
        await page.evaluate(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            v.currentTime = 10;
            v.play();
        });
        
        await page.waitForTimeout(500);
        
        const videoWrapper = page.locator('#player-wrapper');
        const box = await videoWrapper.boundingBox();
        if(box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.wheel(0, -100);
            await page.waitForTimeout(300);
            await page.mouse.wheel(0, -100);
            await page.waitForTimeout(300);
            await page.mouse.wheel(0, -100);
            await page.waitForTimeout(500);
            
            await page.mouse.down({ button: 'middle' });
            await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 150, { steps: 20 });
            await page.waitForTimeout(500);
            await page.mouse.up({ button: 'middle' });
            await page.waitForTimeout(1000);
        }
    });

    // 4. Subtitle Sync Showcase
    await recordDemo('showcase-sync', async (page) => {
        // Upload subtitle to see it shift
        await page.locator('#srt-upload-1').setInputFiles(srtPath1);
        
        await page.evaluate(() => {
            const v = document.getElementById('main-video') as HTMLVideoElement;
            v.currentTime = 18; // Text appears around 19s
            v.play();
        });
        
        await page.waitForTimeout(1000);
        
        // Press 'Z' to delay subtitles (negative sync)
        await page.keyboard.press('z');
        await page.waitForTimeout(300);
        await page.keyboard.press('z');
        await page.waitForTimeout(300);
        await page.keyboard.press('z');
        await page.waitForTimeout(1000);
        
        // Press 'X' to advance subtitles (positive sync)
        await page.keyboard.press('x');
        await page.waitForTimeout(300);
        await page.keyboard.press('x');
        await page.waitForTimeout(300);
        await page.keyboard.press('x');
        await page.waitForTimeout(300);
        await page.keyboard.press('x');
        await page.waitForTimeout(1000);
    });
}

runAll().catch(console.error);
