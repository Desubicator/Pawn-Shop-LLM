/**
 * Main JavaScript file for the Pawn Shop Negotiator Game
 * Handles initialization, settings, player name, customer generation (sellers & buyers),
 * LLM interaction, game logic (acceptance, appraisal, sales), event listeners, UI updates,
 * and Save/Load functionality. Actions simplified to use only the main message input.
 */

// --- DOM Element References ---
// Keep references needed for main logic (modals, settings, name editing, new customer, save/load)
const optionsButton = document.getElementById('options-button');
const optionsModal = document.getElementById('options-modal');
const closeOptionsButton = document.getElementById('close-options-button');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key-button');
const avatarStyleSelect = document.getElementById('avatar-style-select');
const changeAvatarButton = document.getElementById('change-avatar-button');
const playerNameDisplayGroup = document.getElementById('player-name-display-group');
const playerNameDisplay = document.getElementById('player-name-display');
const editNameButton = document.getElementById('edit-name-button');
const playerNameEditGroup = document.getElementById('player-name-edit-group');
const playerNameInput = document.getElementById('player-name-input');
const saveNameButton = document.getElementById('save-name-button');
const newCustomerButton = document.getElementById('new-customer-button');
const saveGameButton = document.getElementById('save-game-button');
const loadGameButton = document.getElementById('load-game-button');


// --- Game State & Settings Variables ---
let apiKey = null;
let currentAvatarStyle = 'pixel-art'; // Default value
let playerName = 'Player'; // Default value
const defaultPlayerSeed = 'player-default';
let playerCash = 1000; // Default starting cash
let shopInventory = []; // Starts empty

// --- Customer Interaction State ---
let currentCustomerType = null; // 'seller' or 'buyer'
let currentCustomer = null; // Holds active customer data and state
let conversationHistory = [];
let isLLMThinking = false;
let appraisalUsedThisTurn = false; // Specific to sellers

// --- LocalStorage Keys ---
const SAVE_GAME_KEY = 'pawnShopSaveData';
const PLAYER_NAME_KEY = 'playerName';
const AVATAR_STYLE_KEY = 'avatarStyle';
const AVATAR_SEED_KEY = 'playerAvatarSeed';
const API_KEY = 'geminiApiKey';

// --- Settings Functions ---
function saveApiKey() {
    if (!apiKeyInput) { console.error("API Key input not found in saveApiKey"); return; }
    const key = apiKeyInput.value.trim();
    if (key) {
        apiKey = key;
        try {
            localStorage.setItem(API_KEY, apiKey);
            console.log("API Key saved.");
            if (typeof showMessage === 'function') showMessage("API Key saved successfully!", 'success', 3000);
        } catch (e) {
            console.error("Error saving API key:", e);
            if (typeof showMessage === 'function') showMessage("Could not save API key.", 'error', 5000);
        }
    } else {
        apiKey = null;
        try {
            localStorage.removeItem(API_KEY);
            if (typeof showMessage === 'function') showMessage("API Key cleared.", 'info', 3000);
        } catch (e) {
            console.error("Error removing API key:", e);
        }
    }
    updateApiKeyStatus();
}

function loadApiKey() {
    if (!apiKeyInput) { console.error("API Key input not found in loadApiKey"); return; }
    try {
        const savedKey = localStorage.getItem(API_KEY);
        if (savedKey) {
            apiKey = savedKey;
            apiKeyInput.value = apiKey;
            console.log("API Key loaded.");
        } else {
            apiKey = null;
            apiKeyInput.value = '';
            console.log("No API Key found.");
        }
    } catch (e) {
        apiKey = null;
        apiKeyInput.value = '';
        console.error("Error loading API key:", e);
        if (typeof showMessage === 'function') showMessage("Could not load saved API key.", 'error', 5000);
    }
    // updateApiKeyStatus called in initializeGame
}

function handleAvatarStyleChange() {
    if (!avatarStyleSelect) { console.error("Avatar select not found in handleAvatarStyleChange"); return; }
    currentAvatarStyle = avatarStyleSelect.value;
    try {
        localStorage.setItem(AVATAR_STYLE_KEY, currentAvatarStyle);
        console.log("Avatar style saved:", currentAvatarStyle);
        // Update avatar immediately only if player seed exists
        const currentSeed = localStorage.getItem(AVATAR_SEED_KEY) || defaultPlayerSeed;
        updatePlayerAvatar(currentSeed);
    } catch (e) {
        console.error("Error saving avatar style:", e);
        if (typeof showMessage === 'function') showMessage("Could not save avatar style.", 'error', 5000);
    }
}

function loadAvatarStyle() {
    if (!avatarStyleSelect) { console.error("Avatar select not found in loadAvatarStyle"); return; }
    try {
        const savedStyle = localStorage.getItem(AVATAR_STYLE_KEY);
        if (savedStyle) {
            const isValidOption = Array.from(avatarStyleSelect.options).some(option => option.value === savedStyle);
            if (isValidOption) {
                currentAvatarStyle = savedStyle;
                avatarStyleSelect.value = currentAvatarStyle;
                console.log("Avatar style loaded:", currentAvatarStyle);
            } else {
                console.warn(`Saved style "${savedStyle}" invalid. Using default.`);
                currentAvatarStyle = avatarStyleSelect.value; // Use default from HTML select
                localStorage.setItem(AVATAR_STYLE_KEY, currentAvatarStyle); // Save the valid default
            }
        } else {
            console.log("No avatar style found, using default.");
            currentAvatarStyle = avatarStyleSelect.value; // Use default from HTML select
        }
    } catch (e) {
        console.error("Error loading avatar style:", e);
        currentAvatarStyle = avatarStyleSelect.value; // Fallback to default
        if (typeof showMessage === 'function') showMessage("Could not load saved avatar style.", 'error', 5000);
    }
}

// --- Player Name Functions ---
function loadPlayerName() {
    if (!playerNameDisplay) { console.error("Player name display not found in loadPlayerName"); return; }
    try {
        const savedName = localStorage.getItem(PLAYER_NAME_KEY);
        playerName = savedName || 'Player'; // Use default if nothing saved
        console.log("Player name loaded/set:", playerName);
    } catch (e) {
        console.error("Error loading player name:", e);
        playerName = 'Player'; // Fallback to default
    }
    playerNameDisplay.textContent = playerName;
}

function savePlayerName() {
    if (!playerNameInput || !playerNameDisplay) { console.error("Player name elements not found in savePlayerName"); return; }
    const newName = playerNameInput.value.trim();
    if (newName && newName.length > 0) {
        playerName = newName;
        try {
            localStorage.setItem(PLAYER_NAME_KEY, playerName);
            console.log("Player name saved:", playerName);
            playerNameDisplay.textContent = playerName;
            toggleNameEdit(false);
            if (typeof showMessage === 'function') showMessage("Player name updated!", 'success', 2000);
        } catch (e) {
            console.error("Error saving player name:", e);
            if (typeof showMessage === 'function') showMessage("Could not save player name.", 'error', 4000);
        }
    } else {
        if (typeof showMessage === 'function') showMessage("Player name cannot be empty.", 'error', 3000);
    }
}

function toggleNameEdit(editing) {
    if (!playerNameDisplayGroup || !playerNameEditGroup || !playerNameInput) { console.error("Player name edit elements not found"); return; }
    if (editing) {
        playerNameDisplayGroup.classList.add('hidden');
        playerNameEditGroup.classList.remove('hidden');
        playerNameInput.value = playerName;
        playerNameInput.focus();
    } else {
        playerNameEditGroup.classList.add('hidden');
        playerNameDisplayGroup.classList.remove('hidden');
    }
}

// --- Avatar Functions ---
function updatePlayerAvatar(seed) {
    const playerPortraitElement = document.getElementById('player-portrait');
    if (!playerPortraitElement) { console.error("Player portrait element not found in updatePlayerAvatar"); return; }
    if (!avatarStyleSelect) { console.error("Avatar select not found in updatePlayerAvatar"); return; } // Added check
    const style = avatarStyleSelect.value || currentAvatarStyle; // Ensure style is current
    const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    playerPortraitElement.src = avatarUrl;
    console.log(`Player avatar updated: Style=${style}, Seed=${seed}`);
}

function generateRandomSeed() {
    return Math.random().toString(36).substring(2, 15);
}

function changePlayerAvatar() {
    const newSeed = generateRandomSeed();
    updatePlayerAvatar(newSeed);
    try {
        localStorage.setItem(AVATAR_SEED_KEY, newSeed);
    } catch (e) {
        console.error("Could not save player avatar seed:", e);
    }
}

// --- UI Functions (Modal only) ---
function openOptionsModal() {
    if (optionsModal) {
        optionsModal.classList.remove('hidden');
        optionsModal.classList.add('flex');
        // Update save button state when opening modal
        if (saveGameButton) {
            saveGameButton.disabled = (currentCustomer !== null); // Disable if negotiation active
        }
    } else {
        console.error("Cannot open options modal: Element not found.");
    }
}

function closeOptionsModal() {
    if (optionsModal) {
        optionsModal.classList.add('hidden');
        optionsModal.classList.remove('flex');
    } else {
        console.error("Cannot close options modal: Element not found.");
    }
}

// --- Save/Load Functions ---
function saveGame() {
    console.log("Attempting to save game...");
    if (currentCustomer !== null) {
        if (typeof showMessage === 'function') showMessage("Cannot save game during a negotiation.", "error", 3000);
        console.warn("Save prevented: Negotiation in progress.");
        return;
    }

    try {
        const playerAvatarSeed = localStorage.getItem(AVATAR_SEED_KEY) || defaultPlayerSeed;

        const gameState = {
            playerCash: playerCash,
            shopInventory: shopInventory,
            playerName: playerName,
            currentAvatarStyle: currentAvatarStyle,
            playerAvatarSeed: playerAvatarSeed,
            saveFormatVersion: 1 // Basic versioning
        };

        const saveDataString = JSON.stringify(gameState);
        localStorage.setItem(SAVE_GAME_KEY, saveDataString);
        console.log("Game state saved:", gameState);
        if (typeof showMessage === 'function') showMessage("Game Saved!", "success", 3000);

    } catch (error) {
        console.error("Error saving game:", error);
        if (typeof showMessage === 'function') showMessage("Failed to save game. Check console for details.", "error", 5000);
    }
}

function loadGame() {
    console.log("Attempting to load game...");

    // End current interaction if one is active before loading
    if (currentCustomer !== null) {
        console.log("Ending current interaction before loading...");
        endCurrentInteraction("load_game"); // Pass reason
        // Delay slightly to ensure state reset completes before loading
        setTimeout(proceedWithLoad, 100);
    } else {
        proceedWithLoad(); // Proceed immediately if no customer
    }
}

function proceedWithLoad() {
    const savedDataString = localStorage.getItem(SAVE_GAME_KEY);

    if (!savedDataString) {
        if (typeof showMessage === 'function') showMessage("No saved game found.", "info", 3000);
        console.log("Load failed: No save data found in localStorage.");
        return;
    }

    try {
        const loadedState = JSON.parse(savedDataString);
        console.log("Loaded game state:", loadedState);

        // Basic validation (can be expanded)
        if (typeof loadedState.playerCash !== 'number' || !Array.isArray(loadedState.shopInventory) || typeof loadedState.playerName !== 'string') {
            throw new Error("Invalid save data format.");
        }
        // Add check for version if needed in the future
        // if (loadedState.saveFormatVersion !== 1) { ... }

        // Restore core game state
        playerCash = loadedState.playerCash;
        shopInventory = loadedState.shopInventory; // Assuming inventory items are simple objects
        playerName = loadedState.playerName;
        currentAvatarStyle = loadedState.currentAvatarStyle || 'pixel-art'; // Fallback style
        const playerAvatarSeed = loadedState.playerAvatarSeed || defaultPlayerSeed; // Fallback seed

        // Restore individual settings in localStorage for consistency
        localStorage.setItem(PLAYER_NAME_KEY, playerName);
        localStorage.setItem(AVATAR_STYLE_KEY, currentAvatarStyle);
        localStorage.setItem(AVATAR_SEED_KEY, playerAvatarSeed);

        // --- Update UI ---
        // Ensure UI update functions exist before calling
        if (typeof updateCashDisplay === 'function') updateCashDisplay(playerCash); else console.error("updateCashDisplay not found");
        if (typeof displayInventory === 'function') displayInventory(shopInventory); else console.error("displayInventory not found");
        if (playerNameDisplay) playerNameDisplay.textContent = playerName; else console.error("playerNameDisplay not found");
        if (avatarStyleSelect) avatarStyleSelect.value = currentAvatarStyle; else console.error("avatarStyleSelect not found");
        if (typeof updatePlayerAvatar === 'function') updatePlayerAvatar(playerAvatarSeed); else console.error("updatePlayerAvatar not found");
        if (typeof clearCustomerArea === 'function') clearCustomerArea(); else console.error("clearCustomerArea not found"); // Ensure customer area is clear
        if (typeof clearDialogueLog === 'function') clearDialogueLog(); else console.error("clearDialogueLog not found"); // Clear log
        if (typeof addDialogueLog === 'function') addDialogueLog("System", "Game Loaded."); else console.error("addDialogueLog not found"); // Add log message

        // Ensure buttons are in the correct state (no active customer)
        if (typeof updateButtonStates === 'function') {
            updateButtonStates({ type: 'none', canInteract: false, canEnd: false, canAppraise: false });
        } else { console.error("updateButtonStates not found"); }

        if(saveGameButton) saveGameButton.disabled = false; // Enable save after load
        if(newCustomerButton) newCustomerButton.disabled = !apiKey; // Re-enable based on API key

        if (typeof showMessage === 'function') showMessage("Game Loaded!", "success", 3000);
        closeOptionsModal(); // Close options modal after loading

    } catch (error) {
        console.error("Error loading game:", error);
        if (typeof showMessage === 'function') showMessage(`Failed to load save data: ${error.message || 'Unknown error'}`, "error", 5000);
        // Optionally remove corrupted save data
        // localStorage.removeItem(SAVE_GAME_KEY);
    }
}


// --- Game Logic Functions ---

/**
 * Starts a new interaction: Determines customer type (seller/buyer),
 * generates data, constructs prompt, calls LLM for first turn.
 */
async function startNewCustomerInteraction() {
    console.log("Starting new customer interaction...");
    if (isLLMThinking) { if (typeof showMessage === 'function') showMessage("Please wait...", "info"); return; }

    // Disable Save Game button during interaction
    if (saveGameButton) saveGameButton.disabled = true;

    // Check required functions from other files
    const dependenciesMet =
        typeof generateItem === 'function' &&
        typeof generateCustomerData === 'function' &&
        typeof constructCustomerPrompt === 'function' &&
        typeof callGeminiApi === 'function' &&
        typeof parseTags === 'function' &&
        typeof displayCustomerInfo === 'function' &&
        typeof updateCustomerPortrait === 'function' &&
        typeof displayItemInfo === 'function' &&
        typeof updateButtonStates === 'function' &&
        typeof clearDialogueLog === 'function' &&
        typeof addDialogueLog === 'function' &&
        typeof resetAppraisalInfo === 'function' &&
        typeof clearCustomerArea === 'function' &&
        typeof displayAppraisalPanel === 'function' &&
        typeof generateBuyerData === 'function' &&
        typeof constructBuyerPrompt === 'function' &&
        typeof finalizeSale === 'function' &&
        typeof finalizeDeal === 'function' &&
        typeof getConcludingRemark === 'function' &&
        typeof showMessage === 'function' && // Added showMessage check
        typeof hideMessage === 'function'; // Added hideMessage check

    if (!dependenciesMet) {
        console.error("Core function(s) missing. Check script loading order and definitions.");
        if (typeof showMessage === 'function') showMessage("Error starting game: Core functions missing.", "error");
        if (saveGameButton) saveGameButton.disabled = false; // Re-enable save if start fails
        return;
    }


    if (newCustomerButton) newCustomerButton.disabled = true;
    isLLMThinking = true;
    showMessage("Generating customer...", "info");

    // Clear previous state
    clearCustomerArea(); // This now includes resetAppraisalInfo
    clearDialogueLog();
    appraisalUsedThisTurn = false; // Reset appraisal flag (only relevant for sellers)
    currentCustomerType = null; // Reset customer type

    // --- Determine Customer Type ---
    let customerType = 'seller'; // Default to seller
    if (shopInventory && shopInventory.length >= 2) {
        if (Math.random() < 0.5) { // 50% chance for a buyer if inventory allows
            customerType = 'buyer';
        }
    }
    currentCustomerType = customerType; // Store the determined type
    console.log(`Determined customer type: ${currentCustomerType}`);

    let itemData = null; // Seller's item details
    let customerBaseData = null; // Shared customer structure
    let systemPrompt = null;
    let itemToSell = null; // Specific item from inventory for buyers

    try {
        if (currentCustomerType === 'seller') {
            // --- Generate Seller Data ---
            itemData = generateItem();
            if (!itemData) throw new Error("Failed to generate item data.");
            customerBaseData = generateCustomerData(itemData, currentAvatarStyle);
            if (!customerBaseData) throw new Error("Failed to generate seller customer data.");
            systemPrompt = constructCustomerPrompt(customerBaseData, itemData);
            if (!systemPrompt) throw new Error("Failed to construct seller prompt.");

            // Initial UI Update (Seller)
            displayCustomerInfo(customerBaseData);
            updateCustomerPortrait(customerBaseData.portraitUrl);
            displayItemInfo({ name: "...", description: "...", rarity: itemData.rarity }, null, 'seller');
            displayAppraisalPanel(true);
            updateButtonStates({ type: 'seller', canInteract: false, canEnd: false, canAppraise: false });

        } else { // currentCustomerType === 'buyer'
            // --- Generate Buyer Data ---
            if (shopInventory.length === 0) throw new Error("Cannot generate buyer: Inventory is empty.");
            itemToSell = shopInventory[Math.floor(Math.random() * shopInventory.length)];
            if (!itemToSell) throw new Error("Failed to select item from inventory for buyer.");

            customerBaseData = generateBuyerData(itemToSell, currentAvatarStyle);
            if (!customerBaseData) throw new Error("Failed to generate buyer customer data.");

            systemPrompt = constructBuyerPrompt(customerBaseData, itemToSell);
            if (!systemPrompt) throw new Error("Failed to construct buyer prompt.");

            // Initial UI Update (Buyer)
            displayCustomerInfo(customerBaseData);
            updateCustomerPortrait(customerBaseData.portraitUrl);
            displayItemInfo(itemToSell, customerBaseData.initialOffer, 'buyer');
            displayAppraisalPanel(false);
            updateButtonStates({ type: 'buyer', canInteract: false, canEnd: false });

        }

        // Store State (Common)
        currentCustomer = {
            customerData: customerBaseData,
            itemData: itemData,
            itemToSell: itemToSell,
            systemPrompt: systemPrompt,
            type: currentCustomerType,
            currentOffer: customerBaseData.initialOffer || null,
            currentAskingPrice: customerBaseData.initialAskingPrice || null
        };
        conversationHistory = [];

        // Call LLM for the first turn
        const firstResponse = await callGeminiApi(apiKey, [], systemPrompt);
        isLLMThinking = false; // Reset thinking flag *after* API call

        if (firstResponse && currentCustomer) {
            const tags = parseTags(firstResponse);

            // Update state with generated details from LLM's first response
            currentCustomer.customerData.name = tags.REVEALED_NAME || currentCustomer.customerData.name || "Customer";
            currentCustomer.customerData.age = tags.REVEALED_AGE || currentCustomer.customerData.age;
            currentCustomer.customerData.occupation = tags.REVEALED_OCCUPATION || currentCustomer.customerData.occupation;
            currentCustomer.customerData.revealedInfo.name = !!tags.REVEALED_NAME;
            currentCustomer.customerData.revealedInfo.age = !!tags.REVEALED_AGE;
            currentCustomer.customerData.revealedInfo.occupation = !!tags.REVEALED_OCCUPATION;

            conversationHistory.push({ role: "model", parts: [{ text: firstResponse }] });
            addDialogueLog(currentCustomer.customerData.name, firstResponse);
            displayCustomerInfo(currentCustomer.customerData);

            // Handle initial price/offer tags and update item details if seller
            if (currentCustomerType === 'seller') {
                currentCustomer.currentAskingPrice = tags.PRICE_ASK !== undefined ? tags.PRICE_ASK : currentCustomer.customerData.initialAskingPrice;
                if (tags.ITEM_NAME) currentCustomer.itemData.name = tags.ITEM_NAME;
                if (tags.ITEM_DESC) currentCustomer.itemData.description = tags.ITEM_DESC;
                displayItemInfo(currentCustomer.itemData, currentCustomer.currentAskingPrice, 'seller');
            } else { // Buyer
                currentCustomer.currentOffer = tags.PRICE_OFFER !== undefined ? tags.PRICE_OFFER : customerBaseData.initialOffer;
                displayItemInfo(currentCustomer.itemToSell, currentCustomer.currentOffer, 'buyer');
            }

            // Enable interaction
            if (currentCustomerType === 'seller') {
                updateButtonStates({ type: 'seller', canInteract: true, canEnd: true, canAppraise: true });
            } else {
                updateButtonStates({ type: 'buyer', canInteract: true, canEnd: true });
            }
            hideMessage();
            console.log(`Customer interaction started (${currentCustomerType}).`);

        } else {
             if (!firstResponse) throw new Error("Failed to get initial response from LLM.");
             if (!currentCustomer) throw new Error("Customer object became null unexpectedly after LLM call.");
        }

    } catch (error) {
        console.error("Error during new customer setup:", error);
        showMessage(`Error starting interaction: ${error.message || 'Unknown error'}`, "error");
        isLLMThinking = false;
        if(currentCustomer) {
             endCurrentInteraction("error_setup");
        } else {
            updateApiKeyStatus();
            if (newCustomerButton) newCustomerButton.disabled = !apiKey;
             updateButtonStates({ type: 'none', canInteract: false, canEnd: false, canAppraise: false });
        }
        if (saveGameButton) saveGameButton.disabled = false;
    }
}


/**
 * Processes player input (chat message) and gets LLM response.
 * Handles logic based on whether the customer is a seller or buyer.
 * @param {string} playerTurnText - The text representing the player's action/message.
 */
async function processPlayerTurn(playerTurnText) {
     if (!currentCustomer || isLLMThinking) { return; }
     // Check required functions from other files
     const dependenciesMet =
         typeof callGeminiApi === 'function' &&
         typeof parseTags === 'function' &&
         typeof addDialogueLog === 'function' &&
         typeof updateButtonStates === 'function' &&
         typeof displayCustomerInfo === 'function' &&
         typeof displayItemInfo === 'function' &&
         typeof updatePatienceDisplay === 'function' &&
         typeof finalizeDeal === 'function' &&
         typeof finalizeSale === 'function' &&
         typeof endCurrentInteraction === 'function' &&
         typeof getConcludingRemark === 'function' &&
         typeof showMessage === 'function' &&
         typeof hideMessage === 'function';

     if (!dependenciesMet) {
        console.error("Core function(s) missing during turn processing.");
        if (typeof showMessage === 'function') showMessage("Error processing turn: Core functions missing.", "error");
        return;
     }

    conversationHistory.push({ role: "user", parts: [{ text: playerTurnText }] });
    addDialogueLog(playerName, playerTurnText);

    isLLMThinking = true;
    const canAppraiseNext = currentCustomerType === 'seller' && !appraisalUsedThisTurn;
    updateButtonStates({ type: currentCustomerType, canInteract: false, canEnd: false, canAppraise: canAppraiseNext });
    showMessage("Waiting for customer response...", "info");

    const llmResponseText = await callGeminiApi(apiKey, conversationHistory, currentCustomer.systemPrompt);

    if (!currentCustomer) { // Check if interaction ended while waiting for API
        console.log("Interaction ended while waiting for LLM response.");
        isLLMThinking = false;
        hideMessage();
        return;
    }

    if (llmResponseText) {
        conversationHistory.push({ role: "model", parts: [{ text: llmResponseText }] });
        const tags = parseTags(llmResponseText);
        let interactionEnded = false;
        let finalRemark = null;

        // --- Common Updates (Info Reveal, Patience) ---
         let infoRevealed = false;
         if (tags.REVEALED_NAME && !currentCustomer.customerData.revealedInfo.name) { currentCustomer.customerData.revealedInfo.name = true; currentCustomer.customerData.name = tags.REVEALED_NAME; infoRevealed = true; }
         if (tags.REVEALED_AGE && !currentCustomer.customerData.revealedInfo.age) { currentCustomer.customerData.revealedInfo.age = true; currentCustomer.customerData.age = tags.REVEALED_AGE; infoRevealed = true; }
         if (tags.REVEALED_OCCUPATION && !currentCustomer.customerData.revealedInfo.occupation) { currentCustomer.customerData.revealedInfo.occupation = true; currentCustomer.customerData.occupation = tags.REVEALED_OCCUPATION; infoRevealed = true; }
         if (infoRevealed) { displayCustomerInfo(currentCustomer.customerData); }

        if (tags.PATIENCE !== undefined && typeof tags.PATIENCE === 'number') {
            currentCustomer.customerData.currentPatience += tags.PATIENCE; // LLM provides negative value for decrease
            currentCustomer.customerData.currentPatience = Math.max(0, currentCustomer.customerData.currentPatience);
            updatePatienceDisplay(currentCustomer.customerData.currentPatience);
            if (currentCustomer.customerData.currentPatience <= 0) {
                addDialogueLog(currentCustomer.customerData.name, llmResponseText); // Log last message before leaving
                showMessage("Customer lost patience!", "error", 4000);
                interactionEnded = true;
                const itemForRemark = currentCustomer.itemData || currentCustomer.itemToSell;
                finalRemark = await getConcludingRemark(apiKey, currentCustomer.customerData, itemForRemark, "patience_zero", null, currentCustomerType);
                if(finalRemark && currentCustomer) addDialogueLog(currentCustomer.customerData.name, finalRemark);
                // Use timeout to allow remark to be seen before clearing
                setTimeout(() => { if (currentCustomer) endCurrentInteraction("patience_zero"); }, 1500); // Check currentCustomer again in timeout
            }
        }

        // --- Type-Specific Updates (Price/Offer, Acceptance) ---
        if (!interactionEnded) {
            if (currentCustomerType === 'seller') {
                // Seller Asking Price Update
                if (tags.PRICE_ASK !== undefined && typeof tags.PRICE_ASK === 'number') {
                    currentCustomer.currentAskingPrice = tags.PRICE_ASK;
                    displayItemInfo(currentCustomer.itemData, currentCustomer.currentAskingPrice, 'seller');
                }
                // Seller Accepted Player's Offer
                if (tags.ACCEPT_OFFER !== undefined && typeof tags.ACCEPT_OFFER === 'number') {
                    const acceptedOffer = tags.ACCEPT_OFFER;
                    if (playerCash >= acceptedOffer) {
                        addDialogueLog(currentCustomer.customerData.name, llmResponseText); // Log acceptance
                        showMessage(`Deal agreed at $${acceptedOffer}!`, 'success', 4000);
                        interactionEnded = true;
                        finalizeDeal(acceptedOffer); // Finalize purchase (includes endCurrentInteraction call)
                    } else {
                         addDialogueLog(currentCustomer.customerData.name, llmResponseText);
                         addDialogueLog(playerName, `Wait, I don't actually have $${acceptedOffer}... My mistake.`);
                         showMessage(`You can't afford $${acceptedOffer}!`, "error", 3000);
                         // Let conversation continue, player needs to retract or offer less
                    }
                }
            } else { // Buyer
                // Buyer Offer Update
                if (tags.PRICE_OFFER !== undefined && typeof tags.PRICE_OFFER === 'number') {
                    currentCustomer.currentOffer = tags.PRICE_OFFER;
                    displayItemInfo(currentCustomer.itemToSell, currentCustomer.currentOffer, 'buyer');
                }
                // Buyer Accepted Player's Asking Price
                if (tags.ACCEPT_PRICE !== undefined && typeof tags.ACCEPT_PRICE === 'number') {
                    const acceptedPrice = tags.ACCEPT_PRICE;
                    addDialogueLog(currentCustomer.customerData.name, llmResponseText); // Log acceptance
                    showMessage(`Sale agreed at $${acceptedPrice}!`, 'success', 4000);
                    interactionEnded = true;
                    finalizeSale(currentCustomer.itemToSell, acceptedPrice); // Finalize sale (includes endCurrentInteraction call)
                }
            }
        }

        // If interaction didn't end naturally by acceptance or patience=0
        if (!interactionEnded) {
            addDialogueLog(currentCustomer.customerData.name, llmResponseText);
            const canAppraiseAfterTurn = currentCustomerType === 'seller' && !appraisalUsedThisTurn;
            updateButtonStates({ type: currentCustomerType, canInteract: true, canEnd: true, canAppraise: canAppraiseAfterTurn });
            hideMessage();
        }

    } else {
        // Handle API error during conversation
        showMessage("Customer seems to have trouble responding.", "error");
        const canAppraiseAfterError = currentCustomerType === 'seller' && !appraisalUsedThisTurn;
        updateButtonStates({ type: currentCustomerType, canInteract: true, canEnd: true, canAppraise: canAppraiseAfterError });
    }
    isLLMThinking = false; // Reset flag AFTER all processing
}


/**
 * Handles player clicking the "Send" button for chat messages.
 */
function handleSendMessage() {
    const playerInputElementRef = document.getElementById('player-input');
    if (!playerInputElementRef) {
        console.error("Player input element not found in handleSendMessage");
        return;
    }
    const playerText = playerInputElementRef.value.trim();
    if (playerText && currentCustomer && !isLLMThinking) {
        playerInputElementRef.value = ''; // Clear the textarea
        processPlayerTurn(playerText);
    } else if (!playerText) {
        if (typeof showMessage === 'function') showMessage("Please type a message.", "info", 2000);
    }
}

/**
 * REMOVED: handleMakeOffer function is no longer needed.
 */

/**
 * Handles player clicking the "Accept Price" (Seller) or "Accept Offer" (Buyer) button.
 */
async function handleAcceptPrice() {
     if (!currentCustomer || isLLMThinking) return;

     let finalRemark = null;

     if (currentCustomerType === 'seller') {
         const currentAsking = currentCustomer.currentAskingPrice;
         if (typeof currentAsking !== 'number' || currentAsking <= 0) {
             if (typeof showMessage === 'function') showMessage("Cannot accept price - no valid asking price from seller.", "error", 3000);
             return;
         }
         if (playerCash >= currentAsking) {
             addDialogueLog(playerName, `Okay, I accept your price of $${currentAsking}.`);
             isLLMThinking = true;
             updateButtonStates({ type: 'seller', canInteract: false, canEnd: false, canAppraise: false });

             if (typeof getConcludingRemark === 'function') {
                 finalRemark = await getConcludingRemark(apiKey, currentCustomer.customerData, currentCustomer.itemData, "deal_success_player_accept", currentAsking, 'seller');
                 // Add remark only if customer still exists (in case of race condition)
                 if(finalRemark && currentCustomer) { addDialogueLog(currentCustomer.customerData.name, finalRemark); }
             }
             isLLMThinking = false;
             // Check again if customer exists before finalizing
             if(currentCustomer) { finalizeDeal(currentAsking); } // Finalize purchase

         } else {
             if (typeof showMessage === 'function') showMessage(`You cannot afford the asking price of $${currentAsking}. You only have $${playerCash}.`, "error", 4000);
         }
     } else { // Buyer
         const currentOffer = currentCustomer.currentOffer;
         if (typeof currentOffer !== 'number' || currentOffer <= 0) {
             if (typeof showMessage === 'function') showMessage("Cannot accept offer - no valid offer from buyer.", "error", 3000);
             return;
         }
         addDialogueLog(playerName, `Okay, I accept your offer of $${currentOffer}.`);
         isLLMThinking = true;
         updateButtonStates({ type: 'buyer', canInteract: false, canEnd: false });

         if (typeof getConcludingRemark === 'function') {
             finalRemark = await getConcludingRemark(apiKey, currentCustomer.customerData, currentCustomer.itemToSell, "deal_success_player_accept", currentOffer, 'buyer');
             if(finalRemark && currentCustomer) { addDialogueLog(currentCustomer.customerData.name, finalRemark); }
         }
         isLLMThinking = false;
         if(currentCustomer) { finalizeSale(currentCustomer.itemToSell, currentOffer); } // Finalize sale
     }
}


/**
 * Finalizes the purchase deal (Seller Customer), updates cash/inventory, and ends interaction.
 * @param {number} purchasePrice - The agreed price for the item.
 */
function finalizeDeal(purchasePrice) {
    // Check state again before modifying
    if (!currentCustomer || currentCustomerType !== 'seller' || !currentCustomer.itemData) {
        console.error("Cannot finalize deal: Invalid state at time of finalization.", { currentCustomer, currentCustomerType });
        // Attempt to reset state partially if possible
        if (typeof updateButtonStates === 'function') updateButtonStates({ type: 'none', canInteract: false, canEnd: false, canAppraise: false });
        if (saveGameButton) saveGameButton.disabled = false; // Re-enable save
        return;
    }
    console.log(`Finalizing purchase for ${currentCustomer.itemData.name} at $${purchasePrice}`);

    playerCash -= purchasePrice;
    updateCashDisplay(playerCash);

    const purchasedItem = {
        name: currentCustomer.itemData.name,
        description: currentCustomer.itemData.description,
        condition: currentCustomer.itemData.condition,
        rarity: currentCustomer.itemData.rarity,
        purchasePrice: purchasePrice,
        baseValue: currentCustomer.itemData.baseValue,
        actualValue: currentCustomer.itemData.actualValue,
        conditionMultiplier: currentCustomer.itemData.conditionMultiplier,
        rarityMultiplier: currentCustomer.itemData.rarityMultiplier,
    };
    shopInventory.push(purchasedItem);
    console.log("Inventory:", shopInventory);
    // Ensure displayInventory exists before calling
    if (typeof displayInventory === 'function') displayInventory(shopInventory); else console.error("displayInventory not found");
    if (typeof showMessage === 'function') showMessage(`Purchase complete! Acquired ${purchasedItem.name} for $${purchasePrice}.`, "success", 5000);

    // End interaction *after* state updates
    endCurrentInteraction("deal_made_purchase"); // Removed timeout, end interaction directly
}

/**
 * Finalizes the sale deal (Buyer Customer), updates cash/inventory, and ends interaction.
 * @param {object} soldItem - The item object from shopInventory that was sold.
 * @param {number} salePrice - The agreed price for the item.
 */
function finalizeSale(soldItem, salePrice) {
     // Check state again before modifying
    if (!currentCustomer || currentCustomerType !== 'buyer' || !soldItem) {
         console.error("Cannot finalize sale: Invalid state at time of finalization.", { currentCustomer, currentCustomerType, soldItem });
         if (typeof updateButtonStates === 'function') updateButtonStates({ type: 'none', canInteract: false, canEnd: false, canAppraise: false });
         if (saveGameButton) saveGameButton.disabled = false; // Re-enable save
         return;
    }
    console.log(`Finalizing sale for ${soldItem.name} at $${salePrice}`);

    playerCash += salePrice;
    updateCashDisplay(playerCash);

    // Remove item from inventory
    const itemIndex = shopInventory.findIndex(item => item === soldItem); // Find by object reference
    if (itemIndex > -1) {
        shopInventory.splice(itemIndex, 1);
        console.log("Item removed from inventory.");
    } else {
        // Fallback find by name/purchasePrice (less reliable)
        const fallbackIndex = shopInventory.findIndex(item => item.name === soldItem.name && item.purchasePrice === soldItem.purchasePrice);
        if (fallbackIndex > -1) {
             shopInventory.splice(fallbackIndex, 1);
             console.warn("Removed item by fallback index (name/purchasePrice match).");
        } else {
            console.error("Could not find sold item in inventory to remove:", soldItem);
        }
    }

    console.log("Inventory:", shopInventory);
    if (typeof displayInventory === 'function') displayInventory(shopInventory); else console.error("displayInventory not found");
    if (typeof showMessage === 'function') showMessage(`Sale complete! Sold ${soldItem.name} for $${salePrice}.`, "success", 5000);

    // End interaction *after* state updates
    endCurrentInteraction("deal_made_sale"); // Removed timeout
}


/**
 * Handles the Appraise Item button click (Only applicable for Sellers).
 * Retrieves multipliers for revealed condition/rarity.
 */
function handleAppraiseItem() {
    // Check conditions for appraisal
    if (currentCustomerType !== 'seller' || !currentCustomer || isLLMThinking || appraisalUsedThisTurn) {
        console.log("Cannot appraise:", { type: currentCustomerType, customer: !!currentCustomer, thinking: isLLMThinking, used: appraisalUsedThisTurn });
        if (appraisalUsedThisTurn) showMessage("You can only appraise once per customer.", "info", 2000);
        else if (currentCustomerType === 'buyer') showMessage("You cannot appraise items you are selling.", "info", 3000);
        return;
    }
    if (!currentCustomer.itemData) {
        console.error("Appraisal failed: Seller's item data is missing.");
        showMessage("Cannot perform appraisal: item data missing.", "error");
        return;
    }
    // Check if multiplier data objects are available globally
    if (typeof itemConditions === 'undefined' || typeof itemRarities === 'undefined') {
        console.error("Appraisal failed: itemConditions or itemRarities data not found.");
        showMessage("Appraisal data missing. Cannot perform appraisal.", "error");
        return;
    }

    console.log("Appraising item...");
    appraisalUsedThisTurn = true; // Mark as used
    const appraiseButtonRef = document.getElementById('appraise-button');
    if (appraiseButtonRef) appraiseButtonRef.disabled = true; // Disable button visually immediately

    const appraisalResults = { value: null, condition: null, conditionMultiplier: null, rarity: null, rarityMultiplier: null };
    let revealedCount = 0;
    let resultText = "Appraisal results: ";
    const resultsList = [];

    // Reveal Base Value (Range)
    if (Math.random() < 0.5 && currentCustomer.itemData.baseValue) {
        const range = Math.max(10, Math.round(currentCustomer.itemData.baseValue * 0.2));
        const lowerBound = Math.max(1, currentCustomer.itemData.baseValue - range);
        const upperBound = currentCustomer.itemData.baseValue + range;
        appraisalResults.value = `Around $${lowerBound} - $${upperBound}`;
        resultsList.push(`estimated base value around $${lowerBound}-${upperBound}`);
        revealedCount++;
    }

    // Reveal Condition & Multiplier
    if (Math.random() < 0.5 && currentCustomer.itemData.condition) {
        const conditionKey = currentCustomer.itemData.condition;
        appraisalResults.condition = conditionKey;
        appraisalResults.conditionMultiplier = itemConditions[conditionKey] ?? null;
        resultsList.push(`true condition is ${appraisalResults.condition}${appraisalResults.conditionMultiplier !== null ? ` (x${appraisalResults.conditionMultiplier.toFixed(2)})` : ''}`);
        revealedCount++;
    }

    // Reveal Rarity & Multiplier
    if (Math.random() < 0.5 && currentCustomer.itemData.rarity) {
        const rarityKey = currentCustomer.itemData.rarity;
        appraisalResults.rarity = rarityKey;
        appraisalResults.rarityMultiplier = itemRarities[rarityKey]?.[0] ?? null;
        resultsList.push(`rarity seems to be ${appraisalResults.rarity}${appraisalResults.rarityMultiplier !== null ? ` (x${appraisalResults.rarityMultiplier.toFixed(1)})` : ''}`);
        revealedCount++;
    }

    // Update UI
    if (typeof displayAppraisalInfo === 'function') displayAppraisalInfo(appraisalResults); else console.error("displayAppraisalInfo function not found!");

    // Construct feedback message
    if (revealedCount === 0) {
        resultText += "Couldn't determine much about this item.";
    } else {
        resultText += `You found out the ${resultsList.join(', and the ')}.`;
    }

    if (typeof addDialogueLog === 'function') addDialogueLog("System", resultText);
    showMessage("Appraisal complete.", "info", 3000);

    // Ensure other buttons remain enabled/disabled correctly
    updateButtonStates({ type: 'seller', canInteract: !isLLMThinking, canEnd: !isLLMThinking, canAppraise: false });
}


/**
 * Handles player clicking the "End Negotiation" button.
 */
async function handleEndNegotiation() {
    if (!currentCustomer || isLLMThinking) return;
    console.log("Player manually ending negotiation.");
    isLLMThinking = true;
    // Disable all buttons
    updateButtonStates({ type: currentCustomerType, canInteract: false, canEnd: false, canAppraise: false });

    const endMessage = currentCustomerType === 'seller'
        ? "Actually, I don't think we can make a deal today. Thanks for your time."
        : "Sorry, I don't think I can sell this item to you today.";
    addDialogueLog(playerName, endMessage);

    let finalRemark = null; // Define finalRemark before try block
    try {
        if (typeof getConcludingRemark === 'function') {
            const itemForRemark = currentCustomer.itemData || currentCustomer.itemToSell;
            if (itemForRemark) { // Ensure item exists before calling
                 finalRemark = await getConcludingRemark(apiKey, currentCustomer.customerData, itemForRemark, "manual_leave", null, currentCustomerType);
            } else {
                console.warn("Could not get concluding remark: item data missing.");
            }
        }
    } catch (error) {
        console.error("Error getting concluding remark:", error);
    } finally {
        isLLMThinking = false; // Reset flag after potential API call or error
        // Add remark only if customer still exists
        if (finalRemark && currentCustomer) {
            addDialogueLog(currentCustomer.customerData.name, finalRemark);
        }
        // End interaction regardless of remark success, check customer again
        if(currentCustomer) {
            // Use timeout to allow remark to display
            setTimeout(() => { if (currentCustomer) endCurrentInteraction("manual"); }, 500);
        }
    }
}


/**
 * Ends the current customer interaction and resets the state.
 * @param {string} reason - Describes why the interaction ended (e.g., "deal_made_purchase", "patience_zero", "manual", "load_game", "error_setup").
 */
function endCurrentInteraction(reason = "ended") {
    console.log(`Ending customer interaction (${reason}).`);

    // Store necessary info before clearing, check if customer exists first
    const customerLeft = currentCustomer?.customerData?.name || "Customer";
    const wasDealOrSale = reason.startsWith("deal_made");

    // Reset core state
    currentCustomer = null;
    currentCustomerType = null;
    conversationHistory = [];
    isLLMThinking = false;
    appraisalUsedThisTurn = false; // Ensure reset here too

    // --- Enable Save Game Button ---
    if (saveGameButton) saveGameButton.disabled = false;

    // Disable interaction buttons & Enable New Customer
    if (typeof updateButtonStates === 'function') {
        updateButtonStates({ type: 'none', canInteract: false, canEnd: false, canAppraise: false });
    } else { console.error("updateButtonStates not found"); }

    if (newCustomerButton) {
        newCustomerButton.disabled = !apiKey;
    } else { console.error("newCustomerButton not found"); }

    // Clear input fields locally
    const playerInputElementRef = document.getElementById('player-input');
    if(playerInputElementRef) playerInputElementRef.value = '';

    if (typeof hideMessage === 'function') hideMessage();

    // Conditional Clearing / UI Reset
    // Don't clear UI immediately if ending due to loading a game
    if (reason !== "load_game") {
        if (!wasDealOrSale) {
            // If NOT a successful deal/sale, clear UI after a delay
            setTimeout(() => {
                console.log("Clearing customer area and dialogue log (no deal).");
                if (typeof clearCustomerArea === 'function') clearCustomerArea();
                if (typeof clearDialogueLog === 'function') clearDialogueLog();
                if (typeof addDialogueLog === 'function') addDialogueLog("System", `${customerLeft} has left the shop.`);
            }, 1500); // Delay to allow reading final messages
        } else {
            // If it WAS a successful deal/sale, add system message but keep info visible
            const action = reason === "deal_made_purchase" ? "making a purchase" : "making a sale";
            console.log(`Keeping customer area and dialogue log visible after ${action}.`);
            if (typeof addDialogueLog === 'function') addDialogueLog("System", `${customerLeft} has left after ${action}.`);
            // Ensure appraisal panel is hidden and button disabled after deal/sale
            if (typeof displayAppraisalPanel === 'function') displayAppraisalPanel(false);
             const appraiseButtonRef = document.getElementById('appraise-button');
             if (appraiseButtonRef) appraiseButtonRef.disabled = true;
        }
    } else {
        // If loading game, UI clearing/resetting is handled by proceedWithLoad
        console.log("Interaction ended due to game load.");
    }
}


/**
 * Updates the enabled/disabled state of the New Customer button based on API key presence.
 */
function updateApiKeyStatus() {
    const statusElement = document.getElementById('api-key-status');
    const messageAreaRef = document.getElementById('message-area');

    if (newCustomerButton) {
        newCustomerButton.disabled = !apiKey;
        if (!apiKey) {
            if (typeof showMessage === 'function') showMessage("API Key needed to start.", "info");
        } else {
            // Hide message only if there isn't an active error message
            if (typeof hideMessage === 'function' && messageAreaRef && !messageAreaRef.classList.contains('error')) {
                 if(messageAreaRef.classList.contains('info')) {
                    hideMessage();
                 }
            }
        }
    }
    // Optional: Update a status indicator
    if (statusElement) {
        statusElement.textContent = apiKey ? "API Key Loaded" : "API Key Missing";
        statusElement.style.color = apiKey ? "green" : "red";
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Options, Settings, Avatar, Player Name listeners
    if (optionsButton) optionsButton.addEventListener('click', openOptionsModal); else console.error("Options button not found!");
    if (closeOptionsButton) closeOptionsButton.addEventListener('click', closeOptionsModal); else console.error("Close options button not found!");
    if (optionsModal) { optionsModal.addEventListener('click', (event) => { if (event.target === optionsModal) closeOptionsModal(); }); }
    if (saveApiKeyButton) saveApiKeyButton.addEventListener('click', saveApiKey); else console.error("Save API key button not found!");
    if (avatarStyleSelect) avatarStyleSelect.addEventListener('change', handleAvatarStyleChange); else console.error("Avatar style select not found!");
    if (changeAvatarButton) changeAvatarButton.addEventListener('click', changePlayerAvatar); else console.error("Change avatar button not found!");
    if (editNameButton) editNameButton.addEventListener('click', () => toggleNameEdit(true)); else console.error("Edit name button not found!");
    if (saveNameButton) saveNameButton.addEventListener('click', savePlayerName); else console.error("Save name button not found!");
    if (playerNameInput) { playerNameInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); savePlayerName(); } }); } else { console.error("Player name input not found!"); }

    // --- Game Control Listeners ---
    const newCustomerBtn = document.getElementById('new-customer-button');
    const endNegotiationBtn = document.getElementById('end-negotiation-button');
    const sendBtn = document.getElementById('send-button');
    const playerInputEl = document.getElementById('player-input'); // Textarea
    const acceptPriceBtn = document.getElementById('accept-price-button');
    const appraiseBtn = document.getElementById('appraise-button');

    if (newCustomerBtn) { newCustomerBtn.addEventListener('click', startNewCustomerInteraction); } else { console.error("New Customer button not found!"); }
    if (endNegotiationBtn) { endNegotiationBtn.addEventListener('click', handleEndNegotiation); } else { console.error("End Negotiation button not found!"); }
    if (sendBtn) { sendBtn.addEventListener('click', handleSendMessage); } else { console.error("Send button not found!"); }
    if (playerInputEl) {
        playerInputEl.addEventListener('keydown', (event) => {
            const currentSendButton = document.getElementById('send-button');
            // Send on Enter (without Shift) only if interaction is active and send button is enabled
            if (event.key === 'Enter' && !event.shiftKey && currentCustomer && currentSendButton && !currentSendButton.disabled && !isLLMThinking) {
                event.preventDefault();
                handleSendMessage();
            }
        });
    } else { console.error("Player input element (textarea) not found!"); }
    if (acceptPriceBtn) { acceptPriceBtn.addEventListener('click', handleAcceptPrice); } else { console.error("Accept Price button not found!"); }
    if (appraiseBtn) {
        appraiseBtn.addEventListener('click', handleAppraiseItem);
    } else {
        console.error("Appraise button not found!");
    }

    // --- Save/Load Listeners ---
    if (saveGameButton) {
        saveGameButton.addEventListener('click', saveGame);
    } else {
        console.error("Save Game button not found!");
    }
    if (loadGameButton) {
        loadGameButton.addEventListener('click', loadGame);
    } else {
        console.error("Load Game button not found!");
    }

    // Inventory Button listeners setup is called from ui.js via DOMContentLoaded
} // Closing brace for setupEventListeners

// --- Initialization ---
function initializeGame() {
    console.log("Initializing Pawn Shop Game...");
    // Load settings first - These should ideally not fail critically
    loadAvatarStyle();
    loadApiKey();
    loadPlayerName();

    // --- Check for saved game data ---
    const savedDataExists = localStorage.getItem(SAVE_GAME_KEY) !== null;
    if (loadGameButton) {
        loadGameButton.disabled = !savedDataExists; // Enable load button only if save data exists
    } else { console.warn("Load Game button not found during init."); }
    if (saveGameButton) {
        saveGameButton.disabled = false; // Start with save enabled (assuming no customer)
    } else { console.warn("Save Game button not found during init."); }
    // --- End Save/Load Check ---

    // Update UI based on loaded settings (or defaults)
    const savedPlayerSeed = localStorage.getItem(AVATAR_SEED_KEY) || defaultPlayerSeed;
    updatePlayerAvatar(savedPlayerSeed); // Assumes avatar elements exist

    // Setup listeners for interactions
    setupEventListeners(); // This should be called AFTER elements are potentially available

     // Initial UI state setup (ensure functions are loaded from other files)
     // Use checks to prevent errors if functions aren't loaded yet
     if (typeof clearCustomerArea === 'function') clearCustomerArea(); else console.error("clearCustomerArea not found");
     if (typeof updateCashDisplay === 'function') updateCashDisplay(playerCash); else console.error("updateCashDisplay not found");
     if (typeof displayInventory === 'function') displayInventory(shopInventory); else console.error("displayInventory not found");
     if (typeof toggleInventoryDisplay === 'function') toggleInventoryDisplay(false); else console.error("toggleInventoryDisplay not found");
     if (typeof updateButtonStates === 'function') {
        // Start with all interaction buttons disabled, type 'none'
        updateButtonStates({ type: 'none', canInteract: false, canEnd: false, canAppraise: false });
     } else { console.error("updateButtonStates not found"); }
     if (typeof clearDialogueLog === 'function') clearDialogueLog(); else console.error("clearDialogueLog not found");

    console.log("Game Initialized.");
    updateApiKeyStatus(); // Update new customer button based on API key presence

    if (savedDataExists) {
        if (typeof showMessage === 'function') showMessage("Saved game data found. Use Load Game in Options.", "info", 5000);
    }
}

// --- Start Game ---
// Ensure this runs after the DOM is fully loaded and scripts are parsed
document.addEventListener('DOMContentLoaded', initializeGame);
