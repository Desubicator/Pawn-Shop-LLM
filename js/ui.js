/**
 * ui.js
 * Contains functions for updating the game's user interface,
 * handling differences between seller and buyer interactions.
 * Actions simplified to use only the main message input.
 */

// --- DOM Element References ---
const customerPortraitImg = document.getElementById('customer-portrait');
const customerNameSpan = document.getElementById('customer-name');
const customerNameHeadingDisplay = document.getElementById('customer-name-heading-display');
const customerAgeSpan = document.getElementById('customer-age');
const customerOccupationSpan = document.getElementById('customer-occupation');
const customerPatienceSpan = document.getElementById('customer-patience');

// Item Info Area
const itemInfoPanelHeading = document.querySelector('#item-info-panel .panel-heading');
const itemNameSpan = document.getElementById('item-name');
const itemDescriptionSpan = document.getElementById('item-description');
const itemPriceLabelSpan = document.getElementById('item-price-label');
const itemPriceValueSpan = document.getElementById('item-price-value');

// Appraisal Panel & Info
const appraisalPanel = document.getElementById('appraisal-panel');
const appraisalValueSpan = document.getElementById('appraisal-value');
const appraisalConditionSpan = document.getElementById('appraisal-condition');
const appraisalRaritySpan = document.getElementById('appraisal-rarity');
const appraiseButton = document.getElementById('appraise-button');

// Dialogue & Messages
const dialogueLog = document.getElementById('dialogue-log');
const messageArea = document.getElementById('message-area');

// Player & Shop Info
const playerCashSpan = document.getElementById('player-cash');
const inventoryButton = document.getElementById('inventory-button');

// Player Actions Area Elements (Simplified)
const playerInputElement = document.getElementById('player-input'); // Now a textarea
const sendButton = document.getElementById('send-button');
const acceptPriceButton = document.getElementById('accept-price-button'); // Text updated based on context
// const offerInputLabel = document.querySelector('label[for="offer-input"]'); // REMOVED
// const offerInputElement = document.getElementById('offer-input'); // REMOVED
// const makeOfferButton = document.getElementById('make-offer-button'); // REMOVED

// Inventory Modal References
const inventoryModal = document.getElementById('inventory-modal');
const inventoryCardsContainer = document.getElementById('inventory-cards-container');
const closeInventoryModal = document.getElementById('close-inventory-modal');


// --- UI Update Functions ---

/**
 * Displays customer information (name, age, occupation, patience).
 * Handles revealed status.
 * @param {object | null} customer - The customer data object or null to clear.
 */
function displayCustomerInfo(customer) {
    // Ensure elements exist before updating
    if (!customerNameSpan || !customerAgeSpan || !customerOccupationSpan || !customerNameHeadingDisplay || !customerPatienceSpan) {
        console.error("Customer detail/heading/patience spans not found.");
        return;
    }
    if (customer) {
        const displayName = customer.revealedInfo?.name ? customer.name : '???';
        customerNameSpan.textContent = displayName;
        customerNameHeadingDisplay.textContent = displayName; // Update heading too
        customerAgeSpan.textContent = customer.revealedInfo?.age ? customer.age : '???';
        customerOccupationSpan.textContent = customer.revealedInfo?.occupation ? customer.occupation : '???';
        updatePatienceDisplay(customer.currentPatience ?? '--'); // Use currentPatience
    } else {
        customerNameSpan.textContent = '???';
        customerNameHeadingDisplay.textContent = '???'; // Reset heading
        customerAgeSpan.textContent = '???';
        customerOccupationSpan.textContent = '???';
        updatePatienceDisplay('--');
    }
}

/**
 * Updates the customer portrait image.
 * @param {string | null} url - The URL of the avatar image or null for default.
 */
function updateCustomerPortrait(url) {
    if (customerPortraitImg) {
        if (url) {
            customerPortraitImg.src = url;
            customerPortraitImg.alt = "Customer Portrait";
        } else {
            // Default placeholder when no customer
            customerPortraitImg.src = 'https://placehold.co/240x200/f9f9f9/333?text=Customer';
             customerPortraitImg.alt = "Waiting for customer";
        }
    } else {
        console.error("Customer portrait image element not found.");
    }
}

/**
 * Displays item information, adapting labels for sellers vs. buyers.
 * @param {object | null} item - The item data object (from seller or inventory). Null to clear.
 * @param {number | string | null} priceOrOffer - The seller's asking price or buyer's current offer.
 * @param {'seller' | 'buyer' | 'none'} context - The type of interaction.
 */
function displayItemInfo(item, priceOrOffer, context) {
     if (!itemNameSpan || !itemDescriptionSpan || !itemPriceLabelSpan || !itemPriceValueSpan || !itemInfoPanelHeading) {
        console.error("Item info spans or heading not found.");
        return;
    }

    if (item && context !== 'none') {
        itemNameSpan.textContent = item.name || '...';
        itemDescriptionSpan.textContent = item.description || '...';

        if (context === 'seller') {
            itemInfoPanelHeading.textContent = "Item for Sale"; // Seller is selling
            itemPriceLabelSpan.textContent = 'Asking Price:';
            itemPriceValueSpan.textContent = (typeof priceOrOffer === 'number') ? `$${priceOrOffer}` : (priceOrOffer || '???');
        } else { // Buyer
            itemInfoPanelHeading.textContent = "Item of Interest"; // Buyer is interested in player's item
            itemPriceLabelSpan.textContent = 'Current Offer:'; // Buyer is offering
             itemPriceValueSpan.textContent = (typeof priceOrOffer === 'number') ? `$${priceOrOffer}` : (priceOrOffer || '???');
        }
    } else {
        // Reset to default state when no customer or item
        itemInfoPanelHeading.textContent = "Item Info";
        itemNameSpan.textContent = 'Waiting for customer...';
        itemDescriptionSpan.textContent = '';
        itemPriceLabelSpan.textContent = 'Price/Offer:';
        itemPriceValueSpan.textContent = '';
    }
}

/**
 * Shows or hides the entire appraisal panel.
 * @param {boolean} show - True to show, false to hide.
 */
function displayAppraisalPanel(show) {
    if (appraisalPanel) {
        appraisalPanel.style.display = show ? 'block' : 'none';
    } else {
        console.error("Appraisal panel element not found.");
    }
}


/**
 * Updates the appraisal information display within the panel.
 * @param {object} results - Object with { value, condition, conditionMultiplier, rarity, rarityMultiplier } properties. Null values mean not revealed.
 */
function displayAppraisalInfo(results) {
    if (!appraisalValueSpan || !appraisalConditionSpan || !appraisalRaritySpan) {
        console.error("Appraisal info spans not found.");
        return; // Don't try to update if elements are missing
    }

    // Update value span
    appraisalValueSpan.textContent = results.value !== null ? results.value : '???';
    appraisalValueSpan.classList.toggle('revealed', results.value !== null);

    // Update condition span (with multiplier)
    let conditionText = '???';
    if (results.condition !== null) {
        conditionText = results.condition;
        if (results.conditionMultiplier !== null) {
            conditionText += ` (x${results.conditionMultiplier.toFixed(2)})`;
        }
    }
    appraisalConditionSpan.textContent = conditionText;
    appraisalConditionSpan.classList.toggle('revealed', results.condition !== null);

    // Update rarity span (with multiplier)
     let rarityText = '???';
    if (results.rarity !== null) {
        rarityText = results.rarity;
         if (results.rarityMultiplier !== null) {
            rarityText += ` (x${results.rarityMultiplier.toFixed(1)})`;
        }
    }
    appraisalRaritySpan.textContent = rarityText;
    appraisalRaritySpan.classList.toggle('revealed', results.rarity !== null);
}

/**
 * Resets the appraisal info panel back to '???' and ensures the panel is hidden.
 * Also ensures the appraise button is disabled.
 */
function resetAppraisalInfo() {
    // Reset text content and revealed status
    if (appraisalValueSpan) {
        appraisalValueSpan.textContent = '???';
        appraisalValueSpan.classList.remove('revealed');
    }
    if (appraisalConditionSpan) {
        appraisalConditionSpan.textContent = '???';
        appraisalConditionSpan.classList.remove('revealed');
    }
    if (appraisalRaritySpan) {
        appraisalRaritySpan.textContent = '???';
        appraisalRaritySpan.classList.remove('revealed');
    }
    // Disable the button
    if (appraiseButton) {
        appraiseButton.disabled = true;
    }
    // Hide the panel
    displayAppraisalPanel(false);
}


/**
 * Updates the displayed patience value.
 * @param {number | string} patienceValue - The value to display.
 */
function updatePatienceDisplay(patienceValue) {
    if (customerPatienceSpan) {
        customerPatienceSpan.textContent = patienceValue;
    }
}

/**
 * Clears the customer-specific areas of the UI, resetting labels and hiding appraisal.
 */
function clearCustomerArea() {
    displayCustomerInfo(null);
    displayItemInfo(null, null, 'none'); // Reset item info and labels
    updateCustomerPortrait(null);
    resetAppraisalInfo(); // Resets appraisal text and hides the panel
     // Reset Accept Price button text to default
     if (acceptPriceButton) acceptPriceButton.textContent = 'Accept Price';
}


/**
 * Cleans LLM response text for display in the dialogue log.
 * - Replaces descriptive tags (ITEM_NAME, ITEM_DESC, REVEALED_*) with their content.
 * - Replaces price/offer tags (PRICE_*, ACCEPT_*) with a formatted price string (e.g., "$123").
 * - Removes other functional tags (PATIENCE, REVEALED_AGE) entirely.
 * - Removes markdown bold markers (**).
 * Uses a multi-step process for robustness.
 * @param {string} text - Raw text from LLM.
 * @returns {string} Cleaned text suitable for the dialogue log.
 */
function cleanDialogueText(text) {
    if (!text) return "";
    let cleaned = text;

    // 1. Replace descriptive tags with their content
    const descriptiveTagRegex = /\[(ITEM_NAME|ITEM_DESC|REVEALED_NAME|REVEALED_OCCUPATION):\s*(.*?)\]/gi;
    cleaned = cleaned.replace(descriptiveTagRegex, (match, tagName, tagValue) => {
        // Return only the trimmed value that was inside the tag
        return tagValue.trim();
    });

    // 2. Replace price/offer tags with formatted price string
    // Ensures it captures only digits inside the price tags
    const priceTagRegex = /\[(PRICE_ASK|PRICE_OFFER|ACCEPT_PRICE|ACCEPT_OFFER):\s*(\d+)\s*\]/gi;
    cleaned = cleaned.replace(priceTagRegex, (match, tagName, tagValue) => {
        // Format as $XXX
        const price = parseInt(tagValue, 10);
        return isNaN(price) ? '' : `$${price}`; // Return formatted price or empty string if somehow not a number
    });

    // 3. Remove other specific remaining tags entirely (e.g., PATIENCE, REVEALED_AGE)
    // List the tags to be completely removed here
    const removalTagRegex = /\[(PATIENCE|REVEALED_AGE):\s*.*?\]/gi;
    cleaned = cleaned.replace(removalTagRegex, '');

    // 4. Remove any other potential leftover tag structures just in case
    // This is a fallback for unexpected tags
    const anyRemainingTagRegex = /\[[A-Z_]+:\s*.*?\]/gi;
    cleaned = cleaned.replace(anyRemainingTagRegex, '');

    // 5. Remove markdown bold markers
    cleaned = cleaned.replace(/\*\*/g, ''); // Remove all double asterisks

    // 6. Condense multiple spaces and trim
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    return cleaned;
}


/**
 * Adds a message to the dialogue log.
 * @param {string} speaker - 'Player', 'System', or the customer's name.
 * @param {string} rawText - The raw text from the player or LLM.
 */
function addDialogueLog(speaker, rawText) {
     if (!dialogueLog) { console.error("Dialogue log element not found!"); return; }

     // Remove initial placeholder if present
     const initialMessage = dialogueLog.querySelector('.italic');
     if (initialMessage && initialMessage.textContent.includes('Waiting for customer')) {
         dialogueLog.innerHTML = '';
     }

     const cleanedText = cleanDialogueText(rawText);
     if (cleanedText.length > 0) {
         const messageElement = document.createElement('p');
         const speakerStrong = document.createElement('strong');

         // Use the globally stored playerName if available
         const actualPlayerName = (typeof window !== 'undefined' && window.playerName) ? window.playerName : 'Player';

         speakerStrong.textContent = `${speaker}: `;

         // Apply styling based on speaker
         if (speaker === actualPlayerName) {
             messageElement.classList.add('player-message');
         } else if (speaker.toLowerCase() === 'system') {
             messageElement.classList.add('system-message');
         } else {
             messageElement.classList.add('customer-message'); // Default to customer style
         }

         messageElement.appendChild(speakerStrong);
         messageElement.appendChild(document.createTextNode(cleanedText)); // Use cleaned text
         dialogueLog.appendChild(messageElement);

         // Auto-scroll to bottom
         dialogueLog.scrollTop = dialogueLog.scrollHeight;
     } else {
         // Log if the entire message was just tags and got cleaned away
         if (rawText && rawText.trim().startsWith('[')) { // Basic check if original text seemed like only tags
              console.log("Log message likely contained only tags, suppressed after cleaning:", rawText);
         } else if (rawText) { // Log if non-empty raw text resulted in empty cleaned text for other reasons
              console.log("Log message suppressed (empty after cleaning):", rawText);
         }
         // Don't log if rawText was initially empty or just whitespace
     }
}

/**
 * Clears the dialogue log and adds the initial placeholder message.
 */
function clearDialogueLog() {
    if (dialogueLog) {
        dialogueLog.innerHTML = '<p class="italic">Waiting for customer...</p>';
    }
}

/**
 * Updates the player's cash display.
 * @param {number} cashAmount - The amount of cash the player has.
 */
function updateCashDisplay(cashAmount) {
    if (playerCashSpan) {
        playerCashSpan.textContent = `$${cashAmount}`;
    } else {
        console.error("Player cash span not found.");
    }
}

/**
 * Populates the inventory modal with item cards. Includes calculated value and profit/loss.
 * @param {Array} inventory - The shopInventory array.
 */
function displayInventory(inventory) {
    if (!inventoryCardsContainer) {
         console.error("Inventory cards container element not found.");
         return;
    }
    inventoryCardsContainer.innerHTML = ''; // Clear previous cards

    if (inventory && inventory.length > 0) {
        inventory.forEach(item => {
            const card = document.createElement('div');
            card.className = 'inventory-item-card'; // Use the defined CSS class

            // Calculate Estimated Sale Value (same as item.actualValue)
            let estimatedSaleValue = 'N/A';
            let profitLossClass = '';
            let profitLossAmount = null;

            // Use item.actualValue if available
            if (typeof item.actualValue === 'number') {
                 estimatedSaleValue = `$${item.actualValue}`;

                 // Calculate Profit/Loss compared to purchase price
                 if (typeof item.purchasePrice === 'number') {
                     profitLossAmount = item.actualValue - item.purchasePrice;
                     if (profitLossAmount > 0) {
                         profitLossClass = 'profit'; // Green text
                     } else if (profitLossAmount < 0) {
                         profitLossClass = 'loss'; // Red text
                     } else {
                         profitLossClass = 'neutral'; // Optional: Style for break-even
                     }
                 }
            } else if (typeof item.baseValue === 'number' && typeof item.conditionMultiplier === 'number' && typeof item.rarityMultiplier === 'number') {
                 // Fallback calculation if actualValue wasn't stored correctly
                 const calculatedValue = Math.max(1, Math.round(item.baseValue * item.conditionMultiplier * item.rarityMultiplier));
                 estimatedSaleValue = `$${calculatedValue}`;
                  if (typeof item.purchasePrice === 'number') {
                     profitLossAmount = calculatedValue - item.purchasePrice;
                     if (profitLossAmount > 0) profitLossClass = 'profit'; else if (profitLossAmount < 0) profitLossClass = 'loss'; else profitLossClass = 'neutral';
                 }
            }


            // Populate card content
            card.innerHTML = `
                <h3>${item.name || 'Unknown Item'}</h3>
                <p class="item-description">${item.description || 'No description.'}</p>
                <p><strong>Condition:</strong> ${item.condition || 'N/A'} ${typeof item.conditionMultiplier === 'number' ? `(x${item.conditionMultiplier.toFixed(2)})` : ''}</p>
                <p><strong>Rarity:</strong> ${item.rarity || 'N/A'} ${typeof item.rarityMultiplier === 'number' ? `(x${item.rarityMultiplier.toFixed(1)})` : ''}</p>
                <p><strong>Base Value:</strong> ${typeof item.baseValue === 'number' ? `$${item.baseValue}` : 'N/A'}</p>
                <div class="value-comparison">
                    <p><strong>Purchase Price:</strong> <span class="${profitLossClass}">${typeof item.purchasePrice === 'number' ? `$${item.purchasePrice}` : 'N/A'}</span></p>
                    <p><strong>Est. Sale Value:</strong> <span class="${profitLossClass}">${estimatedSaleValue}</span></p>
                    ${profitLossAmount !== null ? `<p><strong>Potential Profit/Loss:</strong> <span class="${profitLossClass}">${profitLossAmount >= 0 ? '+' : ''}$${profitLossAmount}</span></p>` : ''}
                </div>
            `;
            inventoryCardsContainer.appendChild(card);
        });
    } else {
        // Display empty message if no items
        inventoryCardsContainer.innerHTML = '<p class="italic text-gray-500 col-span-full">Inventory is empty.</p>';
    }
}

/**
 * Toggles the visibility of the inventory modal.
 * @param {boolean} show - True to show the modal, false to hide.
 */
function toggleInventoryDisplay(show) {
    if (inventoryModal) {
        if (show) {
            // Refresh content with current inventory before showing
            // Ensure shopInventory is accessible here (it should be global in main.js)
            if (typeof shopInventory !== 'undefined') {
                 displayInventory(shopInventory);
            } else {
                 console.error("shopInventory is not accessible in toggleInventoryDisplay");
                 inventoryCardsContainer.innerHTML = '<p class="italic text-red-500 col-span-full">Error loading inventory data.</p>';
            }
            inventoryModal.classList.remove('hidden');
            inventoryModal.classList.add('flex'); // Use flex for centering
        } else {
            inventoryModal.classList.add('hidden');
            inventoryModal.classList.remove('flex');
        }
    } else {
        console.error("Inventory modal element not found.");
    }
}

/**
 * Enables or disables UI elements and updates labels based on the game state and customer type.
 * REMOVED offer input/button logic.
 * @param {object} options - An object indicating state: { type: 'seller'|'buyer'|'none', canInteract, canEnd, canAppraise (seller only) }.
 */
function updateButtonStates(options = {}) {
    // Removed canOffer from parameters
    const { type = 'none', canInteract = false, canEnd = false, canAppraise = false } = options;

    // Get references to remaining relevant interactive elements
    const playerInputElement = document.getElementById('player-input'); // Textarea
    const sendButtonElement = document.getElementById('send-button');
    const acceptPriceButtonElement = document.getElementById('accept-price-button'); // Button for accept price/offer
    const endNegotiationButtonElement = document.getElementById('end-negotiation-button');
    const appraiseButtonElement = document.getElementById('appraise-button');

    // --- Enable/Disable Buttons ---
    if (playerInputElement) playerInputElement.disabled = !canInteract;
    if (sendButtonElement) sendButtonElement.disabled = !canInteract;
    // Removed offerInputElement and makeOfferButtonElement logic
    if (acceptPriceButtonElement) acceptPriceButtonElement.disabled = !canEnd; // Use canEnd for accept button
    if (endNegotiationButtonElement) endNegotiationButtonElement.disabled = !canEnd;
    // Appraise button is only relevant for sellers and depends on canAppraise flag
    if (appraiseButtonElement) appraiseButtonElement.disabled = !(type === 'seller' && canAppraise);

    // --- Update Labels and Placeholders ---
    // Only need to update the Accept button text now
    if (type === 'seller') {
        if (acceptPriceButtonElement) acceptPriceButtonElement.textContent = 'Accept Price';
    } else if (type === 'buyer') {
        if (acceptPriceButtonElement) acceptPriceButtonElement.textContent = 'Accept Offer';
    } else { // type === 'none' (Reset to default/seller view when no customer)
        if (acceptPriceButtonElement) acceptPriceButtonElement.textContent = 'Accept Price';
    }

    // Note: newCustomerButton state is handled separately in main.js/updateApiKeyStatus
}

// --- Message Functions ---
// (showMessage, hideMessage - unchanged)
function showMessage(text, type = 'info', duration = 0) {
    if (!messageArea) {
        console.warn("Message area not found. Message:", text);
        return;
    }
    messageArea.textContent = text;
    messageArea.className = 'text-sm'; // Reset classes first
    messageArea.classList.add(type); // Add type class (success, error, info)
    messageArea.style.display = 'block';

    // Clear message after duration if specified
    if (duration > 0) {
        const messageTextAtTimeout = text; // Capture current text
        setTimeout(() => {
            // Only hide if the message hasn't changed in the meantime
            if (messageArea.textContent === messageTextAtTimeout && messageArea.style.display !== 'none') {
                 hideMessage();
            }
        }, duration);
    }
}
function hideMessage() {
     if (messageArea) {
         messageArea.style.display = 'none';
         messageArea.textContent = '';
         messageArea.className = 'text-sm'; // Reset classes
     }
}


// --- Initial Setup for UI & Event Listeners ---
function setupInventoryModalListeners() {
    if (inventoryButton && closeInventoryModal && inventoryModal) {
        // Open modal
        inventoryButton.addEventListener('click', () => toggleInventoryDisplay(true));
        // Close modal with button
        closeInventoryModal.addEventListener('click', () => toggleInventoryDisplay(false));
        // Close modal by clicking overlay
        inventoryModal.addEventListener('click', (event) => {
            if (event.target === inventoryModal) { // Check if click is on the overlay itself
                toggleInventoryDisplay(false);
            }
        });
    } else {
        console.warn("Inventory modal elements not found for listener setup in ui.js");
    }
}

// Call this function when the DOM is ready (e.g., put it inside initializeGame or call separately)
document.addEventListener('DOMContentLoaded', setupInventoryModalListeners);
