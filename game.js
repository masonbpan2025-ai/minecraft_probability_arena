class Game {
    constructor() {
        this.player = new window.Player();
        this.ui = new window.UI();
        
        this.levels = ['zombie', 'spider', 'creeper', 'enderman'];
        this.currentLevel = 0;
        
        this.startLevel();
    }
    
    startLevel() {
        let enemyTypes = ['zombie', 'spider', 'creeper', 'enderman'];
        let enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        let scaleAmount = this.currentLevel;
        
        this.currentEnemy = new window.Enemy(enemyType, scaleAmount);
        
        this.ui.clearLog();
        this.ui.log(`Level ${this.currentLevel + 1}: A wild ${this.currentEnemy.name} appears!`);
        
        this.ui.hideModal();
        this.updateState();
    }
    
    updateState() {
        this.ui.updatePlayer(this.player);
        this.ui.updateEnemy(this.currentEnemy, this.player.items.torch.active);
    }
    
    toggleItem(itemId) {
        this.player.toggleItem(itemId);
        this.updateState();
    }
    
    playerAction(actionId) {
        this.ui.setControlsGlobalLock(true);
        const action = this.player.getAction(actionId);
        
        // 1. Math Analysis Feedback
        if (this.ui.eduToggle.checked) {
            let defStats = this.currentEnemy.getDefensiveStats();
            let eduFeedback = window.ProbabilityAPI.ProbabilityAnalyzer.evaluateChoice(action, this.player.weapons, defStats, this.player.health);
            this.ui.log(eduFeedback, 'edu');
        }
        
        // 2. Consume Resources
        this.player.consumeResource(action);
        
        // 3. Perform Logic
        if (action.type === 'heal') {
            this.player.heal(action.damage);
            this.ui.log(`You used a Health Potion. Recovered ${action.damage} HP.`, 'heal');
            this.updateState();
            setTimeout(() => this.enemyAction(), 1000);
            return;
        }
        
        let attackResult = window.ProbabilityAPI.attack(action.hitChance, action.damage);
        
        if (attackResult.success) {
            let modifiedDamage = attackResult.damage;
            let defStats = this.currentEnemy.getDefensiveStats();
            
            if (defStats.weakness === action.element || defStats.weakness === action.weaponId) {
                modifiedDamage = Math.floor(modifiedDamage * (action.element === 'magic' ? 2.0 : 1.5));
                this.ui.log(`Element Weakness hit! Damage increased.`, 'edu');
            }
            if (defStats.resistance === action.element) {
                modifiedDamage = Math.floor(modifiedDamage * 0.5);
                this.ui.log(`Enemy resisted! Damage halved.`, 'damage');
            }
            
            let damageResult = this.currentEnemy.takeDamage(modifiedDamage, action.element);
            if (damageResult.hit) {
                this.ui.log(`You used ${action.name} -> HIT -> ${modifiedDamage} damage!`, 'normal');
            } else {
                this.ui.log(`You used ${action.name} -> FAILED -> ${damageResult.text}`, 'normal');
            }
        } else {
            this.ui.log(`You used ${action.name} -> MISSED! (Probability failed or dodged)`, 'normal');
        }
        
        this.updateState();
        
        if (!this.currentEnemy.alive) {
            setTimeout(() => this.endBattle(true), 1000);
            return;
        }
        setTimeout(() => this.enemyAction(), 1000);
    }
    
    enemyAction() {
        let enemyMove = this.currentEnemy.takeAction(this.player.items.torch.active);
        
        if (this.player.items.torch.active) {
            this.player.torches--;
            if (this.player.torches <= 0) {
                this.player.items.torch.active = false;
                this.ui.log("Your torch burnt out entirely!", 'damage');
            }
        }

        if (enemyMove.damage > 0) {
            let playerDmgResult = this.player.takeDamage(enemyMove.damage);
            this.ui.log(`${enemyMove.text}${playerDmgResult.text}`, 'damage');
            if (!playerDmgResult.blocked) {
                this.ui.log(`You took ${playerDmgResult.damage} damage!`, 'damage');
            }
        } else {
            this.ui.log(enemyMove.text, 'normal');
        }
        
        this.updateState();
        
        if (this.player.health <= 0) {
            setTimeout(() => this.endBattle(false), 1000);
            return;
        }
        if (!this.currentEnemy.alive) {
            setTimeout(() => this.endBattle(true), 1000);
            return;
        }
        this.ui.updatePlayer(this.player); 
    }
    
    endBattle(playerWon) {
        if (playerWon) {
            let loots = this.currentEnemy.generateLoot();
            let lootMsg = "";
            loots.forEach(loot => {
                if (loot.amount > 0) {
                    this.player.addResource(loot.type, loot.amount);
                }
                lootMsg += loot.text + "\n";
                this.ui.log(lootMsg, 'loot');
            });
            
            this.ui.showModal(
                "Enemy Defeated!", 
                `Awesome! You beat the ${this.currentEnemy.name}!`, 
                "Next Level",
                lootMsg
            );
            this.currentLevel++;
        } else {
            this.ui.showModal("Game Over", `Defeated by ${this.currentEnemy.name}! You survived ${this.currentLevel} rounds.`, "Try Again", "");
            this.player.reset();
        }
    }
    
    nextLevel() {
        if(this.player.health <= 0){
             this.player.reset(); 
             this.currentLevel = 0;
        } else if(this.player.health > 0 && this.currentLevel > 0) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 10);
            this.player.mp = Math.min(this.player.maxMp, this.player.mp + 5);
            this.player.items.torch.active = false;
            this.player.items.shield.active = false;
        }
        this.startLevel();
    }
}

window.onload = () => { window.game = new Game(); };
