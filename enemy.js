class Enemy {
    constructor(type, scaleOption = 0) {
        this.type = type;
        this.scale = scaleOption;
        this.maxHealth = 100;
        this.health = 100;
        this.alive = true;
        
        this.creeperAttacked = false;
        this.endermanDodgeBoosts = 0;
        this.endermanNextDoubleDamage = false;
        
        this.weakness = null;
        this.resistance = null;
        this.dodgeChanceBase = 0;
        this.poisonDmg = 0;
        
        this.setupEnemy();
    }
    
    setupEnemy() {
        switch(this.type) {
            case 'zombie':
                this.name = this.scale >= 2 ? "Armored Zombie" : "Zombie";
                if (this.scale >= 5) this.name = "Elite Armored Zombie";
                this.maxHealth = 50 + (this.scale * 10);
                this.weakness = "axe"; 
                if (this.scale >= 2) this.dodgeChanceBase = 15;
                if (this.scale >= 5) this.resistance = "ranged";
                break;
            case 'spider':
                this.name = this.scale >= 2 ? "Venomous Spider" : "Spider";
                if (this.scale >= 5) this.name = "Giant Broodmother";
                this.maxHealth = 60 + (this.scale * 10);
                this.weakness = "magic"; 
                if (this.scale >= 2) this.poisonDmg = Math.floor(this.scale / 2) + 2;
                if (this.scale >= 5) this.resistance = "melee";
                break;
            case 'creeper':
                this.name = this.scale >= 2 ? "Charged Creeper" : "Creeper";
                if (this.scale >= 5) this.name = "Nuclear Creeper";
                this.maxHealth = 40 + (this.scale * 12);
                this.weakness = "ranged"; 
                if (this.scale >= 2) this.resistance = "magic"; 
                if (this.scale >= 5) this.dodgeChanceBase = 15;
                break;
            case 'enderman':
                this.name = this.scale >= 2 ? "Void Enderman" : "Enderman";
                if (this.scale >= 5) this.name = "Ender Overlord";
                this.maxHealth = 90 + (this.scale * 15);
                this.resistance = "magic"; 
                this.dodgeChanceBase = 10 + (this.scale * 3);
                if (this.scale >= 2) this.weakness = "sword";
                if (this.scale >= 5) this.resistance = "ranged";
                break;
        }
        this.health = this.maxHealth;
    }
    
    getBehaviorDescription(playerHasTorch) {
        let text = "";
        switch(this.type) {
            case 'zombie':
                let zDmg = 8 + (this.scale * 2);
                text = `80% chance to attack (${zDmg} dmg). ${this.dodgeChanceBase > 0 ? 'Has '+this.dodgeChanceBase+'% Armor Dodge.' : ''}`; break;
            case 'spider':
                let sDmg = 10 + (this.scale * 3);
                text = playerHasTorch ? `Torch Active: 30% attack (${sDmg} dmg).` : `70% attack (${sDmg} dmg). Use Torch!`; 
                if (this.poisonDmg > 0) text += ` Adds ${this.poisonDmg} Poison DMG each turn.`;
                break;
            case 'creeper':
                let explosionChance = this.creeperAttacked ? 70 : 50;
                let cDmg = 20 + (this.scale * 8);
                text = `${explosionChance}% explode (${cDmg} dmg), ${100-explosionChance}% idle. Increases when hit.`; 
                if (this.dodgeChanceBase > 0) text += ` Has ${this.dodgeChanceBase}% base dodge.`;
                break;
            case 'enderman':
                let dodgeChance = Math.min(this.dodgeChanceBase + this.endermanDodgeBoosts * 5, 90);
                text = `${dodgeChance}% dodge chance. +5% each turn. Success = 1.5x damage next turn!`; break;
        }

        if (this.weakness) text += ` [Weak to: ${this.weakness.toUpperCase()}]`;
        if (this.resistance) text += ` [Resists: ${this.resistance.toUpperCase()}]`;
        return text;
    }
    
    getDefensiveStats() {
        let currentDodge = this.dodgeChanceBase / 100;
        if (this.type === 'enderman') {
             currentDodge = Math.min(this.dodgeChanceBase + this.endermanDodgeBoosts * 5, 90) / 100;
        }
        return {
            dodgeChance: currentDodge,
            weakness: this.weakness,
            resistance: this.resistance
        };
    }
    
    takeDamage(amount, actionElement = 'none') {
        let stat = this.getDefensiveStats();
        let canDodge = stat.dodgeChance > 0;
        
        if (this.type === 'enderman' && actionElement === 'magic') {
            canDodge = false;
        }
        
        if (canDodge && window.ProbabilityAPI.randomEvent(stat.dodgeChance)) {
            if (this.type === 'enderman') this.endermanNextDoubleDamage = true;
            return { hit: false, text: `${this.name} DODGED!` };
        } else {
            if (this.type === 'enderman') this.endermanNextDoubleDamage = false; 
        }
        
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        
        if (this.type === 'creeper') {
            this.creeperAttacked = true;
        }
        
        return { hit: true, text: "" };
    }
    
    takeAction(playerHasTorch) {
        let actionResult = { damage: 0, text: "" };
        switch (this.type) {
            case 'zombie':
                if (window.ProbabilityAPI.randomEvent(0.8)) {
                    let d = 8 + (this.scale * 2);
                    actionResult.damage = d; actionResult.text = `${this.name} attacked for ${d} dmg!`;
                } else { actionResult.text = `${this.name} missed its attack.`; }
                break;
            case 'spider':
                let attackChance = playerHasTorch ? 0.3 : 0.7;
                if (window.ProbabilityAPI.randomEvent(attackChance)) {
                    let d = 10 + (this.scale * 3);
                    actionResult.damage = d; actionResult.text = `${this.name} attacked for ${d} dmg! ${playerHasTorch ? '(Torch weakened it)' : ''}`;
                } else { actionResult.text = `${this.name} missed its attack.`; }
                
                if (this.poisonDmg > 0) {
                    actionResult.damage += this.poisonDmg;
                    actionResult.text += ` You suffered ${this.poisonDmg} Poison DMG!`;
                }
                break;
            case 'creeper':
                let explosionChance = this.creeperAttacked ? 0.7 : 0.5;
                if (window.ProbabilityAPI.randomEvent(explosionChance)) {
                    let d = 20 + (this.scale * 8);
                    actionResult.damage = d; actionResult.text = `${this.name} EXPLODED! (${d} dmg)`;
                    this.health = 0; this.alive = false;
                } else { actionResult.text = `${this.name} is idling... ssssss...`; }
                break;
            case 'enderman':
                let dmg = 15 + (this.scale * 3); 
                if (this.endermanNextDoubleDamage) {
                    dmg = Math.floor(dmg * 1.5); actionResult.text = `${this.name} fiercely counterattacks! (${dmg} dmg)`;
                    this.endermanNextDoubleDamage = false;
                } else { actionResult.text = `${this.name} slaps you! (${dmg} dmg)`; }
                actionResult.damage = dmg;
                this.endermanDodgeBoosts++; 
                break;
        }
        return actionResult;
    }

    generateLoot() {
        let loots = [];
        if (this.type === 'zombie') {
            loots.push({ amount: Math.floor(Math.random() * 4) + 2, type: 'arrows', text: `Dropped Arrows!` });
            if (window.ProbabilityAPI.randomEvent(0.4)) loots.push({ amount: 1, type: 'torches', text: 'Dropped 1 Torch!' });
        } else if (this.type === 'spider') {
            loots.push({ amount: 15, type: 'mp', text: `Dropped an MP Orb (+15 MP)!` });
        } else if (this.type === 'creeper') {
            if (window.ProbabilityAPI.randomEvent(0.5)) {
                loots.push({ amount: 1, type: 'potions', text: `Dropped 1 Health Potion!` });
            } else {
                loots.push({ amount: 0, type: 'none', text: `Blew up its own loot...`});
            }
        } else if (this.type === 'enderman') {
            loots.push({ amount: 1, type: 'potions', text: `Dropped 1 Health Potion!` });
            loots.push({ amount: 5, type: 'shield', text: `Dropped End-Shield Fragment (+5 Durability)!` });
        }
        
        // Random global drops
        if (window.ProbabilityAPI.randomEvent(0.2) && this.type !== 'zombie') {
            loots.push({ amount: 1, type: 'torches', text: 'Found 1 Torch in the rubble.' });
        }
        if (window.ProbabilityAPI.randomEvent(0.15) && this.type !== 'enderman') {
            loots.push({ amount: 3, type: 'shield', text: 'Found Shield scraps (+3 Durability).' });
        }
        
        return loots;
    }
}

window.Enemy = Enemy;
