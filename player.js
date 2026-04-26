class Player {
    constructor() {
        this.maxHealth = 100;
        this.health = 100;
        
        this.mp = 50;
        this.maxMp = 50;
        this.arrows = 10;
        this.maxArrows = 20;
        this.potions = 2;
        this.maxPotions = 5;
        this.torches = 3;
        this.maxTorches = 10;
        this.shieldDurability = 5;
        this.maxShieldDurability = 10;
        
        this.weapons = [
            { name: "Sword", weaponId: "sword", element: "melee", hitChance: 1.0, damage: 10, type: "attack", costType: "durability", durability: 30 },
            { name: "Axe", weaponId: "axe", element: "melee", hitChance: 0.5, damage: 35, type: "attack", costType: "durability", durability: 15 },
            { name: "Bow", weaponId: "bow", element: "ranged", hitChance: 0.7, damage: 25, type: "attack", costType: "arrow" },
            { name: "Fireball", weaponId: "fireball", element: "magic", hitChance: 1.0, damage: 30, type: "attack", costType: "mp_10" },
            { name: "Health Potion", weaponId: "potion", element: "none", hitChance: 1.0, damage: 40, type: "heal", costType: "potion" }
        ];
        
        this.items = {
            torch: { active: false, name: "Torch" },
            shield: { active: false, name: "Shield", blockChance: 0.6 }
        };
    }
    
    toggleItem(itemId) {
        if (itemId === 'torch' && this.torches <= 0 && !this.items.torch.active) return false;
        if (itemId === 'shield' && this.shieldDurability <= 0 && !this.items.shield.active) return false;
        
        if (this.items[itemId]) {
            this.items[itemId].active = !this.items[itemId].active;
            return this.items[itemId].active;
        }
        return false;
    }
    
    getAction(weaponId) {
        return this.weapons.find(w => w.weaponId === weaponId);
    }

    canUseAction(action) {
        if (action.costType === "arrow" && this.arrows <= 0) return false;
        if (action.costType === "mp_10" && this.mp < 10) return false;
        if (action.costType === "potion" && this.potions <= 0) return false;
        if (action.costType === "durability" && action.durability <= 0) return false;
        return true;
    }

    consumeResource(action) {
        if (action.costType === "arrow") this.arrows--;
        if (action.costType === "mp_10") this.mp -= 10;
        if (action.costType === "potion") this.potions--;
        if (action.costType === "durability") action.durability--;
    }
    
    takeDamage(amount) {
        let blockText = "";
        let finalDamage = amount;
        
        if (this.items.shield.active && this.shieldDurability > 0) {
            this.shieldDurability--;
            if (window.ProbabilityAPI.block(this.items.shield.blockChance)) {
                finalDamage = 0;
                blockText = " - Shield BLOCKED! (-1 Dur)";
            } else {
                blockText = " - Shield FAILED! (-1 Dur)";
            }
            if (this.shieldDurability <= 0) {
                this.items.shield.active = false;
                blockText += " SHIELD BROKE!";
            }
        }
        
        this.health -= finalDamage;
        if (this.health < 0) this.health = 0;
        
        return { damage: finalDamage, blocked: finalDamage === 0, text: blockText };
    }

    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
    }

    addResource(type, amount) {
        if (type === 'arrows') this.arrows = Math.min(this.maxArrows, this.arrows + amount);
        if (type === 'potions') this.potions = Math.min(this.maxPotions, this.potions + amount);
        if (type === 'mp') this.mp = Math.min(this.maxMp, this.mp + amount);
        if (type === 'torches') this.torches = Math.min(this.maxTorches, this.torches + amount);
        if (type === 'shield') this.shieldDurability = Math.min(this.maxShieldDurability, this.shieldDurability + amount);
    }
    
    reset() {
        this.health = this.maxHealth;
        this.mp = 50;
        this.arrows = 10;
        this.potions = 2;
        this.torches = 3;
        this.shieldDurability = 5;
        this.weapons[0].durability = 30; // sword
        this.weapons[1].durability = 15; // axe
        this.items.torch.active = false;
        this.items.shield.active = false;
    }
}

window.Player = Player;
