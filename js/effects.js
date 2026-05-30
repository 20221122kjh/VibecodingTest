function createHitEffect(x, y) {
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 12 + 5;
                state.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    size: Math.random() * 6 + 4,
                    color: PALETTE.HIT_GOLD,
                    gravity: 0.2
                });
            }
            state.particles.push({
                x, y, vx: 0, vy: 0, life: 1.0, size: 40, color: 'rgba(255,255,255,0.8)', isRing: true
            });
        }

function createBurst(x, y, color) {
            for (let i = 0; i < 15; i++) {
                state.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1.0,
                    size: Math.random() * 5 + 3,
                    color,
                    gravity: 0.1
                });
            }
        }

function createDodgeSuccessEffect(x, y) {
        }

function createFloatingText(text, x, y, color = '#ffffff', duration = 30, options = {}) {
            state.floatTexts.push({
                text,
                x,
                y,
                color,
                life: duration,
                maxLife: duration,
                vx: options.vx ?? 0,
                vy: options.vy ?? -0.35,
                gravity: options.gravity ?? 0,
                noMove: options.noMove ?? false,
                size: options.size ?? 10,
                align: options.align ?? 'center',
                weight: options.weight ?? 'normal',
                noStroke: options.noStroke ?? false,
                pop: options.pop ?? false,
                strokeColor: options.strokeColor ?? null
            });
        }

function addAfterimage(x, y, status) {
            state.afterimages.push({ x, y, status, life: 0.8 });
        }
