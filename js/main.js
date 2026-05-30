const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const battleScreenEl = document.getElementById('battleScreen');
        const lobbyScreenEl = document.getElementById('lobbyScreen');
        const overlay = document.getElementById('overlay');
        const introPanelEl = document.getElementById('introPanel');
        const pausePanelEl = document.getElementById('pausePanel');
        const pauseContinueBtnEl = document.getElementById('pauseContinueBtn');
        const pauseLobbyBtnEl = document.getElementById('pauseLobbyBtn');
        const subTitleEl = document.getElementById('sub-title');
        const lobbyGoldLineEl = document.getElementById('lobbyGoldLine');
        const lobbyStatLineEl = document.getElementById('lobbyStatLine');
        const lobbyNoticeLineEl = document.getElementById('lobbyNoticeLine');
        const hpCardStatEl = document.getElementById('hpCardStat');
        const atkCardStatEl = document.getElementById('atkCardStat');
        const defCardStatEl = document.getElementById('defCardStat');
        const upgradeHpBtnEl = document.getElementById('upgradeHpBtn');
        const upgradeAtkBtnEl = document.getElementById('upgradeAtkBtn');
        const upgradeDefBtnEl = document.getElementById('upgradeDefBtn');
        const lobbyStartEl = document.getElementById('lobbyStart');
        const dodgePromptEl = document.getElementById('dodgePrompt');
        const attackPromptEl = document.getElementById('attackPrompt');
        let pauseSelection = 0; // 0: Continue, 1: Return to Lobby
        const playerSourceImg = new Image();
        playerSourceImg.src = 'image/player_image.png';
        const stage1MonsterImg = new Image();
        stage1MonsterImg.src = 'image/1-1.png';
        const stage2MonsterImg = new Image();
        stage2MonsterImg.src = 'image/1-2.png';
        const bossMidImg = new Image();
        bossMidImg.src = 'image/boss_mid.png';
        const bossFinalImg = new Image();
        bossFinalImg.src = 'image/boss_final.png';
        // Optional custom small icons (place PNGs in image/ to override pixel patterns)
        const iconSwordImg = new Image();
        iconSwordImg.src = 'image/sword.png';
        const iconHeartImg = new Image();
        iconHeartImg.src = 'image/heart.png';
        const iconShieldImg = new Image();
        iconShieldImg.src = 'image/shield.png';
        const customIconCanvases = { sword: null, heart: null, shield: null };
        iconSwordImg.onload = () => { try { customIconCanvases.sword = removeWhiteBackground(iconSwordImg); drawPixelIcon('iconSword'); } catch (e) {} };
        iconHeartImg.onload = () => { try { customIconCanvases.heart = removeWhiteBackground(iconHeartImg); drawPixelIcon('iconHeart'); } catch (e) {} };
        iconShieldImg.onload = () => { try { customIconCanvases.shield = removeWhiteBackground(iconShieldImg); drawPixelIcon('iconShield'); } catch (e) {} };
        // If images are already cached/complete, process immediately
        if (iconSwordImg.complete && iconSwordImg.naturalWidth > 0) {
            try { customIconCanvases.sword = removeWhiteBackground(iconSwordImg); drawPixelIcon('iconSword'); } catch (e) {}
        }
        if (iconHeartImg.complete && iconHeartImg.naturalWidth > 0) {
            try { customIconCanvases.heart = removeWhiteBackground(iconHeartImg); drawPixelIcon('iconHeart'); } catch (e) {}
        }
        if (iconShieldImg.complete && iconShieldImg.naturalWidth > 0) {
            try { customIconCanvases.shield = removeWhiteBackground(iconShieldImg); drawPixelIcon('iconShield'); } catch (e) {}
        }
let lobbyNoticeAnimTimer = null;
        let lobbyStatAnimTimer = null;
        let lobbySelection = 0; // 0: ATK, 1: HP, 2: DEF, 3: START
        const extractedPlayerSprites = {
            idle: null,
            attack: null
        };

        function extractSpriteFromHalf(image, halfX, halfWidth) {
            const workCanvas = document.createElement('canvas');
            workCanvas.width = halfWidth;
            workCanvas.height = image.naturalHeight;
            const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
            workCtx.imageSmoothingEnabled = false;
            workCtx.drawImage(image, halfX, 0, halfWidth, image.naturalHeight, 0, 0, halfWidth, image.naturalHeight);

            const { width, height } = workCanvas;
            const imageData = workCtx.getImageData(0, 0, width, height);
            const data = imageData.data;

            let minX = width;
            let minY = height;
            let maxX = -1;
            let maxY = -1;

            const startY = Math.floor(height * 0.18);
            for (let y = startY; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    const r = data[idx];
                    const g = data[idx + 1];
                    const b = data[idx + 2];
                    const a = data[idx + 3];
                    if (a === 0) continue;
                    if (r > 245 && g > 245 && b > 245) continue;

                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }

            if (maxX < minX || maxY < minY) return null;

            const pad = 0;
            const sx = Math.max(0, minX - pad);
            const sy = Math.max(startY, minY - pad);
            const sw = Math.min(width - sx, (maxX - minX + 1) + (pad * 2));
            const sh = Math.min(height - sy, (maxY - minY + 1) + (pad * 2));

            const spriteCanvas = document.createElement('canvas');
            spriteCanvas.width = sw;
            spriteCanvas.height = sh;
            const spriteCtx = spriteCanvas.getContext('2d');
            spriteCtx.imageSmoothingEnabled = false;
            spriteCtx.drawImage(workCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

            const spriteData = spriteCtx.getImageData(0, 0, sw, sh);
            const px = spriteData.data;
            for (let i = 0; i < px.length; i += 4) {
                const r = px[i];
                const g = px[i + 1];
                const b = px[i + 2];
                if (r > 228 && g > 228 && b > 228) {
                    px[i + 3] = 0;
                }
            }
            spriteCtx.putImageData(spriteData, 0, 0);

            let trimMinX = sw;
            let trimMinY = sh;
            let trimMaxX = -1;
            let trimMaxY = -1;
            const trimmed = spriteCtx.getImageData(0, 0, sw, sh).data;
            for (let y = 0; y < sh; y++) {
                for (let x = 0; x < sw; x++) {
                    const idx = (y * sw + x) * 4;
                    if (trimmed[idx + 3] > 0) {
                        if (x < trimMinX) trimMinX = x;
                        if (y < trimMinY) trimMinY = y;
                        if (x > trimMaxX) trimMaxX = x;
                        if (y > trimMaxY) trimMaxY = y;
                    }
                }
            }

            if (trimMaxX < trimMinX || trimMaxY < trimMinY) return spriteCanvas;

            const tw = trimMaxX - trimMinX + 1;
            const th = trimMaxY - trimMinY + 1;
            const tightCanvas = document.createElement('canvas');
            tightCanvas.width = tw;
            tightCanvas.height = th;
            const tightCtx = tightCanvas.getContext('2d');
            tightCtx.imageSmoothingEnabled = false;
            tightCtx.drawImage(spriteCanvas, trimMinX, trimMinY, tw, th, 0, 0, tw, th);
            return tightCanvas;
        }

        playerSourceImg.onload = () => {
            const halfWidth = Math.floor(playerSourceImg.naturalWidth / 2);
            extractedPlayerSprites.idle = extractSpriteFromHalf(playerSourceImg, 0, halfWidth);
            extractedPlayerSprites.attack = extractSpriteFromHalf(playerSourceImg, halfWidth, playerSourceImg.naturalWidth - halfWidth);
        };

        function removeWhiteBackground(image, options = {}) {
            const aggressive = options.aggressive === true;
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const workCtx = canvas.getContext('2d', { willReadFrequently: true });
            workCtx.imageSmoothingEnabled = false;
            workCtx.drawImage(image, 0, 0);

            const w = canvas.width;
            const h = canvas.height;
            const imageData = workCtx.getImageData(0, 0, w, h);
            const data = imageData.data;

            function idxAt(x, y) {
                return (y * w + x) * 4;
            }

            function colorDistSq(r1, g1, b1, r2, g2, b2) {
                const dr = r1 - r2;
                const dg = g1 - g2;
                const db = b1 - b2;
                return (dr * dr) + (dg * dg) + (db * db);
            }

            // 1) Very bright background removal.
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (r > 228 && g > 228 && b > 228) {
                    data[i + 3] = 0;
                }
            }

            // 2) Remove border-connected background (handles checker gray + light flat backdrops).
            const cornerSamples = [
                [data[idxAt(0, 0)], data[idxAt(0, 0) + 1], data[idxAt(0, 0) + 2]],
                [data[idxAt(w - 1, 0)], data[idxAt(w - 1, 0) + 1], data[idxAt(w - 1, 0) + 2]],
                [data[idxAt(0, h - 1)], data[idxAt(0, h - 1) + 1], data[idxAt(0, h - 1) + 2]],
                [data[idxAt(w - 1, h - 1)], data[idxAt(w - 1, h - 1) + 1], data[idxAt(w - 1, h - 1) + 2]]
            ];
            const toleranceSq = 86 * 86;

            function isLikelyBg(r, g, b) {
                let nearCorner = false;
                for (let s = 0; s < cornerSamples.length; s++) {
                    const cr = cornerSamples[s][0];
                    const cg = cornerSamples[s][1];
                    const cb = cornerSamples[s][2];
                    if (colorDistSq(r, g, b, cr, cg, cb) <= toleranceSq) {
                        nearCorner = true;
                        break;
                    }
                }

                const maxCh = Math.max(r, g, b);
                const minCh = Math.min(r, g, b);
                const avg = (r + g + b) / 3;
                const lowSaturation = (maxCh - minCh) <= 46;
                const brightEnough = avg >= 145;
                return nearCorner || (lowSaturation && brightEnough);
            }

            const visited = new Uint8Array(w * h);
            const queue = new Int32Array(w * h * 2);
            let qHead = 0;
            let qTail = 0;

            function pushSeed(x, y) {
                const pos = (y * w) + x;
                if (!visited[pos]) {
                    queue[qTail++] = x;
                    queue[qTail++] = y;
                }
            }

            for (let x = 0; x < w; x++) {
                pushSeed(x, 0);
                pushSeed(x, h - 1);
            }
            for (let y = 1; y < h - 1; y++) {
                pushSeed(0, y);
                pushSeed(w - 1, y);
            }

            while (qHead < qTail) {
                const x = queue[qHead++];
                const y = queue[qHead++];
                const pos = (y * w) + x;
                if (visited[pos]) continue;
                visited[pos] = 1;

                const i = idxAt(x, y);
                if (data[i + 3] === 0) continue;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (!isLikelyBg(r, g, b)) continue;

                data[i + 3] = 0;

                if (x > 0) {
                    queue[qTail++] = x - 1;
                    queue[qTail++] = y;
                }
                if (x < w - 1) {
                    queue[qTail++] = x + 1;
                    queue[qTail++] = y;
                }
                if (y > 0) {
                    queue[qTail++] = x;
                    queue[qTail++] = y - 1;
                }
                if (y < h - 1) {
                    queue[qTail++] = x;
                    queue[qTail++] = y + 1;
                }
            }

            // 2.5) Defringe: remove bright/gray halo pixels touching transparent area.
            const passData = new Uint8ClampedArray(data);
            function hasTransparentNeighbor(x, y) {
                for (let ny = Math.max(0, y - 1); ny <= Math.min(h - 1, y + 1); ny++) {
                    for (let nx = Math.max(0, x - 1); nx <= Math.min(w - 1, x + 1); nx++) {
                        if (nx === x && ny === y) continue;
                        const ni = idxAt(nx, ny);
                        if (passData[ni + 3] === 0) return true;
                    }
                }
                return false;
            }

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = idxAt(x, y);
                    const a = passData[i + 3];
                    if (a === 0) continue;
                    if (!hasTransparentNeighbor(x, y)) continue;

                    const r = passData[i];
                    const g = passData[i + 1];
                    const b = passData[i + 2];
                    const maxCh = Math.max(r, g, b);
                    const minCh = Math.min(r, g, b);
                    const avg = (r + g + b) / 3;
                    const lowSaturation = (maxCh - minCh) <= 52;
                    const nearWhite = avg >= 150;
                    const closeToCorner = colorDistSq(r, g, b, cornerSamples[0][0], cornerSamples[0][1], cornerSamples[0][2]) <= (92 * 92)
                        || colorDistSq(r, g, b, cornerSamples[1][0], cornerSamples[1][1], cornerSamples[1][2]) <= (92 * 92)
                        || colorDistSq(r, g, b, cornerSamples[2][0], cornerSamples[2][1], cornerSamples[2][2]) <= (92 * 92)
                        || colorDistSq(r, g, b, cornerSamples[3][0], cornerSamples[3][1], cornerSamples[3][2]) <= (92 * 92);

                    if ((lowSaturation && nearWhite) || closeToCorner || a < 96) {
                        data[i + 3] = 0;
                    }
                }
            }

            if (aggressive) {
                const pass2 = new Uint8ClampedArray(data);
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = idxAt(x, y);
                        const a = pass2[i + 3];
                        if (a === 0) continue;

                        let touchesTransparent = false;
                        for (let ny = Math.max(0, y - 1); ny <= Math.min(h - 1, y + 1); ny++) {
                            for (let nx = Math.max(0, x - 1); nx <= Math.min(w - 1, x + 1); nx++) {
                                if (nx === x && ny === y) continue;
                                const ni = idxAt(nx, ny);
                                if (pass2[ni + 3] === 0) {
                                    touchesTransparent = true;
                                    break;
                                }
                            }
                            if (touchesTransparent) break;
                        }
                        if (!touchesTransparent) continue;

                        const r = pass2[i];
                        const g = pass2[i + 1];
                        const b = pass2[i + 2];
                        const avg = (r + g + b) / 3;
                        const spread = Math.max(r, g, b) - Math.min(r, g, b);
                        if ((avg >= 135 && spread <= 68) || a < 140) {
                            data[i + 3] = 0;
                        }
                    }
                }
            }

            workCtx.putImageData(imageData, 0, 0);

            // 3) Trim transparent margins so only sprite bounds remain.
            const trimmedData = workCtx.getImageData(0, 0, w, h).data;
            let minX = w;
            let minY = h;
            let maxX = -1;
            let maxY = -1;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    if (trimmedData[i + 3] > 0) {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < minX || maxY < minY) return canvas;

            const tw = maxX - minX + 1;
            const th = maxY - minY + 1;
            const tightCanvas = document.createElement('canvas');
            tightCanvas.width = tw;
            tightCanvas.height = th;
            const tightCtx = tightCanvas.getContext('2d');
            tightCtx.imageSmoothingEnabled = false;
            tightCtx.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
            return tightCanvas;
        }

        function processBossImage(image, options = {}) {
            image.cleanedCanvas = removeWhiteBackground(image, options);
        }

        function isStatMaxed(index) {
            if (index === 0) return player.atkLevel >= UPGRADE_CONFIG.atk.maxLevel;
            if (index === 1) return player.hpLevel >= UPGRADE_CONFIG.hp.maxLevel;
            if (index === 2) return player.defLevel >= UPGRADE_CONFIG.def.maxLevel;
            return false;
        }

        function updateLobbySelection() {
            try {
                const cards = document.querySelectorAll('.lobby-card');
                let targetEl = null;
                cards.forEach((c, i) => {
                    if (i === lobbySelection && lobbySelection <= 2) {
                        c.classList.add('selected');
                        targetEl = c.querySelector('.upgrade-btn');
                    } else {
                        c.classList.remove('selected');
                    }
                });
                if (lobbyStartEl) {
                    if (lobbySelection === 3) {
                        lobbyStartEl.classList.add('start-selected');
                        targetEl = lobbyStartEl;
                    } else {
                        lobbyStartEl.classList.remove('start-selected');
                    }
                }
                
                const frame = document.getElementById('lobbySelectionFrame');
                const panel = document.getElementById('lobbyPanel');
                if (targetEl && frame && panel) {
                    const targetRect = targetEl.getBoundingClientRect();
                    const panelRect = panel.getBoundingClientRect();
                    
                    let left = targetRect.left - panelRect.left - panel.clientLeft;
                    let top = targetRect.top - panelRect.top - panel.clientTop;
                    let width = targetRect.width;
                    let height = targetRect.height;
                    
                    if (lobbySelection === 3) {
                        left -= 10;
                        top -= 6;
                        width += 20;
                        height += 12;
                    }
                    
                    frame.style.left = `${left - 2}px`;
                    frame.style.top = `${top - 2}px`;
                    frame.style.width = `${width + 4}px`;
                    frame.style.height = `${height + 4}px`;
                    frame.classList.add('active');
                }
            } catch (e) {}
        }

        function updatePauseSelection() {
            try {
                if (!pauseContinueBtnEl || !pauseLobbyBtnEl) return;

                const targetEl = pauseSelection === 0 ? pauseContinueBtnEl : pauseLobbyBtnEl;
                const frame = document.getElementById('pauseSelectionFrame');
                const panel = document.getElementById('pausePanel');
                if (targetEl && frame && panel) {
                    const targetRect = targetEl.getBoundingClientRect();
                    const panelRect = panel.getBoundingClientRect();
                    
                    let left = targetRect.left - panelRect.left - panel.clientLeft;
                    let top = targetRect.top - panelRect.top - panel.clientTop;
                    
                    frame.style.left = `${left - 2}px`;
                    frame.style.top = `${top - 2}px`;
                    frame.style.width = `${targetRect.width + 4}px`;
                    frame.style.height = `${targetRect.height + 4}px`;
                    frame.classList.add('active');
                }
            } catch (e) {}
        }

        function processStage1MonsterImage(image) {
            image.cleanedCanvas = removeWhiteBackground(image, { aggressive: true });
        }

        stage1MonsterImg.onload = () => {
            processStage1MonsterImage(stage1MonsterImg);
        };

        stage2MonsterImg.onload = () => {
            processStage1MonsterImage(stage2MonsterImg);
        };

        bossMidImg.onload = () => {
            processBossImage(bossMidImg, { aggressive: false });
        };

        bossFinalImg.onload = () => {
            processBossImage(bossFinalImg, { aggressive: true });
        };

        // Handle cached images that may already be complete before onload handlers fire.
        if (stage1MonsterImg.complete && stage1MonsterImg.naturalWidth > 0) processStage1MonsterImage(stage1MonsterImg);
        if (stage2MonsterImg.complete && stage2MonsterImg.naturalWidth > 0) processStage1MonsterImage(stage2MonsterImg);
        if (bossMidImg.complete && bossMidImg.naturalWidth > 0) processBossImage(bossMidImg, { aggressive: false });
        if (bossFinalImg.complete && bossFinalImg.naturalWidth > 0) processBossImage(bossFinalImg, { aggressive: true });

        function drawPixelIcon(canvasId, pattern) {
            const el = document.getElementById(canvasId);
            let key = null;
            if (canvasId === 'iconSword') key = 'sword';
            else if (canvasId === 'iconHeart') key = 'heart';
            else if (canvasId === 'iconShield') key = 'shield';

            // If the element is an <img>, set its src to the processed canvas or original image file.
            if (el && el.tagName && el.tagName.toLowerCase() === 'img') {
                try {
                    if (key && customIconCanvases[key]) {
                        el.src = customIconCanvases[key].toDataURL();
                        return;
                    }
                    // Fallback to original image files
                    if (key === 'sword') el.src = 'image/sword.png';
                    else if (key === 'heart') el.src = 'image/heart.png';
                    else if (key === 'shield') el.src = 'image/shield.png';
                } catch (e) {
                    // ignore
                }
                return;
            }

            // Otherwise, if it's a canvas (legacy), draw onto it as before.
            if (el && typeof el.getContext === 'function') {
                const iconCanvas = el;
                const iconCtx = iconCanvas.getContext('2d');
                iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
                if (key) {
                    iconCtx.imageSmoothingEnabled = false;
                    if (customIconCanvases[key]) {
                        iconCtx.drawImage(customIconCanvases[key], 0, 0, iconCanvas.width, iconCanvas.height);
                        return;
                    }
                    try {
                        let srcImg = null;
                        if (key === 'sword' && typeof iconSwordImg !== 'undefined') srcImg = iconSwordImg;
                        else if (key === 'heart' && typeof iconHeartImg !== 'undefined') srcImg = iconHeartImg;
                        else if (key === 'shield' && typeof iconShieldImg !== 'undefined') srcImg = iconShieldImg;

                        if (srcImg && srcImg.complete && srcImg.naturalWidth > 0) {
                            iconCtx.drawImage(srcImg, 0, 0, iconCanvas.width, iconCanvas.height);
                            return;
                        }
                    } catch (e) {}
                }
            }
        }

        function renderLobbyIcons() {
            // Use uploaded/processed images for the three lobby icons.
            drawPixelIcon('iconSword', null);
            drawPixelIcon('iconHeart', null);
            drawPixelIcon('iconShield', null);
        }
function setSubTitle(text, isBlinking = false) {
            subTitleEl.innerText = text;
            subTitleEl.classList.toggle('blink-text', isBlinking);
        }
function getEnemyProfile(stage = state.stage) {
            const baseHp = 100 + (stage * 42);
            const baseDamage = Math.round(16 + (stage * 1.5));
            const baseIdleTimer = Math.max(120, 300 - (stage * 3));
            const basePreparingTimer = 45;
            const baseHoldTimer = 55;
            const baseAttackTimer = 25;

            let profile = {
                hp: baseHp,
                damage: baseDamage,
                idleTimer: baseIdleTimer,
                preparingTimer: basePreparingTimer,
                holdTimer: baseHoldTimer,
                attackTimer: baseAttackTimer
            };

            if (isBossStage(stage)) {
                profile = {
                    hp: Math.floor(profile.hp * 1.45),
                    damage: profile.damage + 8,
                    idleTimer: Math.max(90, profile.idleTimer - 35),
                    preparingTimer: basePreparingTimer,
                    holdTimer: baseHoldTimer,
                    attackTimer: baseAttackTimer
                };
            }

            if (isWorldBossStage(stage)) {
                profile = {
                    hp: Math.floor(profile.hp * 1.75),
                    damage: profile.damage + 10,
                    idleTimer: Math.max(75, profile.idleTimer - 18),
                    preparingTimer: basePreparingTimer,
                    holdTimer: baseHoldTimer,
                    attackTimer: baseAttackTimer
                };
            }

            if (isFinalBossStage(stage)) {
                profile = {
                    hp: Math.max(Math.floor(profile.hp * 6), 5000),
                    damage: profile.damage + 14,
                    idleTimer: Math.max(60, profile.idleTimer - 45),
                    preparingTimer: Math.max(35, basePreparingTimer - 10),
                    holdTimer: Math.max(45, baseHoldTimer - 8),
                    attackTimer: Math.max(20, baseAttackTimer - 5)
                };
            }

            return profile;
        }

        const state = {
            mode: 'INTRO', 
            stage: 1,
            gold: 0,
            shake: 0,
            timeScale: 1,
            cameraZoom: 1,
            cameraTargetZoom: 1,
            cameraFocusX: canvas.width / 2,
            cameraFocusY: canvas.height / 2,
            cameraTargetFocusX: canvas.width / 2,
            cameraTargetFocusY: canvas.height / 2,
            nextStageTimer: 0,
            particles: [],
            afterimages: [],
            attackMarkers: [],
            messageText: '',
            messageTimer: 0,
            messageColor: '#ffffff',
            lobbyNotice: '',
            floatTexts: [],
            tutorial: {
                hasPlayedOnce: false,
                hasTriggeredFirstAttackCue: false,
                isCinematicActive: false,
                phase: 'OFF',
                slowFrames: 0,
                hasCompletedFirstDodge: false,
                attackHintShown: false,
                attackedSinceTutorialEnd: false,
                attackHintFrames: 0
            },
            finalBossHeartMode: false,
            finalBossMagicTimer: 0
        };

        const player = {
            originX: 150,
            originY: 300,
            x: 150, y: 300,
            hp: 100, maxHp: 100,
            def: 0,
            atk: 25, 
            hpLevel: 0,
            atkLevel: 0,
            defLevel: 0,
            status: 'IDLE',
            timer: 0,
            maxAttackTimer: 40,
            maxDodgeTimer: 40,
            dodgeCooldown: 0, 
            maxDodgeCooldown: 60, 
            isDodging: false
        };

        const enemy = {
            originX: 650,
            originY: 300,
            x: 650, y: 300,
            hp: 100, maxHp: 100,
            attackPower: 20,
            status: 'IDLE',
            attackDir: 'MID', 
            waveOffset: 0,
            waveCycles: 0,
            orbitCycles: 0,
            timer: 0,
            maxPreparingTimer: 45, 
            preparingDuration: 45,
            maxHoldTimer: 55,      
            idleTimer: 300, 
            idleResetTimer: 300,
            maxAttackTimer: 25,    
            maxReturnTimer: 36,
            hasDealtDamage: false,
            prepX: 650,
            prepY: 300,
            returnStartX: 650,
            returnStartY: 300,
            hitFlash: 0
        };

        function getStageLabel(stageNumber = state.stage) {
            return `${stageNumber}`;
        }

        function getFinalStageLabel() {
            return `STAGE ${GAME_CONFIG.TOTAL_STAGES}`;
        }

        function isBossStage(stageNumber = state.stage) {
            return stageNumber % GAME_CONFIG.MONSTERS_PER_STAGE === 0;
        }

        function isWorldBossStage(stageNumber = state.stage) {
            return stageNumber % GAME_CONFIG.STAGES_PER_WORLD === 0;
        }

        function isFinalBossStage(stageNumber = state.stage) {
            return stageNumber === GAME_CONFIG.TOTAL_STAGES;
        }

        function getAttackPatternsForStage(stageNumber = state.stage) {
            if (isFinalBossStage(stageNumber)) {
                return ['LONG', 'LONG', 'AIR_ORBIT_SWEEP', 'AIR_DIVE', 'GROUND_UPPER', 'AIR_STRAIGHT'];
            }

            if (isWorldBossStage(stageNumber)) {
                return ['LONG', 'LONG', 'AIR_ORBIT_SWEEP', 'AIR_DIVE', 'GROUND_UPPER', 'AIR_STRAIGHT', 'MID_WAVE'];
            }

            if (isBossStage(stageNumber)) {
                return ['LONG', 'AIR_STRAIGHT', 'GROUND_UPPER', 'AIR_DIVE', 'MID_WAVE'];
            }

            if (stageNumber === 1) return ['MID'];
            if (stageNumber === 2) return ['MID', 'GROUND_STRAIGHT'];
            if (stageNumber === 3) return ['MID', 'MID_WAVE', 'AIR_STRAIGHT'];
            if (stageNumber === 4) return ['AIR_STRAIGHT', 'GROUND_STRAIGHT', 'MID_WAVE'];
            if (stageNumber === 6) return ['AIR_STRAIGHT', 'GROUND_STRAIGHT', 'MID_WAVE', 'AIR_DIVE'];
            if (stageNumber === 7) return ['AIR_STRAIGHT', 'GROUND_STRAIGHT', 'MID_WAVE', 'AIR_DIVE', 'GROUND_UPPER'];
            if (stageNumber === 8) return ['AIR_DIVE', 'GROUND_UPPER', 'LONG', 'MID_WAVE', 'AIR_STRAIGHT'];
            if (stageNumber === 9) return ['AIR_DIVE', 'GROUND_UPPER', 'LONG', 'AIR_ORBIT_SWEEP', 'MID_WAVE'];

            if (stageNumber >= 11 && stageNumber <= 14) {
                return ['LONG', 'AIR_ORBIT_SWEEP', 'AIR_DIVE', 'GROUND_UPPER', 'AIR_STRAIGHT', 'GROUND_STRAIGHT', 'MID_WAVE'];
            }

            return ['MID_WAVE', 'AIR_STRAIGHT', 'AIR_DIVE', 'GROUND_STRAIGHT', 'GROUND_UPPER', 'LONG', 'AIR_ORBIT_SWEEP'];
        }

        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            getAudioContext();
            const key = e.key;

            if (state.mode === 'INTRO') {
                if (key === ' ' || key === 'Spacebar' || e.code === 'Space') {
                    enterLobby();
                }
                return;
            }

            if (key === 'Escape' || e.code === 'Escape') {
                if (state.mode === 'PLAY') {
                    openPauseMenu();
                    return;
                }
                if (state.mode === 'PAUSED') {
                    resumeFromPause();
                    return;
                }
            }

            // Temporary debug shortcut for balance testing.
            if (key === 'p' || key === 'P') {
                state.gold += 10000;
                showMessage('+10000 GOLD (TEST)', PALETTE.HIT_GOLD, 90);
                if (state.mode === 'LOBBY') updateLobbyOverlay();
                return;
            }

            // Debug shortcut: jump directly to the final stage.
            if (key === 'o' || key === 'O') {
                const finalStage = GAME_CONFIG.TOTAL_STAGES;
                if (state.mode === 'PLAY') {
                    state.stage = finalStage;
                    state.nextStageTimer = 0;
                    resetEnemy();
                    showMessage(`JUMP TO STAGE ${getStageLabel(finalStage)}`, PALETTE.HIT_GOLD, 90);
                } else {
                    startGame(finalStage);
                }
                return;
            }

            // Debug shortcut: jump directly to stage 1-5.
            if (key === 'i' || key === 'I') {
                if (state.mode === 'PLAY') {
                    state.stage = 5;
                    state.nextStageTimer = 0;
                    resetEnemy();
                    showMessage(`JUMP TO STAGE ${getStageLabel(5)}`, PALETTE.HIT_GOLD, 90);
                } else {
                    startGame(5);
                }
                return;
            }

            if (state.mode === 'LOBBY') {
                // Keyboard navigation for lobby: ArrowLeft/Right to move between upgrades,
                // ArrowDown to go to START, ArrowUp to go back to cards. Space to select.
                const k = (e.key || '').toString().toLowerCase();
                const navLeft = (k === 'arrowleft' || k === 'left' || (e.code || '').toString().toLowerCase() === 'arrowleft' || e.keyCode === 37);
                const navRight = (k === 'arrowright' || k === 'right' || (e.code || '').toString().toLowerCase() === 'arrowright' || e.keyCode === 39);
                const navUp = (key === 'ArrowUp' || e.code === 'ArrowUp');
                const navDown = (key === 'ArrowDown' || e.code === 'ArrowDown');

                const oldSelection = lobbySelection;

                if (navLeft) {
                    if (lobbySelection === 3) {
                        if (!isStatMaxed(2)) lobbySelection = 2;
                        else if (!isStatMaxed(1)) lobbySelection = 1;
                        else if (!isStatMaxed(0)) lobbySelection = 0;
                    } else {
                        let nextSel = lobbySelection;
                        for (let i = 0; i < 3; i++) {
                            nextSel = (nextSel + 2) % 3;
                            if (!isStatMaxed(nextSel)) {
                                lobbySelection = nextSel;
                                break;
                            }
                        }
                        if (isStatMaxed(lobbySelection)) lobbySelection = 3;
                    }
                    if (oldSelection !== lobbySelection) playTickSfx();
                    updateLobbySelection();
                    return;
                }
                if (navRight) {
                    if (lobbySelection === 3) {
                        if (!isStatMaxed(0)) lobbySelection = 0;
                        else if (!isStatMaxed(1)) lobbySelection = 1;
                        else if (!isStatMaxed(2)) lobbySelection = 2;
                    } else {
                        let nextSel = lobbySelection;
                        for (let i = 0; i < 3; i++) {
                            nextSel = (nextSel + 1) % 3;
                            if (!isStatMaxed(nextSel)) {
                                lobbySelection = nextSel;
                                break;
                            }
                        }
                        if (isStatMaxed(lobbySelection)) lobbySelection = 3;
                    }
                    if (oldSelection !== lobbySelection) playTickSfx();
                    updateLobbySelection();
                    return;
                }
                if (navDown) {
                    lobbySelection = 3;
                    if (oldSelection !== lobbySelection) playTickSfx();
                    updateLobbySelection();
                    return;
                }
                if (navUp) {
                    if (lobbySelection === 3) {
                        if (!isStatMaxed(1)) lobbySelection = 1;
                        else if (!isStatMaxed(0)) lobbySelection = 0;
                        else if (!isStatMaxed(2)) lobbySelection = 2;
                        if (oldSelection !== lobbySelection) playTickSfx();
                        updateLobbySelection();
                    }
                    return;
                }

                // Number shortcuts removed: 1/2/3 no longer trigger upgrades.

                // Quick start
                if (key === 'o' || key === 'O' || e.code === 'KeyO') { startGame(10); return; }

                if (key === ' ' || key === 'Spacebar' || e.code === 'Space') {
                    // If on START, start the game. If on a stat card, activate that upgrade.
                    if (lobbySelection === 3) {
                        startGame();
                    } else {
                        if (lobbySelection === 0) tryUpgrade('atk');
                        else if (lobbySelection === 1) tryUpgrade('hp');
                        else if (lobbySelection === 2) tryUpgrade('def');
                        updateLobbySelection();
                    }
                    return;
                }
                return;
            }
            if (state.mode === 'GAMEOVER' || state.mode === 'CLEAR') {
                if (key === ' ' || key === 'Spacebar' || e.code === 'Space') enterLobby();
                return;
            }
            if (state.mode === 'PAUSED') {
                const navUp = (key === 'ArrowUp' || e.code === 'ArrowUp');
                const navDown = (key === 'ArrowDown' || e.code === 'ArrowDown');

                if (navUp || navDown) {
                    const oldSelection = pauseSelection;
                    pauseSelection = pauseSelection === 0 ? 1 : 0;
                    if (oldSelection !== pauseSelection) playTickSfx();
                    updatePauseSelection();
                    return;
                }

                if (key === ' ' || key === 'Spacebar' || e.code === 'Space' || key === 'Enter' || e.code === 'Enter') {
                    if (pauseSelection === 0) resumeFromPause();
                    else returnToLobbyFromPause();
                    return;
                }
                return;
            }
            if (state.mode === 'PLAY') {
                if (state.finalBossMagicTimer > 0) return;
                if (player.status !== 'IDLE') return;

                const isArrowInput = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key);
                const isStage1BeforeTutorialFreeze = (
                    state.stage === 1 &&
                    (!state.tutorial.hasTriggeredFirstAttackCue ||
                     (state.tutorial.isCinematicActive && state.tutorial.phase !== 'FROZEN'))
                );
                if (isStage1BeforeTutorialFreeze && isArrowInput) {
                    return;
                }

                if (state.stage === 1 && !state.tutorial.hasCompletedFirstDodge && key === 'ArrowRight') {
                    return;
                }

                if (state.tutorial.isCinematicActive && key === 'ArrowRight') {
                    return;
                }

                const isStage1PreHitLock = (
                    state.stage === 1 &&
                    enemy.status === 'ATTACKING' &&
                    ((enemy.maxAttackTimer - enemy.timer) / enemy.maxAttackTimer) >= 0.25
                );
                if (isStage1PreHitLock && key === 'ArrowRight') {
                    return;
                }

                if (key === 'ArrowRight') {
                    if (state.stage === 1 && state.tutorial.hasCompletedFirstDodge) {
                        state.tutorial.attackedSinceTutorialEnd = true;
                        state.tutorial.attackHintShown = true;
                        state.tutorial.attackHintFrames = 0;
                        attackPromptEl.style.display = 'none';
                    }
                    player.status = 'ATTACK';
                    player.timer = player.maxAttackTimer;
                    setTimeout(() => checkHit(), 100); 
                } else if (['ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key)) {
                    if (player.dodgeCooldown > 0) return;
                    if (key === 'ArrowLeft') player.status = 'DODGE_BACK';
                    else if (key === 'ArrowUp') player.status = 'DODGE_UP';
                    else if (key === 'ArrowDown') player.status = 'DODGE_DOWN';
                    player.timer = player.maxDodgeTimer;
                    player.isDodging = true;
                    player.dodgeCooldown = player.maxDodgeCooldown;
                    if (state.tutorial.isCinematicActive) releaseDodgeTutorialCue();
                }
            }
        });

        function startGame(startStage = 1) {
            const targetStage = Math.max(1, Math.min(GAME_CONFIG.TOTAL_STAGES, startStage));
            const showTutorialThisRun = targetStage === 1 && !state.tutorial.hasPlayedOnce;
            state.tutorial.hasPlayedOnce = true;

            state.mode = 'PLAY';
            state.stage = targetStage;
            state.timeScale = 1;
            state.cameraZoom = 1;
            state.cameraTargetZoom = 1;
            state.cameraFocusX = canvas.width / 2;
            state.cameraFocusY = canvas.height / 2;
            state.cameraTargetFocusX = canvas.width / 2;
            state.cameraTargetFocusY = canvas.height / 2;
            state.particles = [];
            state.afterimages = [];
            state.attackMarkers = [];
            state.floatTexts = [];
            state.messageText = '';
            state.messageTimer = 0;
            state.messageColor = '#ffffff';
            state.lobbyNotice = '';
            state.tutorial.hasTriggeredFirstAttackCue = !showTutorialThisRun;
            state.tutorial.isCinematicActive = false;
            state.tutorial.phase = 'OFF';
            state.tutorial.slowFrames = 0;
            state.tutorial.hasCompletedFirstDodge = !showTutorialThisRun;
            state.tutorial.attackHintShown = !showTutorialThisRun;
            state.tutorial.attackedSinceTutorialEnd = false;
            state.tutorial.attackHintFrames = 0;
            dodgePromptEl.style.display = 'none';
            attackPromptEl.style.display = 'none';
            player.hp = player.maxHp;
            player.dodgeCooldown = 0;
            player.x = player.originX;
            player.y = player.originY;
            resetEnemy();
            enemy.idleTimer = 1;
            document.getElementById('main-title').innerText = "TIMING SLIME";
            setSubTitle("PRESS SPACE TO START", true);
            battleScreenEl.style.display = 'block';
            lobbyScreenEl.style.display = 'none';
            pausePanelEl.style.display = 'none';
            introPanelEl.style.display = 'none';
            overlay.style.display = 'none';
            requestAnimationFrame(gameLoop);
        }

        function jumpToFinalStage() {
            if (state.mode !== 'PLAY') {
                startGame();
            }

            state.stage = GAME_CONFIG.TOTAL_STAGES;
            state.timeScale = 1;
            state.cameraTargetZoom = 1;
            state.cameraTargetFocusX = canvas.width / 2;
            state.cameraTargetFocusY = canvas.height / 2;
            state.particles = [];
            state.afterimages = [];
            state.attackMarkers = [];
            state.floatTexts = [];
            state.messageTimer = 0;

            state.tutorial.hasPlayedOnce = true;
            state.tutorial.hasTriggeredFirstAttackCue = true;
            state.tutorial.isCinematicActive = false;
            state.tutorial.phase = 'OFF';
            state.tutorial.slowFrames = 0;
            state.tutorial.hasCompletedFirstDodge = true;
            state.tutorial.attackHintShown = true;
            state.tutorial.attackedSinceTutorialEnd = false;
            state.tutorial.attackHintFrames = 0;

            player.status = 'IDLE';
            player.timer = 0;
            player.isDodging = false;
            player.dodgeCooldown = 0;
            player.x = player.originX;
            player.y = player.originY;
            player.hp = player.maxHp;

            dodgePromptEl.style.display = 'none';
            attackPromptEl.style.display = 'none';

            resetEnemy();
            enemy.idleTimer = 1;
            showMessage(`JUMP TO STAGE ${getStageLabel()}`, PALETTE.HIT_GOLD, 90);
        }

        function updateLobbyOverlay() {
            const hpCost = player.hpLevel >= UPGRADE_CONFIG.hp.maxLevel ? 'MAX' : `${getUpgradeCost('hp')}G`;
            const atkCost = player.atkLevel >= UPGRADE_CONFIG.atk.maxLevel ? 'MAX' : `${getUpgradeCost('atk')}G`;
            const defCost = player.defLevel >= UPGRADE_CONFIG.def.maxLevel ? 'MAX' : `${getUpgradeCost('def')}G`;

            lobbyGoldLineEl.innerText = `GOLD: ${state.gold}`;
            lobbyStatLineEl.innerText = `HP ${player.maxHp} | ATK ${player.atk} | DEF ${player.def}`;
            lobbyNoticeLineEl.innerText = state.lobbyNotice;

            hpCardStatEl.innerHTML = `LV ${player.hpLevel}<br><span style="color:#2b3d1f; font-size: 7px;">(+${UPGRADE_CONFIG.hp.amount} HP)</span>`;
            atkCardStatEl.innerHTML = `LV ${player.atkLevel}<br><span style="color:#2b3d1f; font-size: 7px;">(+${UPGRADE_CONFIG.atk.amount} ATK)</span>`;
            defCardStatEl.innerHTML = `LV ${player.defLevel}<br><span style="color:#2b3d1f; font-size: 7px;">(+${UPGRADE_CONFIG.def.amount} DEF)</span>`;

            upgradeHpBtnEl.innerText = player.hpLevel >= UPGRADE_CONFIG.hp.maxLevel ? 'MAX LEVEL' : `UPGRADE [${hpCost}]`;
            upgradeAtkBtnEl.innerText = player.atkLevel >= UPGRADE_CONFIG.atk.maxLevel ? 'MAX LEVEL' : `UPGRADE [${atkCost}]`;
            upgradeDefBtnEl.innerText = player.defLevel >= UPGRADE_CONFIG.def.maxLevel ? 'MAX LEVEL' : `UPGRADE [${defCost}]`;

            upgradeHpBtnEl.disabled = player.hpLevel >= UPGRADE_CONFIG.hp.maxLevel;
            upgradeAtkBtnEl.disabled = player.atkLevel >= UPGRADE_CONFIG.atk.maxLevel;
            upgradeDefBtnEl.disabled = player.defLevel >= UPGRADE_CONFIG.def.maxLevel;
        }

        function enterLobby() {
            state.mode = 'LOBBY';
            attackPromptEl.style.display = 'none';
            dodgePromptEl.style.display = 'none';
            state.timeScale = 1;
            state.cameraTargetZoom = 1;
            state.cameraTargetFocusX = canvas.width / 2;
            state.cameraTargetFocusY = canvas.height / 2;
            state.floatTexts = [];
            battleScreenEl.style.display = 'none';
            lobbyScreenEl.style.display = 'block';
            pausePanelEl.style.display = 'none';
            introPanelEl.style.display = 'none';
            overlay.style.display = 'none';
            updateLobbyOverlay();
            // Initialize selection and ensure lobby icons are redrawn using uploaded images when entering lobby
            try { 
                lobbySelection = 0; 
                if (isStatMaxed(0)) {
                    if (!isStatMaxed(1)) lobbySelection = 1;
                    else if (!isStatMaxed(2)) lobbySelection = 2;
                    else lobbySelection = 3;
                }
                
                const frame = document.getElementById('lobbySelectionFrame');
                if (frame) {
                    frame.classList.add('no-transition');
                }
                updateLobbySelection(); 
                if (frame) {
                    void frame.offsetWidth; // Force reflow
                    frame.classList.remove('no-transition');
                }
                renderLobbyIcons(); 
            } catch (e) {}
        }

        function enterIntro() {
            state.mode = 'INTRO';
            document.getElementById('main-title').innerText = 'TIMING SLIME';
            setSubTitle('PRESS SPACE TO START', true);
            dodgePromptEl.style.display = 'none';
            attackPromptEl.style.display = 'none';
            battleScreenEl.style.display = 'block';
            lobbyScreenEl.style.display = 'none';
            pausePanelEl.style.display = 'none';
            introPanelEl.style.display = 'block';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.72)';
            overlay.style.display = 'flex';
        }

        function openPauseMenu() {
            if (state.mode !== 'PLAY') return;
            state.mode = 'PAUSED';
            battleScreenEl.style.display = 'block';
            lobbyScreenEl.style.display = 'none';
            introPanelEl.style.display = 'none';
            pausePanelEl.style.display = 'block';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.58)';
            overlay.style.display = 'flex';
            // initialize pause selection
            pauseSelection = 0;
            try { 
                const frame = document.getElementById('pauseSelectionFrame');
                if (frame) frame.classList.add('no-transition');
                updatePauseSelection(); 
                if (frame) {
                    void frame.offsetWidth;
                    frame.classList.remove('no-transition');
                }
            } catch (e) {}
        }

        function resumeFromPause() {
            if (state.mode !== 'PAUSED') return;
            state.mode = 'PLAY';
            pausePanelEl.style.display = 'none';
            overlay.style.display = 'none';
            requestAnimationFrame(gameLoop);
        }

        function returnToLobbyFromPause() {
            if (state.mode !== 'PAUSED') return;
            pausePanelEl.style.display = 'none';
            overlay.style.display = 'none';
            enterLobby();
        }

        function resetEnemy() {
            const profile = getEnemyProfile(state.stage);
            enemy.maxHp = profile.hp;
            enemy.hp = enemy.maxHp;
            enemy.attackPower = profile.damage;
            enemy.status = 'IDLE';
            enemy.timer = 0;
            enemy.maxPreparingTimer = profile.preparingTimer;
            enemy.preparingDuration = enemy.maxPreparingTimer;
            enemy.maxHoldTimer = profile.holdTimer;
            enemy.maxAttackTimer = profile.attackTimer;
            enemy.maxReturnTimer = Math.round(profile.attackTimer * 1.45);
            enemy.idleResetTimer = profile.idleTimer;
            enemy.idleTimer = enemy.idleResetTimer;
            enemy.x = enemy.originX;
            enemy.y = enemy.originY;
            enemy.waveOffset = 0;
            enemy.waveCycles = 0;
            enemy.orbitCycles = 0;
            enemy.hasDealtDamage = false;
            enemy.hitFlash = 0;
            enemy.returnStartX = enemy.originX;
            enemy.returnStartY = enemy.originY;
            state.nextStageTimer = 0;
            state.finalBossHeartMode = isFinalBossStage();
            state.finalBossMagicTimer = state.finalBossHeartMode ? 90 : 0;

            if (state.finalBossHeartMode) {
                state.messageText = 'FINAL BOSS MAGIC! HP -> HEARTS';
                state.messageColor = '#ffffff';
                state.messageTimer = 90;
                createBurst(player.x, player.y - 40, '#e74c3c');
            }

            if (state.stage !== 1) {
                state.tutorial.hasTriggeredFirstAttackCue = true;
                state.tutorial.isCinematicActive = false;
                state.tutorial.phase = 'OFF';
                state.tutorial.slowFrames = 0;
                state.tutorial.hasCompletedFirstDodge = true;
                state.tutorial.attackHintShown = true;
                state.tutorial.attackedSinceTutorialEnd = false;
                state.tutorial.attackHintFrames = 0;
                state.timeScale = 1;
                state.cameraTargetZoom = 1;
                state.cameraTargetFocusX = canvas.width / 2;
                state.cameraTargetFocusY = canvas.height / 2;
                dodgePromptEl.style.display = 'none';
                attackPromptEl.style.display = 'none';
            }
        }

        function triggerDodgeTutorialCue() {
            state.tutorial.hasTriggeredFirstAttackCue = true;
            state.tutorial.isCinematicActive = true;
            state.tutorial.phase = 'SLOW';
            state.tutorial.slowFrames = 8;
            state.timeScale = 0.03;
            state.cameraTargetZoom = 1;
            state.cameraTargetFocusX = canvas.width / 2;
            state.cameraTargetFocusY = canvas.height / 2;
            dodgePromptEl.style.display = 'block';
        }

        function releaseDodgeTutorialCue() {
            state.tutorial.isCinematicActive = false;
            state.tutorial.phase = 'OFF';
            state.tutorial.slowFrames = 0;
            state.tutorial.hasCompletedFirstDodge = true;
            state.tutorial.attackHintShown = false;
            state.tutorial.attackedSinceTutorialEnd = false;
            state.tutorial.attackHintFrames = 0;
            state.timeScale = 1;
            state.cameraTargetZoom = 1;
            state.cameraTargetFocusX = canvas.width / 2;
            state.cameraTargetFocusY = canvas.height / 2;
            dodgePromptEl.style.display = 'none';

            // After tutorial dodge input, move quickly into the actual strike so the dodge feels meaningful.
            if (state.stage === 1) {
                if (enemy.status === 'PREPARING') {
                    enemy.status = 'HOLD';
                    enemy.x = enemy.prepX;
                    enemy.y = enemy.prepY;
                    enemy.timer = 8;
                } else if (enemy.status === 'HOLD') {
                    enemy.timer = Math.min(enemy.timer, 8);
                }
            }
        }
function getUpgradeCost(type) {
            const cfg = UPGRADE_CONFIG[type];
            const level = player[`${type}Level`];
            return cfg.baseCost + (level * cfg.costGrowth);
        }

        function showMessage(text, color = '#ffffff', duration = 80) {
            state.messageText = text;
            state.messageColor = color;
            state.messageTimer = duration;
        }

        function emphasizeInsufficientGoldNotice() {
            if (!lobbyNoticeLineEl) return;
            lobbyNoticeLineEl.classList.remove('notice-bounce');
            void lobbyNoticeLineEl.offsetWidth;
            lobbyNoticeLineEl.classList.add('notice-bounce');
            if (lobbyNoticeAnimTimer) clearTimeout(lobbyNoticeAnimTimer);
            lobbyNoticeAnimTimer = setTimeout(() => {
                lobbyNoticeLineEl.classList.remove('notice-bounce');
            }, 380);
        }

        function emphasizeUpgradedStat(type) {
            let targetEl = null;
            if (type === 'hp') targetEl = hpCardStatEl;
            else if (type === 'atk') targetEl = atkCardStatEl;
            else if (type === 'def') targetEl = defCardStatEl;
            if (!targetEl) return;

            targetEl.classList.remove('stat-bounce');
            void targetEl.offsetWidth;
            targetEl.classList.add('stat-bounce');
            if (lobbyStatAnimTimer) clearTimeout(lobbyStatAnimTimer);
            lobbyStatAnimTimer = setTimeout(() => {
                targetEl.classList.remove('stat-bounce');
            }, 380);
        }

        function tryUpgrade(type) {
            const cfg = UPGRADE_CONFIG[type];
            const levelKey = `${type}Level`;
            if (player[levelKey] >= cfg.maxLevel) {
                state.lobbyNotice = `${cfg.label} upgrade maxed`;
                showMessage(`${cfg.label} upgrade maxed`, '#f1c40f', 70);
                playInsufficientGoldSfx();
                if (state.mode === 'LOBBY') {
                    updateLobbyOverlay();
                    emphasizeInsufficientGoldNotice();
                }
                return;
            }

            const cost = getUpgradeCost(type);
            if (state.gold < cost) {
                state.lobbyNotice = `Not enough gold (${cost}G needed)`;
                showMessage(`Not enough gold (${cost}G needed)`, '#e74c3c', 70);
                playInsufficientGoldSfx();
                if (state.mode === 'LOBBY') {
                    updateLobbyOverlay();
                    emphasizeInsufficientGoldNotice();
                }
                return;
            }

            state.gold -= cost;
            player[levelKey] += 1;
            playUpgradeSfx();

            if (type === 'hp') {
                player.maxHp += cfg.amount;
                player.hp = Math.min(player.maxHp, player.hp + cfg.amount);
            } else if (type === 'atk') {
                player.atk += cfg.amount;
            } else if (type === 'def') {
                player.def += cfg.amount;
            }

            state.lobbyNotice = '';
            if (state.mode === 'LOBBY') {
                if (player[levelKey] >= cfg.maxLevel) {
                    let maxedIndex = (type === 'atk') ? 0 : (type === 'hp') ? 1 : 2;
                    if (lobbySelection === maxedIndex) {
                        let nextSel = lobbySelection;
                        for (let i = 0; i < 3; i++) {
                            nextSel = (nextSel + 1) % 3;
                            if (!isStatMaxed(nextSel)) {
                                lobbySelection = nextSel;
                                break;
                            }
                        }
                        if (isStatMaxed(lobbySelection)) lobbySelection = 3;
                        updateLobbySelection();
                    }
                }
                updateLobbyOverlay();
                emphasizeUpgradedStat(type);
            }
        }
function checkHit() {
            if (enemy.hp <= 0) return;
            if (state.finalBossMagicTimer > 0) return;
            if (enemy.status === 'PREPARING' || enemy.status === 'HOLD') return;
            playHitSfx();
            const rawDamage = player.atk;
            const appliedDamage = isFinalBossStage()
                ? Math.min(rawDamage, Math.max(1, Math.floor(enemy.maxHp * 0.08)))
                : rawDamage;
            enemy.hp -= appliedDamage;
            createFloatingText(`${appliedDamage}`, enemy.x - 8 + (Math.random() * 16), enemy.y - 92, '#ffffff', 38, {
                vx: -0.08 + (Math.random() * 0.16),
                vy: -0.42,
                gravity: 0.012,
                noMove: false,
                size: 10,
                align: 'center',
                weight: 'normal',
                noStroke: false,
                pop: true,
                strokeColor: PALETTE.DARK
            });
            state.shake = 15;
            enemy.hitFlash = 10;
            createHitEffect(enemy.x - 10, enemy.y - 45);
            if (enemy.hp <= 0) {
                enemy.hp = 0;
                playMonsterKillSfx();
                const reward = 26 + (state.stage * 18);
                state.gold += reward;
                createFloatingText(`+${reward}`, 78, 84, PALETTE.HIT_GOLD, 42, {
                    vy: 0,
                    noMove: true,
                    size: 10,
                    align: 'center',
                    weight: 'normal',
                    noStroke: true
                });
                state.nextStageTimer = 60; 
            }
        }

        function gameLoop() {
            if (state.mode !== 'PLAY') return;
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        function update() {
            if (state.tutorial.isCinematicActive && state.tutorial.phase === 'SLOW') {
                state.tutorial.slowFrames--;
                if (state.tutorial.slowFrames <= 0) {
                    state.tutorial.phase = 'FROZEN';
                    state.timeScale = 0;
                }
            }

            if (state.finalBossMagicTimer > 0) {
                player.status = 'IDLE';
                player.timer = 0;
                player.isDodging = false;
                player.dodgeCooldown = 0;
                player.x = player.originX;
                player.y = player.originY;
                state.finalBossMagicTimer--;
                if (state.messageTimer > 0) state.messageTimer = Math.max(0, state.messageTimer - 1);
                if (state.finalBossMagicTimer === 0) {
                    state.messageText = 'BATTLE START!';
                    state.messageColor = '#f1c40f';
                    state.messageTimer = 60;
                }
                return;
            }

            const dt = state.timeScale;
            if (player.dodgeCooldown > 0) player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
            if (enemy.dodgeCooldown > 0) enemy.dodgeCooldown = Math.max(0, enemy.dodgeCooldown - dt);
            if (enemy.hitFlash > 0) enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
            if (state.messageTimer > 0) state.messageTimer = Math.max(0, state.messageTimer - dt);

            for (let i = state.floatTexts.length - 1; i >= 0; i--) {
                const text = state.floatTexts[i];
                text.life -= dt;
                if (!text.noMove) {
                    text.x += text.vx * dt;
                    text.y += text.vy * dt;
                    text.vy += text.gravity * dt;
                }
                if (text.life <= 0) state.floatTexts.splice(i, 1);
            }

            if (
                state.stage === 1 &&
                state.tutorial.hasCompletedFirstDodge &&
                !state.tutorial.attackedSinceTutorialEnd &&
                !state.tutorial.attackHintShown
            ) {
                state.tutorial.attackHintFrames++;
                if (state.tutorial.attackHintFrames >= 300) {
                    state.tutorial.attackHintShown = true;
                    attackPromptEl.style.display = 'block';
                }
            }

            const zoomLerp = state.tutorial.isCinematicActive ? 0.42 : 0.12;
            const focusLerp = state.tutorial.isCinematicActive ? 0.3 : 0.1;
            state.cameraZoom += (state.cameraTargetZoom - state.cameraZoom) * zoomLerp;
            state.cameraFocusX += (state.cameraTargetFocusX - state.cameraFocusX) * focusLerp;
            state.cameraFocusY += (state.cameraTargetFocusY - state.cameraFocusY) * focusLerp;

            const halfViewW = canvas.width / (2 * state.cameraZoom);
            const halfViewH = canvas.height / (2 * state.cameraZoom);
            state.cameraFocusX = Math.max(halfViewW, Math.min(canvas.width - halfViewW, state.cameraFocusX));
            state.cameraFocusY = Math.max(halfViewH, Math.min(canvas.height - halfViewH, state.cameraFocusY));

            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                if (p.isRing) {
                    p.size += 15 * dt;
                    p.life -= 0.1 * dt;
                } else {
                    p.x += p.vx * dt; 
                    p.y += p.vy * dt; 
                    if (p.gravity) p.vy += p.gravity * dt;
                    p.life -= 0.03 * dt;
                }
                if (p.life <= 0) state.particles.splice(i, 1);
            }

            for (let i = state.afterimages.length - 1; i >= 0; i--) {
                const img = state.afterimages[i];
                img.life -= 0.08 * dt;
                if (img.life <= 0) state.afterimages.splice(i, 1);
            }

            for (let i = state.attackMarkers.length - 1; i >= 0; i--) {
                const marker = state.attackMarkers[i];
                marker.alpha -= 0.02 * dt;
                if (marker.alpha <= 0) state.attackMarkers.splice(i, 1);
            }

            if (state.nextStageTimer > 0) {
                state.nextStageTimer -= dt;
                if (state.nextStageTimer <= 0) {
                    if (state.stage >= GAME_CONFIG.TOTAL_STAGES) {
                        gameClear();
                    } else {
                        state.stage++;
                        resetEnemy();
                    }
                }
            }

            if (player.timer > 0) {
                player.timer -= dt;
                if (player.status.startsWith('DODGE') && player.timer % 4 === 0) {
                    addAfterimage(player.x, player.y, player.status);
                }

                if (player.status === 'ATTACK') {
                    const progress = (player.maxAttackTimer - player.timer) / player.maxAttackTimer;
                    const dashDist = enemy.originX - player.originX - 60;
                    player.x = player.originX + Math.sin(progress * Math.PI) * dashDist;
                } else if (player.status === 'DODGE_BACK') {
                    player.x = player.originX - 100;
                } else if (player.status === 'DODGE_UP') {
                    player.y = player.originY - 80;
                } else if (player.status === 'DODGE_DOWN') {
                    player.y = player.originY + 80;
                }

                if (player.timer <= 0) {
                    player.status = 'IDLE';
                    player.isDodging = false;
                    player.x = player.originX;
                    player.y = player.originY;
                }
            }

            if (enemy.hp > 0) {
                if (enemy.status === 'DODGE_RIGHT' || enemy.status === 'DODGE_UP' || enemy.status === 'DODGE_DOWN') {
                    enemy.timer -= dt;
                    const dodgeProgress = 1 - Math.max(0, enemy.timer / enemy.maxDodgeTimer);
                    const leap = Math.sin(Math.min(1, dodgeProgress) * Math.PI);

                    if (enemy.status === 'DODGE_RIGHT') {
                        enemy.x = enemy.originX + (130 * leap);
                        enemy.y = enemy.originY;
                    } else if (enemy.status === 'DODGE_UP') {
                        enemy.x = enemy.originX + (42 * leap);
                        enemy.y = enemy.originY - (100 * leap);
                    } else {
                        enemy.x = enemy.originX + (42 * leap);
                        enemy.y = enemy.originY + (100 * leap);
                    }

                    if (enemy.timer <= 0) {
                        enemy.status = 'IDLE';
                        enemy.x = enemy.originX;
                        enemy.y = enemy.originY;
                        enemy.idleTimer = Math.max(55, Math.round(Math.max(120, 300 - (state.stage * 3)) * 0.45));
                    }
                } else if (enemy.status === 'IDLE') {
                    if (state.nextStageTimer === 0) {
                        enemy.idleTimer -= dt;
                        if (enemy.idleTimer <= 0) {
                            enemy.status = 'PREPARING';
                            enemy.hasDealtDamage = false;

                            const patterns = getAttackPatternsForStage(state.stage);
                            enemy.attackDir = patterns[Math.floor(Math.random() * patterns.length)] || 'MID';

                            if (enemy.attackDir === 'MID_WAVE') {
                                const waveOffsets = [0, -80, 80];
                                enemy.waveOffset = waveOffsets[Math.floor(Math.random() * waveOffsets.length)];
                                enemy.waveCycles = 2;
                                enemy.orbitCycles = 0;
                                enemy.preparingDuration = Math.floor(enemy.maxPreparingTimer * 2.2);
                            } else if (enemy.attackDir === 'AIR_ORBIT_SWEEP') {
                                enemy.waveOffset = 0;
                                enemy.waveCycles = 0;
                                enemy.orbitCycles = Math.random() < 0.5 ? 2 : 3;
                                enemy.preparingDuration = Math.floor(enemy.maxPreparingTimer * 2.0);
                            } else {
                                enemy.waveOffset = 0;
                                enemy.waveCycles = 0;
                                enemy.orbitCycles = 0;
                                enemy.preparingDuration = enemy.maxPreparingTimer;
                            }

                            enemy.timer = enemy.preparingDuration;

                            if (enemy.attackDir === 'AIR_ORBIT_SWEEP') {
                                enemy.prepX = enemy.originX + 70;
                                enemy.prepY = enemy.originY - 30;
                            } else if (enemy.attackDir.startsWith('AIR')) {
                                enemy.prepX = enemy.originX + 70;
                                enemy.prepY = enemy.originY - 120;
                            } else if (enemy.attackDir.startsWith('GROUND')) {
                                enemy.prepX = enemy.originX + 70;
                                enemy.prepY = enemy.originY + 60;
                            } else if (enemy.attackDir === 'MID_WAVE') {
                                enemy.prepX = enemy.originX;
                                enemy.prepY = enemy.originY;
                            } else if (enemy.attackDir === 'LONG') {
                                enemy.prepX = enemy.originX + 70;
                                enemy.prepY = enemy.originY;
                            } else {
                                enemy.prepX = enemy.originX + 70;
                                enemy.prepY = enemy.originY;
                            }
                        }
                    }
                } else if (enemy.status === 'PREPARING') {
                    enemy.timer -= dt;
                    const progress = (enemy.preparingDuration - enemy.timer) / enemy.preparingDuration;
                    if (enemy.attackDir === 'MID_WAVE') {
                        enemy.x = enemy.originX;
                        const wave = Math.sin(progress * Math.PI * 2 * enemy.waveCycles) * 34;
                        enemy.y = enemy.originY + wave;
                    } else if (enemy.attackDir === 'AIR_ORBIT_SWEEP') {
                        const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                        const targetX = enemy.prepX;
                        const targetY = enemy.prepY;
                        const arcHeight = 80;

                        enemy.x = enemy.originX + (targetX - enemy.originX) * eased;
                        enemy.y = enemy.originY + (targetY - enemy.originY) * eased - (Math.sin(eased * Math.PI) * arcHeight);
                    } else {
                        enemy.x = enemy.originX + (enemy.prepX - enemy.originX) * progress;
                        enemy.y = enemy.originY + (enemy.prepY - enemy.originY) * progress;
                    }

                    if (enemy.timer <= 0) {
                        enemy.status = 'HOLD'; 
                        enemy.timer = enemy.maxHoldTimer;
                    }
                } else if (enemy.status === 'HOLD') {
                    enemy.timer -= dt;
                    enemy.x = enemy.prepX;
                    enemy.y = enemy.prepY;

                    if (
                        state.stage === 1 &&
                        !state.tutorial.hasTriggeredFirstAttackCue &&
                        enemy.timer <= 3 &&
                        enemy.timer > 0
                    ) {
                        triggerDodgeTutorialCue();
                    }

                    if (enemy.timer <= 0) {
                        enemy.status = 'ATTACKING';
                        enemy.timer = enemy.maxAttackTimer;
                        
                        if (enemy.attackDir === 'LONG') {
                             state.attackMarkers.push({ x: player.originX, y: player.originY, alpha: 1.0 });
                             state.attackMarkers.push({ x: player.originX - 100, y: player.originY, alpha: 1.0 });
                        } else if (enemy.attackDir === 'MID_WAVE') {
                            state.attackMarkers.push({ x: player.originX, y: player.originY, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX, y: player.originY - 80, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX, y: player.originY + 80, alpha: 1.0 });
                        } else if (enemy.attackDir === 'AIR_ORBIT_SWEEP') {
                            state.attackMarkers.push({ x: player.originX, y: player.originY, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX, y: player.originY - 80, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX, y: player.originY + 80, alpha: 1.0 });
                        } else if (enemy.attackDir === 'AIR_STRAIGHT' || enemy.attackDir === 'GROUND_UPPER') {
                            state.attackMarkers.push({ x: player.originX, y: player.originY, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX, y: player.originY - 80, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX - 100, y: player.originY, alpha: 1.0 });
                        } else if (enemy.attackDir === 'AIR_DIVE' || enemy.attackDir === 'GROUND_STRAIGHT') {
                            state.attackMarkers.push({ x: player.originX, y: player.originY, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX, y: player.originY + 80, alpha: 1.0 });
                            state.attackMarkers.push({ x: player.originX - 100, y: player.originY, alpha: 1.0 });
                        } else {
                            state.attackMarkers.push({ x: player.originX, y: player.originY, alpha: 1.0 });
                        }
                    }
                } else if (enemy.status === 'ATTACKING') {
                    enemy.timer -= dt;
                    const progress = (enemy.maxAttackTimer - enemy.timer) / enemy.maxAttackTimer;
                    const startX = enemy.prepX;
                    const startY = enemy.prepY;
                    let didTriggerTutorialThisFrame = false;
                    
                    let targetX = player.originX - 40;
                    let targetY = player.originY;

                    if (
                        enemy.attackDir === 'LONG' ||
                        enemy.attackDir === 'AIR_STRAIGHT' ||
                        enemy.attackDir === 'AIR_DIVE' ||
                        enemy.attackDir === 'GROUND_STRAIGHT' ||
                        enemy.attackDir === 'GROUND_UPPER'
                    ) targetX = player.originX - 140;

                    if (enemy.attackDir === 'AIR_STRAIGHT') targetY = player.originY - 80;
                    else if (enemy.attackDir === 'AIR_DIVE') targetY = player.originY + 40;
                    else if (enemy.attackDir === 'GROUND_STRAIGHT') targetY = player.originY + 80;
                    else if (enemy.attackDir === 'GROUND_UPPER') targetY = player.originY - 40;
                    else if (enemy.attackDir === 'MID_WAVE') targetY = player.originY;

                    // Attack phase only advances toward the target; returning is handled separately.
                    const movement = Math.sin(Math.min(1, progress / 0.7) * (Math.PI / 2));
                    enemy.x = startX - movement * (startX - targetX);
                    enemy.y = startY - movement * (startY - targetY);

                    if (
                        !didTriggerTutorialThisFrame &&
                        !state.tutorial.isCinematicActive &&
                        !enemy.hasDealtDamage &&
                        progress > 0.4 &&
                        progress < 0.6
                    ) {
                        let dodged = false;
                        
                        // 怨듯넻: ?ㅻ줈 ?뚰뵾(DODGE_BACK)??醫뚯륫源뚯? 而ㅻ쾭?섎뒗 怨듦꺽?먮뒗 ?듯븯吏 ?딆쓬
                        const blocksBackDodge = (
                            enemy.attackDir === 'LONG' ||
                            enemy.attackDir === 'AIR_STRAIGHT' ||
                            enemy.attackDir === 'AIR_DIVE' ||
                            enemy.attackDir === 'GROUND_STRAIGHT' ||
                            enemy.attackDir === 'GROUND_UPPER'
                        );
                        if (player.status === 'DODGE_BACK' && !blocksBackDodge) {
                            dodged = true;
                        } else {
                            // 諛⑺뼢蹂??뱀닔 ?뚰뵾 ?먯젙
                            if (enemy.attackDir === 'LONG') {
                                if (player.status === 'DODGE_UP' || player.status === 'DODGE_DOWN') dodged = true;
                            } else if (enemy.attackDir === 'AIR_STRAIGHT' || enemy.attackDir === 'GROUND_UPPER') {
                                if (player.status === 'DODGE_DOWN') dodged = true;
                            } else if (enemy.attackDir === 'AIR_DIVE' || enemy.attackDir === 'GROUND_STRAIGHT') {
                                if (player.status === 'DODGE_UP') dodged = true;
                            } else if (enemy.attackDir === 'MID') {
                                if (player.status === 'DODGE_UP' || player.status === 'DODGE_DOWN') dodged = true;
                            }
                        }

                        if (!dodged) {
                            const incomingDamage = Math.max(1, enemy.attackPower - player.def);
                            applyPlayerDamage(incomingDamage);
                            state.shake = 20;
                            player.status = 'HIT';
                            player.timer = 15;
                            enemy.hasDealtDamage = true;
                            createBurst(player.x + 20, player.y - 45, '#e74c3c');
                            if (player.hp <= 0) gameOver();
                        } else {
                            enemy.hasDealtDamage = true; 
                            state.shake = 4;
                            createFloatingText('DODGE!', player.x + 10, player.y - 78, '#ffffff', 28, {
                                vy: 0,
                                noMove: true,
                                size: 10,
                                align: 'center',
                                weight: 'normal',
                                noStroke: true
                            });
                        }
                    }

                    if (enemy.timer <= 0) {
                        enemy.returnStartX = enemy.x;
                        enemy.returnStartY = enemy.y;
                        enemy.status = 'RETURNING';
                        enemy.timer = enemy.maxReturnTimer;
                    }
                } else if (enemy.status === 'RETURNING') {
                    enemy.timer -= dt;
                    const returnProgress = 1 - Math.max(0, enemy.timer / enemy.maxReturnTimer);
                    const eased = 1 - Math.pow(1 - returnProgress, 2);
                    enemy.x = enemy.returnStartX + (enemy.originX - enemy.returnStartX) * eased;
                    enemy.y = enemy.returnStartY + (enemy.originY - enemy.returnStartY) * eased;

                    if (enemy.timer <= 0) {
                        enemy.status = 'IDLE';
                        enemy.x = enemy.originX;
                        enemy.y = enemy.originY;
                        enemy.idleTimer = enemy.idleResetTimer;
                    }
                }
            }
            if (state.shake > 0) state.shake *= 0.85;
        }

        function gameOver() {
            state.mode = 'GAMEOVER';
            attackPromptEl.style.display = 'none';
            battleScreenEl.style.display = 'block';
            lobbyScreenEl.style.display = 'none';
            pausePanelEl.style.display = 'none';
            introPanelEl.style.display = 'block';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.92)';
            overlay.style.display = 'flex';
            document.getElementById('main-title').innerText = "GAME OVER";
            setSubTitle(`STAGE ${getStageLabel()} FAILED. PRESS SPACE FOR LOBBY`);
        }

        function gameClear() {
            state.mode = 'CLEAR';
            attackPromptEl.style.display = 'none';
            battleScreenEl.style.display = 'block';
            lobbyScreenEl.style.display = 'none';
            pausePanelEl.style.display = 'none';
            introPanelEl.style.display = 'block';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.92)';
            overlay.style.display = 'flex';
            document.getElementById('main-title').innerText = "STAGE CLEAR!";
            setSubTitle(`ALL ${GAME_CONFIG.TOTAL_STAGES} STAGES CLEARED (${getFinalStageLabel()}) | PRESS SPACE FOR LOBBY`);
        }

        function drawPixelSprite(ctx, x, y, size, status, customAlpha = 1.0) {
            const sprite = status === 'ATTACK' ? extractedPlayerSprites.attack : extractedPlayerSprites.idle;
            ctx.globalAlpha = customAlpha;
            const isCooldown = player.dodgeCooldown > 0 && player.status === 'IDLE';
            ctx.save();
            ctx.imageSmoothingEnabled = false;

            if (sprite) {
                const baseHeight = size * 0.72;
                const scale = baseHeight / sprite.height;
                const drawWidth = sprite.width * scale;
                const drawHeight = sprite.height * scale;
                const drawX = x - drawWidth / 2;
                const drawY = y - drawHeight;
                ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);
            } else {
                const bodySize = size * 0.78;
                const ox = x - bodySize / 2;
                const oy = y - bodySize;
                if (status === 'HIT') ctx.fillStyle = '#ffffff';
                else if (isCooldown) ctx.fillStyle = '#2c3e50';
                else ctx.fillStyle = '#2d7ff9';
                ctx.fillRect(ox, oy, bodySize, bodySize);
                ctx.strokeStyle = '#d6e8ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(ox, oy, bodySize, bodySize);
            }

            if (status === 'HIT') {
                const bodySize = size * 0.78;
                const ox = x - bodySize / 2;
                const oy = y - bodySize;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.fillRect(ox, oy, bodySize, bodySize);
            }

            ctx.restore();
            ctx.globalAlpha = 1.0;
        }

        function drawAttackX(x, y, alpha = 1.0) {
            const size = 60; 
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = PALETTE.DANGER;
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - size/2, y - size); ctx.lineTo(x + size/2, y - size + size);
            ctx.moveTo(x + size/2, y - size); ctx.lineTo(x - size/2, y - size + size);
            ctx.stroke();
            ctx.restore();
        }

        function drawArrow(x, y, dir, timer, isHold) {
            ctx.save();
            ctx.translate(x, y);
            if (isHold || (timer < 20 && Math.floor(Date.now() / 80) % 2 === 0)) {
                ctx.strokeStyle = 'white'; ctx.fillStyle = 'white';
            } else {
                ctx.strokeStyle = PALETTE.DANGER; ctx.fillStyle = PALETTE.DANGER;
            }
            ctx.lineWidth = 6;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            
            let angle = 0;
            if (dir === 'AIR_DIVE') angle = Math.PI * 0.75; 
            else if (dir === 'GROUND_UPPER') angle = -Math.PI * 0.75; 
            else angle = Math.PI; 

            ctx.rotate(angle);
            
            if (dir === 'LONG') {
                for (let yOffset of [-20, 20]) {
                    ctx.save();
                    ctx.translate(0, yOffset);
                    ctx.beginPath();
                    ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
                    ctx.moveTo(5, -15); ctx.lineTo(20, 0); ctx.lineTo(5, 15);
                    ctx.stroke();
                    ctx.restore();
                }
            } else {
                ctx.beginPath();
                ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
                ctx.moveTo(5, -15); ctx.lineTo(20, 0); ctx.lineTo(5, 15);
                ctx.stroke();
            }
            ctx.restore();
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(state.cameraZoom, state.cameraZoom);
            ctx.translate(-state.cameraFocusX, -state.cameraFocusY);
            if (state.shake > 0.5) ctx.translate(Math.random() * state.shake - state.shake/2, Math.random() * state.shake - state.shake/2);
            ctx.fillStyle = PALETTE.DARK; ctx.fillRect(0, 300, canvas.width, 100);
            ctx.fillStyle = PALETTE.DARK;
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'start';
            ctx.fillText(`GOLD ${state.gold}`, 20, 95);
            if (state.finalBossHeartMode) {
                if (state.finalBossMagicTimer > 0) {
                    drawFinalBossMagicEffect(20, 28, state.finalBossMagicTimer);
                    drawBar(20, 30, 180, 12, player.hp / player.maxHp, '#2ecc71', 'PLAYER HP');
                    drawFinalBossHeartSplitEffect(20, 30, state.finalBossMagicTimer);
                } else {
                    drawHeartHud(20, 30, getPlayerHeartCount());
                }
            } else {
                drawBar(20, 30, 180, 12, player.hp / player.maxHp, '#2ecc71', 'PLAYER HP');
            }
            if (player.dodgeCooldown > 0) drawBar(20, 70, 60, 6, 1 - (player.dodgeCooldown / player.maxDodgeCooldown), '#9b59b6', 'DODGE');
            const enemyHpLabel = isBossStage() ? 'BOSS HP' : 'MONSTER HP';
            if (enemy.hp > 0 || state.nextStageTimer > 0) drawBar(canvas.width - 200, 30, 180, 12, enemy.hp / enemy.maxHp, '#e74c3c', enemyHpLabel);
            state.afterimages.forEach(img => drawPixelSprite(ctx, img.x, img.y, 80, img.status, img.life * 0.4));
            drawPixelSprite(ctx, player.x, player.y, 80, player.status);
            if (enemy.hp > 0) drawEnemy();
            state.particles.forEach(p => {
                ctx.globalAlpha = p.life;
                if (p.isRing) {
                    ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y - 45, p.size, 0, Math.PI * 2); ctx.stroke();
                } else {
                    ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            });
            ctx.globalAlpha = 1.0;

            state.floatTexts.forEach(text => {
                const age = 1 - Math.max(0, Math.min(1, text.life / text.maxLife));
                const fadeIn = Math.min(1, age / 0.12);
                const fadeOut = Math.max(0, Math.min(1, text.life / (text.maxLife * 0.45)));
                const alpha = Math.min(fadeIn, fadeOut);
                const popScale = text.pop
                    ? 1 + (Math.sin(Math.min(1, age / 0.24) * Math.PI) * 0.18)
                    : 1;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = text.color;
                ctx.font = `${text.weight} ${text.size}px "Press Start 2P"`;
                ctx.textAlign = text.align;
                ctx.translate(text.x, text.y);
                ctx.scale(popScale, popScale);
                if (!text.noStroke) {
                    const strokeAlpha = alpha * 0.6;
                    if (strokeAlpha >= 0.35) {
                        ctx.globalAlpha = strokeAlpha;
                        ctx.strokeStyle = text.strokeColor || 'rgba(0, 0, 0, 0.9)';
                        ctx.lineWidth = 3;
                        ctx.strokeText(text.text, 0, 0);
                    }
                    ctx.globalAlpha = alpha;
                    ctx.fillText(text.text, 0, 0);
                } else {
                    ctx.fillText(text.text, 0, 0);
                }
                ctx.restore();
            });

            state.attackMarkers.forEach(marker => drawAttackX(marker.x, marker.y, marker.alpha));

            if (state.messageTimer > 0) {
                ctx.fillStyle = state.messageColor;
                ctx.font = '10px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText(state.messageText, canvas.width / 2, 36);
                ctx.textAlign = 'start';
            }

            ctx.restore();

            ctx.save();
            ctx.fillStyle = PALETTE.DARK;
            ctx.font = '10px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(`STAGE ${getStageLabel()}`, canvas.width / 2, 24);
            ctx.restore();
        }

        function drawEnemy() {
            let ex = enemy.x; let ey = enemy.y;
            if (enemy.status === 'HOLD') {
                let arrowX = ex - 80; let arrowY = ey - 45;
                if (enemy.attackDir === 'MID_WAVE' || enemy.attackDir === 'AIR_ORBIT_SWEEP') {
                    drawArrow(arrowX, arrowY - 80, enemy.attackDir, enemy.timer, true);
                    drawArrow(arrowX, arrowY, enemy.attackDir, enemy.timer, true);
                    drawArrow(arrowX, arrowY + 80, enemy.attackDir, enemy.timer, true);
                } else {
                    drawArrow(arrowX, arrowY, enemy.attackDir, enemy.timer, true);
                }
            }
            
            // ?ㅽ뀒?댁?蹂꾨줈 ?ㅻⅨ ???대?吏 ?뚮뜑留?
            let enemyImg = null;
            const enemySize = 80;
            
            if (isFinalBossStage()) {
                enemyImg = bossFinalImg;
            } else if (state.stage === 1) {
                enemyImg = stage1MonsterImg;
            } else if (state.stage === 2) {
                enemyImg = stage2MonsterImg;
            } else if (isWorldBossStage()) {
                // ?붾뱶 蹂댁뒪 (?ㅻⅨ履??대?吏)
                enemyImg = bossFinalImg;
            } else if (isBossStage()) {
                // 以묎컙蹂댁뒪 (?쇱そ ?대?吏)
                enemyImg = bossMidImg;
            }
            
            // ?대?吏媛 濡쒕뱶?섏뿀?쇰㈃ ?대?吏 ?뚮뜑留?
            if (enemyImg && enemyImg.complete && enemyImg.naturalWidth > 0) {
                ctx.save();
                if (enemy.hitFlash > 0 || (enemy.status === 'HOLD' && Math.floor(Date.now() / 50) % 2 === 0)) {
                    ctx.globalAlpha = 0.7;
                    ctx.filter = 'brightness(1.5)';
                }
                ctx.imageSmoothingEnabled = false;
                // 諛곌꼍???쒓굅??罹붾쾭?ㅺ? ?덉쑝硫?洹멸쾬???ъ슜
                const drawSource = enemyImg.cleanedCanvas || enemyImg;

                // Match boss pixel density to player sprite pixel density.
                const playerRef = extractedPlayerSprites.idle || extractedPlayerSprites.attack;
                if (playerRef && drawSource.height > 0) {
                    const playerBaseHeight = enemySize * 0.72;
                    const pixelScale = playerBaseHeight / playerRef.height;
                    let drawHeight = drawSource.height * pixelScale;

                    // Keep stage 1 monster larger, but reduce stage 2 only.
                    if (state.stage === 1) {
                        drawHeight = playerBaseHeight * 1.35;
                    } else if (state.stage === 2) {
                        drawHeight = playerBaseHeight * 2;
                    }

                    // Mid boss should appear as large as final boss on screen.
                    if (!isWorldBossStage() && isBossStage()) {
                        const finalSource = bossFinalImg.cleanedCanvas || bossFinalImg;
                        if (finalSource && finalSource.height > 0) {
                            drawHeight = finalSource.height * pixelScale;
                        }
                    }

                    const drawWidth = drawHeight * (drawSource.width / drawSource.height);
                    ctx.drawImage(drawSource, ex - drawWidth / 2, ey - drawHeight, drawWidth, drawHeight);
                } else {
                    ctx.drawImage(drawSource, ex - enemySize / 2, ey - enemySize, enemySize, enemySize);
                }
                ctx.restore();
            } else {
                // ?대?吏 濡쒕뱶 ?ㅽ뙣???대갚: ?ш컖???뚮뜑留?
                if (enemy.hitFlash > 0 || (enemy.status === 'HOLD' && Math.floor(Date.now() / 50) % 2 === 0)) ctx.fillStyle = 'white';
                else ctx.fillStyle = '#c0392b';
                ctx.fillRect(ex - enemySize / 2, ey - enemySize, enemySize, enemySize);
            }
        }

        function drawBar(x, y, w, h, ratio, color, label) {
            ctx.fillStyle = PALETTE.DARK; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, ratio), h);
            ctx.strokeStyle = 'white'; ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = PALETTE.DARK; ctx.font = '10px "Press Start 2P"'; ctx.fillText(label, x, y - 5);
        }

        function getPlayerHeartCount() {
            if (player.maxHp <= 0) return 0;
            const ratio = Math.max(0, Math.min(1, player.hp / player.maxHp));
            if (player.hp <= 0) return 0;
            return Math.max(1, Math.min(10, Math.round(ratio * 10)));
        }

        function drawHeartHud(x, y, filledHearts, totalHearts = 10) {
            const totalWidth = 180;
            const segmentWidth = totalWidth / totalHearts;
            const segmentHeight = 12;

            ctx.save();
            ctx.fillStyle = PALETTE.DARK;
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('PLAYER HP', x, y - 5);
            ctx.imageSmoothingEnabled = false;

            for (let i = 0; i < totalHearts; i++) {
                const heartX = x + (i * segmentWidth);
                ctx.save();
                ctx.globalAlpha = i < filledHearts ? 1 : 0.2;
                ctx.fillStyle = i < filledHearts ? '#2ecc71' : '#2c3e50';
                ctx.fillRect(heartX, y, segmentWidth, segmentHeight);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(heartX, y, segmentWidth, segmentHeight);
                ctx.restore();
            }

            ctx.restore();
        }

        function drawFinalBossMagicEffect(x, y, timer) {
            const totalFrames = 90;
            const progress = 1 - Math.max(0, Math.min(1, timer / totalFrames));
            const flicker = Math.floor(progress * 18) % 2 === 0;

            ctx.save();
            ctx.imageSmoothingEnabled = false;

            ctx.fillStyle = flicker ? '#ffffff' : '#ff4f6d';
            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'left';
            ctx.fillText('HEX', x + 92, y + 17);
            ctx.restore();
        }

        function drawFinalBossHeartSplitEffect(x, y, timer) {
            const totalFrames = 90;
            const progress = 1 - Math.max(0, Math.min(1, timer / totalFrames));
            const barWidth = 180;
            const barHeight = 12;
            const barLeft = x;
            const barTop = y;
            const heartCount = 10;
            const segmentWidth = barWidth / heartCount;
            const bladeProgress = Math.min(1, Math.max(0, progress * 1.35));
            const splitProgress = Math.min(1, Math.max(0, (progress - 0.38) * 1.8));
            const lockFlash = Math.floor(progress * 18) % 2 === 0;

            ctx.save();
            ctx.imageSmoothingEnabled = false;

            ctx.globalAlpha = 0.95;
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(barLeft, barTop, barWidth, barHeight);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(barLeft, barTop, barWidth, barHeight);

            const bladeX = barLeft + (bladeProgress * barWidth);

            if (bladeProgress < 1) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(bladeX - 2, barTop - 18, 4, barHeight + 36);
                ctx.fillStyle = '#ff4f6d';
                ctx.fillRect(bladeX - 1, barTop - 12, 2, barHeight + 24);
            }

            if (splitProgress > 0) {
                for (let i = 1; i < heartCount; i++) {
                    const cutX = barLeft + (i * segmentWidth);
                    const local = Math.max(0, Math.min(1, splitProgress * 1.35 - (i * 0.06)));
                    if (local <= 0) continue;

                    const cutHeight = Math.max(2, Math.round((barHeight + 4) * local));
                    const cutY = barTop + Math.floor((barHeight - cutHeight) / 2);

                    ctx.fillStyle = local >= 1 ? '#ffffff' : '#ff4f6d';
                    ctx.fillRect(cutX - 1, cutY - 1, 2, cutHeight + 2);

                    if (local > 0.55) {
                        ctx.fillStyle = '#f1c40f';
                        ctx.fillRect(cutX - 5, barTop - 5, 3, 3);
                        ctx.fillRect(cutX + 3, barTop + barHeight + 2, 3, 3);
                    }
                }

                for (let i = 0; i < heartCount; i++) {
                    const cellX = barLeft + (i * segmentWidth);
                    const isLocked = splitProgress >= (0.25 + (i * 0.055));

                    if (!isLocked) continue;

                    ctx.fillStyle = '#2ecc71';
                    ctx.fillRect(cellX, barTop, segmentWidth, barHeight);
                    ctx.strokeStyle = lockFlash ? '#f1c40f' : '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cellX, barTop, segmentWidth, barHeight);
                    ctx.fillStyle = lockFlash ? '#ffffff' : '#9ff5b6';
                    ctx.fillRect(cellX + 2, barTop + 2, segmentWidth - 4, 2);
                }
            }

            ctx.restore();
        }

        function applyPlayerDamage(amount) {
            if (state.finalBossHeartMode) {
                const heartHp = Math.max(1, Math.ceil(player.maxHp / 10));
                player.hp = Math.max(0, player.hp - heartHp);
                return heartHp;
            }

            const appliedDamage = Math.max(1, amount);
            player.hp -= appliedDamage;
            return appliedDamage;
        }

        upgradeHpBtnEl.addEventListener('click', () => {
            if (state.mode !== 'LOBBY') return;
            tryUpgrade('hp');
        });
        upgradeAtkBtnEl.addEventListener('click', () => {
            if (state.mode !== 'LOBBY') return;
            tryUpgrade('atk');
        });
        upgradeDefBtnEl.addEventListener('click', () => {
            if (state.mode !== 'LOBBY') return;
            tryUpgrade('def');
        });
        pauseContinueBtnEl.addEventListener('click', () => {
            resumeFromPause();
        });
        pauseLobbyBtnEl.addEventListener('click', () => {
            returnToLobbyFromPause();
        });

        function bootGame() {
            renderLobbyIcons();
            enterIntro();
        }

        if (document.readyState === 'loading') {
            window.addEventListener('load', bootGame, { once: true });
        } else {
            bootGame();
        }



