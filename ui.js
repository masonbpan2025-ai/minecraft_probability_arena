class UI {
    constructor() {
        this.enemyName = document.getElementById('enemy-name');
        this.enemyBehavior = document.getElementById('enemy-behavior');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.enemyHealthText = document.getElementById('enemy-health-text');
        this.enemySprite = document.getElementById('enemy-sprite');
        
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.playerHealthText = document.getElementById('player-health-text');
        this.playerMpBar = document.getElementById('player-mp-bar');
        this.playerMpText = document.getElementById('player-mp-text');
        
        this.arrowCount = document.getElementById('arrow-count');
        this.potionCount = document.getElementById('potion-count');
        this.torchCount = document.getElementById('torch-count');
        
        this.swordDur = document.getElementById('sword-dur');
        this.axeDur = document.getElementById('axe-dur');
        this.torchBtnCount = document.getElementById('torch-btn-count');
        this.shieldDur = document.getElementById('shield-dur');
        
        this.activeItemList = document.getElementById('active-item-list');
        this.battleLog = document.getElementById('battle-log');
        this.eduToggle = document.getElementById('edu-toggle');
        
        this.btnSword = document.getElementById('btn-sword');
        this.btnAxe = document.getElementById('btn-axe');
        this.btnBow = document.getElementById('btn-bow');
        this.btnFireball = document.getElementById('btn-fireball');
        this.btnPotion = document.getElementById('btn-potion');
        
        this.btnTorch = document.getElementById('btn-torch');
        this.btnShield = document.getElementById('btn-shield');
        
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalTitle = document.getElementById('modal-title');
        this.modalDesc = document.getElementById('modal-desc');
        this.modalLoot = document.getElementById('modal-loot');
        this.modalBtn = document.getElementById('modal-btn');
    }
    
    updateEnemy(enemy, playerHasTorch) {
        this.enemyName.innerText = enemy.name;
        this.enemyBehavior.innerText = enemy.getBehaviorDescription(playerHasTorch);
        let hpPercent = (enemy.health / enemy.maxHealth) * 100;
        this.enemyHealthBar.style.width = hpPercent + "%";
        this.enemyHealthText.innerText = `${enemy.health}/${enemy.maxHealth}`;
        this.enemySprite.className = `sprite ${enemy.type}`;
        
        let emoji = '👾';
        if (enemy.type === 'zombie') emoji = '🧟';
        if (enemy.type === 'spider') emoji = '🕷️';
        if (enemy.type === 'creeper') emoji = '🧨';
        if (enemy.type === 'enderman') emoji = '👽';
        this.enemySprite.innerText = emoji;
    }
    
    updatePlayer(player) {
        // Bars
        let hpPercent = (player.health / player.maxHealth) * 100;
        this.playerHealthBar.style.width = hpPercent + "%";
        this.playerHealthText.innerText = `${player.health}/${player.maxHealth} HP`;
        
        let mpPercent = (player.mp / player.maxMp) * 100;
        this.playerMpBar.style.width = mpPercent + "%";
        this.playerMpText.innerText = `${player.mp}/${player.maxMp} MP`;
        
        // Inventory variables
        this.arrowCount.innerText = player.arrows;
        this.potionCount.innerText = player.potions;
        this.torchCount.innerText = player.torches;
        
        this.swordDur.innerText = player.weapons[0].durability;
        this.axeDur.innerText = player.weapons[1].durability;
        this.torchBtnCount.innerText = player.torches;
        this.shieldDur.innerText = player.shieldDurability;
        
        // Active tools visual sync
        this.activeItemList.innerHTML = "";
        let hasActive = false;
        
        if (player.items.torch.active) {
            this.activeItemList.innerHTML += `<li>✅ Torch Active</li>`;
            this.btnTorch.classList.add('active');
            hasActive = true;
        } else {
            this.btnTorch.classList.remove('active');
        }
        
        if (player.items.shield.active) {
            this.activeItemList.innerHTML += `<li>🛡️ Shield Active</li>`;
            this.btnShield.classList.add('active');
            hasActive = true;
        } else {
            this.btnShield.classList.remove('active');
        }
        
        if (!hasActive) this.activeItemList.innerHTML = "<li>None</li>";
        
        // Disable checks based on inventory limits
        this.btnSword.disabled = !player.canUseAction(player.getAction('sword'));
        this.btnAxe.disabled = !player.canUseAction(player.getAction('axe'));
        this.btnBow.disabled = !player.canUseAction(player.getAction('bow'));
        this.btnFireball.disabled = !player.canUseAction(player.getAction('fireball'));
        this.btnPotion.disabled = !player.canUseAction(player.getAction('potion'));
        
        this.btnTorch.disabled = player.torches <= 0 && !player.items.torch.active;
        this.btnShield.disabled = player.shieldDurability <= 0 && !player.items.shield.active;
    }
    
    log(msg, type = 'normal') {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerText = msg;
        this.battleLog.appendChild(entry);
        this.battleLog.scrollTop = this.battleLog.scrollHeight;
    }
    
    clearLog() { this.battleLog.innerHTML = ""; }
    
    showModal(title, desc, buttonText, lootText = "") {
        this.modalTitle.innerText = title;
        this.modalDesc.innerText = desc;
        this.modalBtn.innerText = buttonText;
        this.modalLoot.innerText = lootText;
        this.modalOverlay.classList.remove('hidden');
    }
    
    hideModal() { this.modalOverlay.classList.add('hidden'); }
    
    setControlsGlobalLock(locked) {
        // Temporarily freeze keys so player doesn't spam during delays
        [this.btnSword, this.btnAxe, this.btnBow, this.btnFireball, this.btnPotion, this.btnTorch, this.btnShield]
        .forEach(b => { if(locked) b.disabled = true; });
    }
}

window.UI = UI;
