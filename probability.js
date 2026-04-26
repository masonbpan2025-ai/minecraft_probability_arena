// Engine for Constrained Probabilistic Optimization

function randomEvent(probability) {
    if (probability <= 0) return false;
    if (probability >= 1) return true;
    return Math.random() < probability;
}

function attack(hitChance, damage) {
    if (randomEvent(hitChance)) {
        return { success: true, damage: damage };
    }
    return { success: false, damage: 0 };
}

function block(blockChance) {
    return randomEvent(blockChance);
}

// Translate physical resources into comparative mathematical value
// 1 utility point ≈ 1 damage
const UtilityCosts = {
    'none': 0,
    'durability': 2, // Sword/Axe uses are slightly penalized to prevent mindless spam when weak elements exist
    'arrow': 5,      // Arrows are finite
    'mp_10': 15,     // 10 MP is very valuable
    'potion': 35     // Healing heavily penalized vs attack unless necessary
};

const ProbabilityAnalyzer = {
    // Calculates Net Expected Utility
    calculateNEU: function(action, enemyDefensiveStats, playerHealth) {
        if (action.type === 'heal') {
            // Evaluated implicitly: healing utility is based on missing health
            const missingHealth = 100 - playerHealth;
            const healValue = Math.min(action.damage, missingHealth); // Potion heals max 40
            return healValue - UtilityCosts[action.costType]; 
        }

        let actualHitChance = action.hitChance;
        let weaknessMultiplier = 1.0;
        
        if (enemyDefensiveStats) {
            // Apply Dodge Multiplier
            if (enemyDefensiveStats.dodgeChance) {
                actualHitChance = actualHitChance * (1 - enemyDefensiveStats.dodgeChance);
            }
            // Apply Elemental Multipliers
            if (enemyDefensiveStats.weakness === action.element) {
                weaknessMultiplier = 2.0;
            }
            if (enemyDefensiveStats.weakness === action.weaponId) {
                weaknessMultiplier = 1.5;
            }
            if (enemyDefensiveStats.resistance === action.element) {
                weaknessMultiplier = 0.5;
            }
        }
        
        const expectedDamage = (actualHitChance * action.damage) * weaknessMultiplier;
        const netUtility = expectedDamage - UtilityCosts[action.costType];
        
        return {
            expectedDamage: expectedDamage,
            neu: netUtility,
            multiplier: weaknessMultiplier
        };
    },

    getBestAction: function(actions, enemyDefensiveStats, playerHealth) {
        let bestAction = null;
        let bestNEU = -999;
        
        actions.forEach(action => {
            // Ignore if player doesn't have requirements (simulated perfectly if we want strict math)
            // But we can just rank them universally.
            const stats = this.calculateNEU(action, enemyDefensiveStats, playerHealth);
            if (stats.neu > bestNEU && action.type !== 'heal') { // Recommend attacks directly
                bestNEU = stats.neu;
                bestAction = { ...action, stats: stats };
            }
        });
        
        return bestAction;
    },
    
    evaluateChoice: function(chosenAction, actions, enemyDefensiveStats, playerHealth) {
        if (chosenAction.type === 'heal') {
            return `You used ${chosenAction.name}. (A defensive utility move outside the offensive matrix).`;
        }
        
        const best = this.getBestAction(actions, enemyDefensiveStats, playerHealth);
        const chosenStats = this.calculateNEU(chosenAction, enemyDefensiveStats, playerHealth);
        
        let feedback = `You chose ${chosenAction.name} (Exp Dmg: ${chosenStats.expectedDamage.toFixed(1)} | NEU: ${chosenStats.neu.toFixed(1)}). `;
        
        if (chosenStats.multiplier > 1.0) feedback += "Super Effective! ";
        if (chosenStats.multiplier < 1.0) feedback += "Enemy Resisted! ";
        
        if (chosenAction.weaponId === best.weaponId) {
            feedback += `This was perfectly optimized considering resource cost.`;
        } else {
            feedback += `Better optimization: ${best.name} (NEU: ${best.stats.neu.toFixed(1)}). `;
            if (chosenStats.expectedDamage > best.stats.expectedDamage) {
                feedback += `While your move does more damage, the resource constraint cost (e.g. MP/Arrows) mathematically devalues it here.`;
            }
        }
        
        return feedback;
    }
};

window.ProbabilityAPI = {
    randomEvent,
    attack,
    block,
    ProbabilityAnalyzer
};
