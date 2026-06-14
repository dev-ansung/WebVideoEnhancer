// ==UserScript==
// @name         Universal Web Video Enhancer
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fixed native player controls by adjusting DOM injection timing and added whitelist domain controls.
// @author       You
// @match        *://*/*
// @require      https://raw.githubusercontent.com/dev-ansung/WebVideoEnhancer/main/studio.js
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const currentDomain = window.location.hostname;

    function getValue(key, defaultValue) {
        if (typeof GM_getValue !== 'undefined') {
            return GM_getValue(key, defaultValue);
        }
        try {
            const val = localStorage.getItem('uve_' + key);
            return val !== null ? JSON.parse(val) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function setValue(key, value) {
        if (typeof GM_setValue !== 'undefined') {
            GM_setValue(key, value);
            return;
        }
        try {
            localStorage.setItem('uve_' + key, JSON.stringify(value));
        } catch (e) {}
    }

    const isGloballyEnabled = getValue('global_enabled', false);
    const enabledDomains = getValue('enabled_domains', {});
    const disabledDomains = getValue('disabled_domains', {});

    let isRunningOnDomain = isGloballyEnabled;
    if (enabledDomains[currentDomain] === true) {
        isRunningOnDomain = true;
    } else if (disabledDomains[currentDomain] === true) {
        isRunningOnDomain = false;
    }

    // Register Menu Commands
    if (typeof GM_registerMenuCommand !== 'undefined') {
        // Domain specific toggle
        if (isRunningOnDomain) {
            GM_registerMenuCommand(`❌ Disable on ${currentDomain}`, () => {
                enabledDomains[currentDomain] = false;
                disabledDomains[currentDomain] = true;
                setValue('enabled_domains', enabledDomains);
                setValue('disabled_domains', disabledDomains);
                alert(`Universal Web Video Enhancer is now disabled on ${currentDomain}. Reloading page...`);
                window.location.reload();
            });
        } else {
            GM_registerMenuCommand(`✅ Enable on ${currentDomain}`, () => {
                enabledDomains[currentDomain] = true;
                disabledDomains[currentDomain] = false;
                setValue('enabled_domains', enabledDomains);
                setValue('disabled_domains', disabledDomains);
                alert(`Universal Web Video Enhancer is now enabled on ${currentDomain}. Reloading page...`);
                window.location.reload();
            });
        }

        // Global default toggle
        if (isGloballyEnabled) {
            GM_registerMenuCommand(`⚙️ Set Default to: Disabled (Whitelist Mode)`, () => {
                setValue('global_enabled', false);
                alert("Default status set to Disabled. The script will only run on explicitly enabled sites.");
                window.location.reload();
            });
        } else {
            GM_registerMenuCommand(`⚙️ Set Default to: Enabled (Run Everywhere)`, () => {
                setValue('global_enabled', true);
                alert("Default status set to Enabled. The script will run on all sites unless explicitly disabled.");
                window.location.reload();
            });
        }
    }

    if (!isRunningOnDomain) {
        return;
    }

    // 1. INJECT EXTERNAL LIBRARIES NATIVELY
    const twScript = document.createElement('script');
    twScript.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(twScript);

    const vjsScript = document.createElement('script');
    vjsScript.type = "module";
    vjsScript.src = "https://cdn.jsdelivr.net/npm/@videojs/html/cdn/video.js";
    document.head.appendChild(vjsScript);

    // 3. INJECT HOST STYLES & UI
    const style = document.createElement('style');
    style.textContent = `
        #studio-hijack-panel {
            position: fixed; bottom: 20px; right: 20px; width: 340px;
            background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            z-index: 2147483646; padding: 16px; display: flex; flex-direction: column; gap: 12px;
            backdrop-filter: blur(10px);
        }
        #studio-hijack-panel h3 { margin: 0; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        #sh-video-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .sh-video-item { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; font-size: 12px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .sh-video-info { color: #93c5fd; font-family: monospace; }
        .sh-btn { background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background 0.2s; align-self: flex-start; }
        .sh-btn.scan { background: #10b981; width: 100%; text-align: center; padding: 10px; font-size: 14px; }
        .sh-btn:hover { filter: brightness(1.1); }
        .sh-empty { font-size: 12px; color: #64748b; text-align: center; padding: 10px; }

        #studio-overlay-container {
            position: fixed; inset: 0; z-index: 2147483647;
            background: #111827; display: none;
            overflow-y: auto; overflow-x: hidden;
        }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'studio-hijack-panel';
    panel.innerHTML = `
        <h3>
            <span>📡 Video Scanner</span>
            <button id="sh-toggle-min" style="background:none;border:none;color:#94a3b8;cursor:pointer;">_</button>
        </h3>
        <div id="sh-panel-body" style="display:flex; flex-direction:column; gap:12px;">
            <button id="sh-scan-btn" class="sh-btn scan">🔍 Scan Now</button>
            <div id="sh-video-list"><div class="sh-empty">Ready to scan.</div></div>
        </div>
    `;
    document.body.appendChild(panel);

    // Create the overlay container in memory (NOT attached to the document yet)
    const overlayContainer = document.createElement('div');
    overlayContainer.id = 'studio-overlay-container';

    function formatDuration(seconds) {
        if (isNaN(seconds) || !isFinite(seconds) || seconds === 0) return "??:??";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`;
    }

    let isStudioInitialized = false;
    let originalVideoState = null;

    // 4. SCAN LOGIC
    const videoListContainer = document.getElementById('sh-video-list');

    document.getElementById('sh-toggle-min').addEventListener('click', (e) => {
        const body = document.getElementById('sh-panel-body');
        body.style.display = body.style.display === 'none' ? 'flex' : 'none';
        e.target.textContent = body.style.display === 'none' ? '□' : '_';
    });

    document.getElementById('sh-scan-btn').addEventListener('click', () => {
        videoListContainer.innerHTML = '<div class="sh-empty">Scanning...</div>';

        const videos = [...document.querySelectorAll('video')].filter(v => {
            const rect = v.getBoundingClientRect();
            const isVisible = rect.width >= 160 && rect.height >= 90 && getComputedStyle(v).display !== 'none';
            const isNotStudio = !overlayContainer.contains(v);
            return isVisible && isNotStudio;
        });

        if (videos.length === 0) {
            videoListContainer.innerHTML = '<div class="sh-empty">No active videos found.</div>';
            return;
        }

        videoListContainer.innerHTML = '';
        videos.forEach((v, index) => {
            const w = v.videoWidth || Math.round(v.getBoundingClientRect().width);
            const h = v.videoHeight || Math.round(v.getBoundingClientRect().height);
            const duration = formatDuration(v.duration);

            const item = document.createElement('div');
            item.className = 'sh-video-item';

            const infoText = document.createElement('div');
            infoText.className = 'sh-video-info';
            infoText.textContent = `[${duration}] Video ${index + 1} (${w}x${h})`;

            const playBtn = document.createElement('button');
            playBtn.className = 'sh-btn';
            playBtn.textContent = '▶ Hijack Node to Studio';
            playBtn.onclick = () => hijackVideo(v);

            item.appendChild(infoText);
            item.appendChild(playBtn);
            videoListContainer.appendChild(item);
        });
    });

    // 5. DOM REPARENTING HIJACK LOGIC
    function hijackVideo(videoElement) {
        // Save original DOM location and styles
        originalVideoState = {
            element: videoElement,
            parent: videoElement.parentNode,
            nextSibling: videoElement.nextSibling,
            style: videoElement.getAttribute('style') || '',
            controls: videoElement.controls
        };

        videoElement.pause();
        videoElement.controls = false;
        videoElement.setAttribute('style', `
            width: 100% !important;
            height: 100% !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            object-fit: contain !important;
            transition: transform 0.1s linear;
            transform-origin: center;
        `);
        videoElement.id = 'main-video';

        // Boot sequence: Inject HTML, append video, THEN attach to document
        if (!isStudioInitialized) {
            overlayContainer.innerHTML = window.PlayerStudio.TEMPLATE;
            const studioVideoWrapper = overlayContainer.querySelector('video-skin') || overlayContainer.querySelector('#player-wrapper');

            if (!studioVideoWrapper) {
                alert("Error: Wrapper not found in Studio HTML.");
                return;
            }

            // Append video into the memory tree before connecting to DOM
            studioVideoWrapper.appendChild(videoElement);

            // Connecting to the document triggers Video.js custom element upgrade perfectly
            document.body.appendChild(overlayContainer);
            isStudioInitialized = true;
        } else {
            // For subsequent hijacks
            const studioVideoWrapper = overlayContainer.querySelector('video-skin') || overlayContainer.querySelector('#player-wrapper');
            studioVideoWrapper.appendChild(videoElement);
        }

        document.body.style.overflow = 'hidden';
        overlayContainer.style.display = 'block';

        // Initialize the globally exposed JS class from our @require
        if (window.PlayerStudio && !window.App) {
            window.App = new window.PlayerStudio();
            window.App.init();
        } else if (window.App) {
            window.App.video = videoElement;
            window.App.bindVideoEvents(); // Rebind listeners to the newly attached video
        } else {
            console.error("PlayerStudio class not found. Ensure @require loaded correctly.");
        }

        setTimeout(() => {
            videoElement.play().catch(e => console.warn("Autoplay prevented:", e));
        }, 300);

        const closeBtn = document.getElementById('close-studio-btn');
        if (closeBtn) {
            closeBtn.onclick = restoreVideo;
        }
    }

    // 6. RESTORE LOGIC
    function restoreVideo() {
        if (!originalVideoState) return;

        const { element, parent, nextSibling, style, controls } = originalVideoState;

        element.pause();

        if (parent) {
            parent.insertBefore(element, nextSibling);
        }

        if (style) {
            element.setAttribute('style', style);
        } else {
            element.removeAttribute('style');
        }
        element.controls = controls;
        element.id = '';

        document.body.style.overflow = '';
        overlayContainer.style.display = 'none';
        originalVideoState = null;

        element.play().catch(e => console.warn("Playback resume prevented:", e));
    }
})();