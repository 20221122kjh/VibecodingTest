const upgradeAudio = new Audio('sound/buy.mp3');
        upgradeAudio.preload = 'auto';
        upgradeAudio.volume = 0.85;
        const insufficientGoldAudio = new Audio('sound/nomoney.mp3');
        insufficientGoldAudio.preload = 'auto';
        insufficientGoldAudio.volume = 0.9;
        const monsterKillAudio = new Audio('sound/kill.mp3');
        monsterKillAudio.preload = 'auto';
        monsterKillAudio.volume = 0.9;
        let audioCtx = null;

function getAudioContext() {
            if (!audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return null;
                audioCtx = new AudioCtx();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        }

        function playHitSfx() {
            playHitSfxFallback();
        }

        function playHitSfxFallback() {
            const ac = getAudioContext();
            if (!ac) return;

            const now = ac.currentTime;
            const master = ac.createGain();
            master.gain.setValueAtTime(0.60, now);
            master.connect(ac.destination);

            const oscA = ac.createOscillator();
            const gainA = ac.createGain();
            oscA.type = 'square';
            oscA.frequency.setValueAtTime(980, now);
            oscA.frequency.exponentialRampToValueAtTime(220, now + 0.07);
            gainA.gain.setValueAtTime(0.0001, now);
            gainA.gain.exponentialRampToValueAtTime(0.35, now + 0.005);
            gainA.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
            oscA.connect(gainA);
            gainA.connect(master);

            const oscB = ac.createOscillator();
            const gainB = ac.createGain();
            oscB.type = 'square';
            oscB.frequency.setValueAtTime(680, now);
            oscB.frequency.exponentialRampToValueAtTime(160, now + 0.05);
            gainB.gain.setValueAtTime(0.0001, now);
            gainB.gain.exponentialRampToValueAtTime(0.22, now + 0.003);
            gainB.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
            oscB.connect(gainB);
            gainB.connect(master);

            oscA.start(now);
            oscB.start(now);
            oscA.stop(now + 0.09);
            oscB.stop(now + 0.07);
        }

        function playUpgradeSfxFallback() {
            const ac = getAudioContext();
            if (!ac) return;

            const now = ac.currentTime;
            const master = ac.createGain();
            master.gain.setValueAtTime(0.16, now);
            master.connect(ac.destination);

            const blipA = ac.createOscillator();
            const blipAGain = ac.createGain();
            blipA.type = 'square';
            blipA.frequency.setValueAtTime(920, now);
            blipA.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
            blipAGain.gain.setValueAtTime(0.0001, now);
            blipAGain.gain.exponentialRampToValueAtTime(0.23, now + 0.01);
            blipAGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
            blipA.connect(blipAGain);
            blipAGain.connect(master);

            const blipB = ac.createOscillator();
            const blipBGain = ac.createGain();
            blipB.type = 'triangle';
            blipB.frequency.setValueAtTime(680, now + 0.04);
            blipB.frequency.exponentialRampToValueAtTime(980, now + 0.11);
            blipBGain.gain.setValueAtTime(0.0001, now + 0.04);
            blipBGain.gain.exponentialRampToValueAtTime(0.18, now + 0.07);
            blipBGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
            blipB.connect(blipBGain);
            blipBGain.connect(master);

            const click = ac.createOscillator();
            const clickGain = ac.createGain();
            click.type = 'square';
            click.frequency.setValueAtTime(1800, now + 0.015);
            click.frequency.exponentialRampToValueAtTime(240, now + 0.04);
            clickGain.gain.setValueAtTime(0.0001, now + 0.015);
            clickGain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
            clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
            click.connect(clickGain);
            clickGain.connect(master);

            blipA.start(now);
            blipB.start(now + 0.04);
            click.start(now + 0.015);

            blipA.stop(now + 0.12);
            blipB.stop(now + 0.17);
            click.stop(now + 0.055);
        }

        function playUpgradeSfx() {
            try {
                upgradeAudio.currentTime = 0;
                const playPromise = upgradeAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => playUpgradeSfxFallback());
                }
            } catch (err) {
                playUpgradeSfxFallback();
            }
        }

        function playInsufficientGoldSfx() {
            try {
                insufficientGoldAudio.currentTime = 0;
                const playPromise = insufficientGoldAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            } catch (err) {
                // No fallback needed for this notification sound.
            }
        }

        function playMonsterKillSfx() {
            try {
                monsterKillAudio.currentTime = 0;
                const playPromise = monsterKillAudio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            } catch (err) {
                // No fallback needed for this notification sound.
            }
        }

        function playPlayerHurtSfx() {
            const ac = getAudioContext();
            if (!ac) return;

            const now = ac.currentTime;
            const master = ac.createGain();
            master.gain.setValueAtTime(0.0001, now);
            master.gain.exponentialRampToValueAtTime(0.42, now + 0.01);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
            master.connect(ac.destination);

            const low = ac.createOscillator();
            const lowGain = ac.createGain();
            low.type = 'square';
            low.frequency.setValueAtTime(220, now);
            low.frequency.exponentialRampToValueAtTime(70, now + 0.16);
            lowGain.gain.setValueAtTime(0.0001, now);
            lowGain.gain.exponentialRampToValueAtTime(0.34, now + 0.008);
            lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
            low.connect(lowGain);
            lowGain.connect(master);

            const crack = ac.createOscillator();
            const crackGain = ac.createGain();
            crack.type = 'sawtooth';
            crack.frequency.setValueAtTime(780, now);
            crack.frequency.exponentialRampToValueAtTime(180, now + 0.05);
            crackGain.gain.setValueAtTime(0.0001, now);
            crackGain.gain.exponentialRampToValueAtTime(0.16, now + 0.004);
            crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
            crack.connect(crackGain);
            crackGain.connect(master);

            low.start(now);
            crack.start(now);
            low.stop(now + 0.19);
            crack.stop(now + 0.08);
        }

        function playTickSfx() {
            const ac = getAudioContext();
            if (!ac) return;

            const now = ac.currentTime;
            const master = ac.createGain();
            master.gain.setValueAtTime(0.15, now);
            master.connect(ac.destination);

            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

            osc.connect(gain);
            gain.connect(master);

            osc.start(now);
            osc.stop(now + 0.06);
        }
