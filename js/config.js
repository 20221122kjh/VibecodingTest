var PALETTE = {
    DARK: '#1a2c11',
    MID: '#466223',
    LIGHT: '#87a06f',
    ACCENT: '#9eb27a',
    BLACK: '#0a1206',
    DANGER: '#e74c3c',
    COOLDOWN: '#333',
    HIT_GOLD: '#fbc531',
    HIT_WHITE: '#ffffff'
};

var GAME_CONFIG = {
    TOTAL_STAGES: 15,
    STAGES_PER_WORLD: 10,
    MONSTERS_PER_STAGE: 5
};

var UPGRADE_CONFIG = {
    hp: { baseCost: 30, costGrowth: 42, amount: 20, maxLevel: 10, label: 'HP' },
    atk: { baseCost: 35, costGrowth: 48, amount: 5, maxLevel: 10, label: 'ATK' },
    def: { baseCost: 30, costGrowth: 40, amount: 2, maxLevel: 10, label: 'DEF' }
};

window.PALETTE = PALETTE;
window.GAME_CONFIG = GAME_CONFIG;
window.UPGRADE_CONFIG = UPGRADE_CONFIG;
