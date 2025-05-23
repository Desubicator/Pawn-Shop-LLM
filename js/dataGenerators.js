/**
 * dataGenerators.js
 * Contains functions to generate random data (constraints) for items and customers (sellers & buyers).
 * The LLM is responsible for generating creative details like names and descriptions.
 */

// --- Item Generation Data (Used by Sellers) ---

const itemConditions = {
    "Broken": 0.25,
    "Damaged": 0.40,
    "Worn": 0.50,
    "Regular": 0.75,
    "Good": 0.90,
    "Perfect": 1.00
};

const itemRarities = {
    // Rarity: [Multiplier, Weight]
    "Common":    [1.0, 40],
    "Uncommon":  [1.5, 30],
    "Rare":      [2.0, 20],
    "Unique":    [3.0, 8],
    "Legendary": [5.0, 2]
};

// --- Customer Generation Data (Used by Sellers & Buyers) ---
const personalities = [
    "Grumpy", "Cheerful", "Nervous", "Suspicious", "Friendly", "Arrogant",
    "Desperate", "Calm", "Shady", "Formal", "Enthusiastic", "Timid",
    "World-weary", "Sarcastic", "Naive", "Cunning", "Regretful", "Boastful",
    "Melancholy", "Pragmatic", "Distracted", "Curious", "Impatient",
    "Secretive", "Jovial", "Collector", "Bargain Hunter", "Wealthy Patron" // Added some buyer-centric ones
];

// --- Item Theme Components (Used by Sellers) ---
const itemThemes = [ // General setting/style
    "Sci-Fi",
    "Fantasy",
    "Antique",
    "Steampunk",
    "Everyday Clutter",
    "Post-Apocalyptic",
    "Cyberpunk",
    "Historical", // Broadened from Artifact
    "Noir Detective",
    "Magical Academy",
    "Gothic Horror" // Added more
];

const objectTypes = [ // Specific type of object
    "Weapon", "Tool", "Coin", "Jewelry", "Clothing", "Toy", "Book/Scroll",
    "Musical Instrument", "Device/Gadget", "Container", "Art Piece",
    "Component/Part", "Utensil", "Trinket", "Relic", "Armor Piece",
    "Data Storage", "Medical Supply", "Key/Access Card", "Figurine/Statue",
    "Map/Chart" // Added more
];


// --- Helper Functions ---

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWeightedRandomKey(weightedObject) {
    if (!weightedObject || typeof weightedObject !== 'object') return null;
    const totalWeight = Object.values(weightedObject).reduce((sum, item) => sum + (Array.isArray(item) ? item[1] : 0), 0);
    if (totalWeight <= 0) return null;
    let randomNum = Math.random() * totalWeight;
    for (const key in weightedObject) {
        if (Object.hasOwnProperty.call(weightedObject, key)) {
            const item = weightedObject[key];
            if (Array.isArray(item) && typeof item[1] === 'number' && item[1] > 0) {
                if (randomNum < item[1]) {
                    return key;
                }
                randomNum -= item[1];
            }
        }
    }
    // Fallback if calculation fails slightly due to floating point issues
    const keys = Object.keys(weightedObject);
    return keys[getRandomInt(0, keys.length - 1)] || null;
}


function generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15);
}


// --- Main Generation Functions ---

/**
 * Generates random item constraints (condition, rarity, value) for a SELLER.
 * Name and Description will be generated by the LLM based on a combined theme/type.
 * @returns {object | null} An item constraints object or null if data is missing.
 */
function generateItem() {
    // Ensure necessary data exists
    if (!itemConditions || Object.keys(itemConditions).length === 0 || !itemRarities || Object.keys(itemRarities).length === 0) {
        console.error("Cannot generate item: itemConditions or itemRarities data is missing or empty.");
        return null;
    }

    const baseValue = getRandomInt(10, 500); // The inherent value before condition/rarity

    // Select Condition
    const conditionKeys = Object.keys(itemConditions);
    if (conditionKeys.length === 0) {
         console.error("Cannot generate item: No keys found in itemConditions.");
         return null;
    }
    const selectedCondition = conditionKeys[getRandomInt(0, conditionKeys.length - 1)];
    const conditionMultiplier = itemConditions[selectedCondition];

    // Select Rarity (Weighted)
    const selectedRarity = getWeightedRandomKey(itemRarities);
    if (!selectedRarity || !itemRarities[selectedRarity]) {
        console.error("Cannot generate item: Failed to get a valid rarity.");
        return null; // Or default to common? For now, fail explicitly.
    }
    const rarityMultiplier = itemRarities[selectedRarity][0];

    // Calculate Actual Value (the theoretical market value based on stats)
    const actualValue = Math.max(1, Math.round(baseValue * conditionMultiplier * rarityMultiplier));

    const item = {
        name: null, // To be generated by LLM
        description: null, // To be generated by LLM
        baseValue: baseValue,
        condition: selectedCondition,
        rarity: selectedRarity,
        conditionMultiplier: conditionMultiplier,
        rarityMultiplier: rarityMultiplier,
        actualValue: actualValue, // Calculated 'true' value
        // Theme/Type hint will be associated with the customer selling it
    };
    console.log("Generated Seller Item Constraints:", item);
    return item;
}


/**
 * Generates SELLER customer constraints (personality, pricing, patience, avatar, item theme/type).
 * Name, Age, Occupation, Item Name, Item Desc will be generated by the LLM.
 * @param {object} itemData - The item constraints object generated by `generateItem()`.
 * @param {string} avatarStyle - The currently selected DiceBear avatar style.
 * @returns {object | null} A seller customer constraints object or null on error.
 */
function generateCustomerData(itemData, avatarStyle = 'pixel-art') {
    if (!itemData || typeof itemData.actualValue === 'undefined' || typeof itemData.baseValue === 'undefined') {
        console.error("generateCustomerData requires a valid item constraints object with actualValue and baseValue.");
        return null;
    }
     if (!personalities || personalities.length === 0 || !itemThemes || itemThemes.length === 0 || !objectTypes || objectTypes.length === 0) {
        console.error("Cannot generate customer: Missing personality, theme, or object type data.");
        return null;
    }

    // 1. Select Personality
    const personality = personalities[getRandomInt(0, personalities.length - 1)];

    // 2. Select Item Theme & Type (for LLM's creative generation)
    const selectedTheme = itemThemes[getRandomInt(0, itemThemes.length - 1)];
    const selectedType = objectTypes[getRandomInt(0, objectTypes.length - 1)];
    const combinedItemHint = `${selectedTheme} ${selectedType}`; // e.g., "Sci-Fi Weapon", "Antique Jewelry"

    // 3. Generate Stats
    const patience = getRandomInt(50, 100); // Initial patience pool
    const priceSensitivity = Math.random() * 0.3 + 0.7; // Range 0.7 (more flexible) to 1.0 (less flexible)

    // 4. Calculate SELLER Pricing
    // Price sensitivity affects how close their minimum is to actual value and how high they start.
    // Higher sensitivity (closer to 1.0) means minimum is closer to actual, and asking is higher markup.
    // Lower sensitivity (closer to 0.7) means minimum is lower, and asking markup is lower.
    const low_sens_factor = 1.0 - priceSensitivity; // Inverse relationship: 0.0 (high sens) to 0.3 (low sens)

    // Minimum price multiplier: Base 0.95, reduced if less sensitive (more willing to go lower)
    const minPriceMultiplier = 0.95 - (low_sens_factor * 0.5); // Range ~0.80 (low sens) to 0.95 (high sens)
    const minimumPrice = Math.max(1, Math.round(itemData.actualValue * minPriceMultiplier));

    // Asking price markup: Base 1.1, increased if less sensitive (start higher relative to their minimum)
    // This seems counter-intuitive based on description. Let's rethink:
    // High sensitivity (1.0) = Start higher markup from minimum. Low sensitivity (0.7) = Start lower markup.
    // Let's tie markup to sensitivity directly. Base markup 1.1, increased by sensitivity.
    const askMarkupMultiplier = 1.05 + (priceSensitivity * 0.45); // Range ~1.36 (high sens) to 1.1 (low sens) -> This feels better. High sens asks for more.
    let askingPrice = Math.max(minimumPrice + 1, Math.round(minimumPrice * askMarkupMultiplier));

    // Add caps to prevent absurd asking prices
    askingPrice = Math.min(askingPrice, itemData.baseValue * 5, minimumPrice * 3); // Cap based on base value and minimum
    askingPrice = Math.max(askingPrice, minimumPrice + 1); // Ensure asking is always > minimum

    // 5. Generate Avatar URL
    const avatarSeed = generateRandomSeed();
    const portraitUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

    // 6. Assemble Seller Customer Object
    const customer = {
        name: null, // LLM generates
        age: null, // LLM generates
        occupation: null, // LLM generates
        personality: personality,
        itemThemeHint: combinedItemHint, // Hint for LLM to generate item name/desc
        patience: patience, // Starting patience
        currentPatience: patience, // Current patience (starts full)
        priceSensitivity: priceSensitivity,
        minimumAcceptablePrice: minimumPrice, // Seller's bottom line
        initialAskingPrice: askingPrice, // Seller's starting price
        currentAskingPrice: askingPrice, // Tracks current price during negotiation
        portraitUrl: portraitUrl,
        revealedInfo: { name: false, age: false, occupation: false } // Tracks revealed details
    };
    console.log("Generated Seller Customer Constraints:", customer);
    return customer;
}


/**
 * NEW: Generates BUYER customer constraints (personality, pricing, patience, avatar).
 * They are interested in buying a specific item from the player's inventory.
 * Name, Age, Occupation will be generated by the LLM.
 * @param {object} itemToSell - The item object from the player's inventory that the buyer wants. Must include 'actualValue'.
 * @param {string} avatarStyle - The currently selected DiceBear avatar style.
 * @returns {object | null} A buyer customer constraints object or null on error.
 */
function generateBuyerData(itemToSell, avatarStyle = 'pixel-art') {
    if (!itemToSell || typeof itemToSell.actualValue === 'undefined') {
        console.error("generateBuyerData requires a valid itemToSell object from inventory with actualValue.");
        return null;
    }
     if (!personalities || personalities.length === 0) {
        console.error("Cannot generate buyer: Missing personality data.");
        return null;
    }

    const itemActualValue = itemToSell.actualValue; // The calculated value of the item

    // 1. Select Personality
    const personality = personalities[getRandomInt(0, personalities.length - 1)];

    // 2. Generate Stats
    const patience = getRandomInt(50, 100); // Initial patience pool
    const priceSensitivity = Math.random() * 0.4 + 0.6; // Range 0.6 (less sensitive/willing to pay more) to 1.0 (very sensitive/sticks to value)

    // 3. Calculate BUYER Pricing (Inverse of Seller)
    // Price sensitivity affects how low they start and how high they're willing to go.
    // Higher sensitivity (closer to 1.0) = Starts lower, Max price closer to actual value.
    // Lower sensitivity (closer to 0.6) = Starts higher, Max price potentially much higher than actual value.

    // Maximum price multiplier: Base 1.0, increased if LESS sensitive (willing to overpay)
    const maxPriceMultiplier = 1.0 + ((1.0 - priceSensitivity) * 0.8) + (Math.random() * 0.1); // Range ~1.0x (high sens) to ~1.3x+ (low sens)
    const maximumPrice = Math.max(itemActualValue + 1, Math.round(itemActualValue * maxPriceMultiplier)); // Their absolute max offer

    // Initial offer multiplier: Base 0.6, increased by sensitivity (more sensitive = starts lower relative to actual value)
    // Let's adjust: Sensitive buyers should start lower. Base 1.0, reduced by sensitivity.
    const initialOfferMultiplier = 1.0 - ((1.0 - priceSensitivity) * 0.6) - (Math.random() * 0.15); // Range ~0.6x (high sens) to ~0.9x (low sens)
    let initialOffer = Math.max(1, Math.round(itemActualValue * initialOfferMultiplier));

    // Ensure initial offer is reasonably below the maximum price
    initialOffer = Math.min(initialOffer, Math.max(1, maximumPrice - 1)); // Ensure offer < max
    initialOffer = Math.max(1, initialOffer); // Ensure offer >= 1

    // Safety check: if somehow initial >= max, set initial lower
    if (initialOffer >= maximumPrice) {
        initialOffer = Math.max(1, Math.round(maximumPrice * 0.9));
    }


    // 4. Generate Avatar URL
    const avatarSeed = generateRandomSeed();
    const portraitUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}`;

    // 5. Assemble Buyer Customer Object
    const customer = {
        name: null, // LLM generates
        age: null, // LLM generates
        occupation: null, // LLM generates
        personality: personality,
        // No itemThemeHint needed, they know the item they want
        patience: patience, // Starting patience
        currentPatience: patience, // Current patience
        priceSensitivity: priceSensitivity,
        initialOffer: initialOffer, // Buyer's starting offer
        maximumAcceptablePrice: maximumPrice, // Buyer's maximum price they'll pay
        currentOffer: initialOffer, // Tracks buyer's current offer during negotiation
        portraitUrl: portraitUrl,
        revealedInfo: { name: false, age: false, occupation: false } // Tracks revealed details
    };
    console.log("Generated Buyer Customer Constraints:", customer);
    return customer;
}
