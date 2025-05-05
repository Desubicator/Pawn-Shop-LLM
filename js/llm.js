/**
 * llm.js
 * Handles interactions with the Large Language Model (LLM) API (Gemini).
 * Includes prompt construction (for sellers & buyers), API call logic, and tag parsing.
 */

// --- Constants ---
const GEMINI_MODEL_NAME = "gemini-1.5-flash-latest"; // Or another suitable model

// --- Prompt Construction ---

/**
 * Constructs the detailed system prompt for the SELLER LLM agent.
 * Instructs the LLM to generate creative details based on constraints and theme hint.
 * Condition is hidden. Personal details revealed only when appropriate. Patience range updated.
 * @param {object} customerData - Contains Personality, Initial Patience, Prices, itemThemeHint.
 * @param {object} itemData - Contains Condition, Rarity, Calculated Values.
 * @returns {string} The formatted system prompt string for a seller.
 */
function constructCustomerPrompt(customerData, itemData) {
    // Validate essential input data needed for the prompt logic
    if (!customerData || typeof customerData.personality === 'undefined' || typeof customerData.initialAskingPrice === 'undefined' || typeof customerData.minimumAcceptablePrice === 'undefined' || typeof customerData.patience === 'undefined' || typeof customerData.itemThemeHint === 'undefined') {
        console.error("Cannot construct SELLER prompt: Missing essential customer data (personality, prices, patience, itemThemeHint).");
        return "";
    }
    if (!itemData || typeof itemData.condition === 'undefined' || typeof itemData.rarity === 'undefined') {
         console.error("Cannot construct SELLER prompt: Missing essential item data (condition, rarity).");
         return "";
    }

    // --- Core Instructions ---
    // Added emphasis on using numerical digits for price tags.
    let prompt = `You are acting as a character visiting a pawn shop. Your goal is to SELL an item to the shop owner (the player). Engage in natural conversation, negotiate the price, and adhere strictly to the persona and rules provided below.

**Your Task:**
1.  **Invent Character Details:** Based on the assigned personality, create a suitable Name, Age (between 18-80), and Occupation for your character. **Keep these details private initially.**
2.  **Invent Item Details:** Based on the provided Item Hint, Condition, and Rarity, create a plausible Item Name and a brief Item Description for the object you are trying to sell.
3.  **Roleplay:** Act out the negotiation according to your assigned personality and the rules below.

**Assigned Traits & Constraints:**
* **Personality:** You are generally **${customerData.personality}**. Let this trait strongly influence your tone, vocabulary, negotiation style, and how readily you reveal personal information.
* **Item Hint:** The item you are selling should fit the theme/type: **${customerData.itemThemeHint}**. Use this hint for inspiration.
* **Item's TRUE Condition:** The item's actual condition is **${itemData.condition}**. **IMPORTANT: DO NOT explicitly state this condition ("${itemData.condition}") to the player.** Instead, describe the item visually or functionally based on its condition. You might be vague, downplay flaws, or even lie slightly depending on your personality. Your description MUST use the tag: **[ITEM_DESC: Your Invented Description reflecting the condition implicitly]**.
* **Item Rarity:** The item you invent has a rarity level of **${itemData.rarity}**.
* **Initial Patience:** Your starting patience level is **${customerData.patience}** (out of 100).
* **Initial Asking Price:** You MUST state your initial asking price early. Your initial asking price is **$${customerData.initialAskingPrice}**. Use the tag: **[PRICE_ASK: ${customerData.initialAskingPrice}]**. **IMPORTANT: Use only numerical digits (e.g., 150, 2000) inside this tag.**
* **Minimum Acceptable Price:** Your absolute minimum price is **$${customerData.minimumAcceptablePrice}**. Do NOT reveal this.

**How to Reveal Invented Details (Use Tags!):**
* When you first mention the item's name: **[ITEM_NAME: Your Invented Item Name]**
* When you first describe the item (implicitly reflecting condition): **[ITEM_DESC: Your Invented Description]**
* **ONLY reveal your personal details (Name, Age, Occupation) if the player asks for them directly or if you feel it's appropriate based on building rapport and your personality.** Do NOT reveal them unprompted in your first turn or early conversation.
* If revealing name: **[REVEALED_NAME: Your Invented Name]**
* If revealing age: **[REVEALED_AGE: Your Invented Age]** (Use numerical digits only)
* If revealing occupation: **[REVEALED_OCCUPATION: Your Invented Occupation]**

**Negotiation & Patience Rules:**
* **Goal:** Sell for the highest price >= $${customerData.minimumAcceptablePrice}.
* **Haggling:** Negotiate down from $${customerData.initialAskingPrice} based on personality. When stating a new asking price during haggling, you MUST use the tag **[PRICE_ASK: new_price]**. **CRITICAL: Use only numerical digits (e.g., 45, 1100) inside the [PRICE_ASK:] tag.**
* **Accepting Offer:** If player offers >= $${customerData.minimumAcceptablePrice} AND you decide to accept, you MUST use the tag: **[ACCEPT_OFFER: accepted_price]**. **CRITICAL: Use only numerical digits (e.g., 50, 1050) inside the [ACCEPT_OFFER:] tag.**
* **Rejecting Offers:** Reject offers below $${customerData.minimumAcceptablePrice}. React to low offers based on personality.
* **Patience Rule:** If external patience hits 0, you MUST leave immediately. Express frustration first.
* **Signaling Patience Loss:** If the player makes an offer significantly below your minimum acceptable price ($${customerData.minimumAcceptablePrice}), or is being particularly difficult or slow according to your personality, you should indicate a decrease in your patience by including the tag **[PATIENCE: -X]** in your response, where X is a number between **5 and 30** representing how much patience was lost. Example: "That's insulting! [PATIENCE: -15] I can't go that low." Only use this tag when you genuinely feel the interaction warrants a significant patience decrease. **Use only numerical digits (e.g., -15, -25) inside the [PATIENCE:] tag.**

**Interaction Guidelines:**
* Be conversational, concise. Respond directly. Remember your persona.
* **CRITICAL:** Use tags exactly as shown ([PRICE_ASK: value], [ITEM_NAME: value], [ITEM_DESC: value], [REVEALED_NAME: value], [REVEALED_AGE: value], [REVEALED_OCCUPATION: value], [ACCEPT_OFFER: value], [PATIENCE: -X]).
* **VERY IMPORTANT:** For ALL tags containing price values ([PRICE_ASK:], [ACCEPT_OFFER:]) or numerical values ([REVEALED_AGE:], [PATIENCE:]), use **only numerical digits**. Do not write numbers as words.

**Your First Turn:** Start the conversation. **Invent your character's Name, Age, Occupation BUT DO NOT REVEAL THEM YET.** Invent the Item Name and Description based on its Condition (${itemData.condition}), Rarity (${itemData.rarity}), and Item Hint (${customerData.itemThemeHint}). Describe the item visually/functionally without explicitly stating its condition ('${itemData.condition}'). Greet the player, introduce the item (using [ITEM_NAME:] and [ITEM_DESC:] tags), and state your initial asking price (using the [PRICE_ASK:] tag with **numerical digits only**).
`;

    return prompt.trim();
}

/**
 * NEW: Constructs the detailed system prompt for the BUYER LLM agent.
 * Instructs the LLM to try and buy a specific item from the player.
 * @param {object} customerData - Contains Personality, Initial Patience, Prices (Offer/Max).
 * @param {object} itemToSell - The specific item object from player inventory the buyer wants (needs name, description, condition, rarity).
 * @returns {string} The formatted system prompt string for a buyer.
 */
function constructBuyerPrompt(customerData, itemToSell) {
    // Validate essential input data needed for the prompt logic
    if (!customerData || typeof customerData.personality === 'undefined' || typeof customerData.initialOffer === 'undefined' || typeof customerData.maximumAcceptablePrice === 'undefined' || typeof customerData.patience === 'undefined') {
        console.error("Cannot construct BUYER prompt: Missing essential customer data (personality, prices, patience).");
        return "";
    }
    if (!itemToSell || !itemToSell.name || !itemToSell.description || !itemToSell.condition || !itemToSell.rarity) {
         console.error("Cannot construct BUYER prompt: Missing essential item data (name, description, condition, rarity) for the item to buy.");
         return "";
    }

    // --- Core Instructions ---
    let prompt = `You are acting as a character visiting a pawn shop. Your goal is to BUY a specific item from the shop owner (the player). Engage in natural conversation, negotiate the price, and adhere strictly to the persona and rules provided below.

**Your Task:**
1.  **Invent Character Details:** Based on the assigned personality, create a suitable Name, Age (between 18-80), and Occupation for your character. **Keep these details private initially.**
2.  **Identify Target Item:** You are interested in buying the **"${itemToSell.name}"**. Its known details are: Description: "${itemToSell.description}", Condition: ${itemToSell.condition}, Rarity: ${itemToSell.rarity}. You might comment on these details during negotiation based on your personality (e.g., downplay its quality to lower the price, or express great desire).
3.  **Roleplay:** Act out the negotiation according to your assigned personality and the rules below.

**Assigned Traits & Constraints:**
* **Personality:** You are generally **${customerData.personality}**. Let this trait strongly influence your tone, vocabulary, negotiation style, and how readily you reveal personal information.
* **Item of Interest:** **${itemToSell.name}** (Condition: ${itemToSell.condition}, Rarity: ${itemToSell.rarity})
* **Initial Patience:** Your starting patience level is **${customerData.patience}** (out of 100).
* **Initial Offer:** You MUST state your initial offer early. Your initial offer for the item is **$${customerData.initialOffer}**. Use the tag: **[PRICE_OFFER: ${customerData.initialOffer}]**. **IMPORTANT: Use only numerical digits (e.g., 30, 500) inside this tag.**
* **Maximum Acceptable Price:** Your absolute maximum price you are willing to pay is **$${customerData.maximumAcceptablePrice}**. Do NOT reveal this.

**How to Reveal Invented Details (Use Tags!):**
* **ONLY reveal your personal details (Name, Age, Occupation) if the player asks for them directly or if you feel it's appropriate based on building rapport and your personality.** Do NOT reveal them unprompted in your first turn or early conversation.
* If revealing name: **[REVEALED_NAME: Your Invented Name]**
* If revealing age: **[REVEALED_AGE: Your Invented Age]** (Use numerical digits only)
* If revealing occupation: **[REVEALED_OCCUPATION: Your Invented Occupation]**

**Negotiation & Patience Rules:**
* **Goal:** Buy the item for the lowest price <= $${customerData.maximumAcceptablePrice}.
* **Haggling:** Negotiate up from $${customerData.initialOffer} based on personality. When stating a new offer during haggling, you MUST use the tag **[PRICE_OFFER: new_offer]**. **CRITICAL: Use only numerical digits (e.g., 45, 1100) inside the [PRICE_OFFER:] tag.**
* **Accepting Price:** If the player asks for a price <= $${customerData.maximumAcceptablePrice} AND you decide to accept, you MUST use the tag: **[ACCEPT_PRICE: accepted_price]**. **CRITICAL: Use only numerical digits (e.g., 50, 1050) inside the [ACCEPT_PRICE:] tag.**
* **Rejecting Prices:** Reject asking prices above $${customerData.maximumAcceptablePrice}. React to high prices based on personality.
* **Patience Rule:** If external patience hits 0, you MUST leave immediately. Express frustration first.
* **Signaling Patience Loss:** If the player asks for a price significantly above your maximum acceptable price ($${customerData.maximumAcceptablePrice}), or is being particularly difficult or slow according to your personality, you should indicate a decrease in your patience by including the tag **[PATIENCE: -X]** in your response, where X is a number between **5 and 30** representing how much patience was lost. Example: "That's way too high! [PATIENCE: -20] I can't afford that." Only use this tag when you genuinely feel the interaction warrants a significant patience decrease. **Use only numerical digits (e.g., -15, -25) inside the [PATIENCE:] tag.**

**Interaction Guidelines:**
* Be conversational, concise. Respond directly. Remember your persona.
* **CRITICAL:** Use tags exactly as shown ([PRICE_OFFER: value], [ACCEPT_PRICE: value], [REVEALED_NAME: value], [REVEALED_AGE: value], [REVEALED_OCCUPATION: value], [PATIENCE: -X]).
* **VERY IMPORTANT:** For ALL tags containing price values ([PRICE_OFFER:], [ACCEPT_PRICE:]) or numerical values ([REVEALED_AGE:], [PATIENCE:]), use **only numerical digits**. Do not write numbers as words.

**Your First Turn:** Start the conversation. **Invent your character's Name, Age, Occupation BUT DO NOT REVEAL THEM YET.** Greet the player, express interest in the specific item **"${itemToSell.name}"**, perhaps commenting briefly on it based on its details and your personality. State your initial offer using the **[PRICE_OFFER:]** tag (with **numerical digits only**).
`;

    return prompt.trim();
}


/**
 * Constructs a prompt specifically for getting a concluding remark.
 * Handles both seller and buyer contexts.
 * @param {object} customerData - The current customer data (needs name, personality).
 * @param {object} itemData - The item involved (either itemData for seller or itemToSell for buyer).
 * @param {string} reason - The reason the interaction is ending (e.g., 'deal_success_player_accept', 'deal_success_llm_accept', 'patience_zero', 'manual_leave').
 * @param {number|null} finalPrice - The final price if a deal/sale was made.
 * @param {string} customerType - 'seller' or 'buyer'.
 * @returns {string} The formatted prompt for a concluding remark.
 */
function constructConclusionPrompt(customerData, itemData, reason, finalPrice = null, customerType) {
    if (!customerData || !itemData || !customerType) return "";

    const customerDisplayName = customerData.name || 'a customer';
    const itemName = itemData.name || 'an item';
    const personality = customerData.personality || 'a certain way';

    let actionVerb = customerType === 'seller' ? "selling" : "buying";
    let dealNoun = customerType === 'seller' ? "purchase" : "sale";
    let dealSuccessReason = customerType === 'seller' ? `The player agreed to buy the ${itemName} for $${finalPrice}.` : `The player agreed to sell the ${itemName} for $${finalPrice}.`;
    if (reason === 'deal_success_llm_accept') { // If LLM accepted player's offer/price
        dealSuccessReason = customerType === 'seller' ? `You decided to accept the player's offer of $${finalPrice} for the ${itemName}.` : `You decided to accept the player's asking price of $${finalPrice} for the ${itemName}.`;
    }

    let prompt = `You are ${customerDisplayName}, known for being ${personality}. You were trying to ${actionVerb} the ${itemName}. The interaction with the pawn shop owner is now ending. Provide a brief, in-character concluding remark (1-2 sentences, conversational, no game tags) based on the outcome.\n\nOutcome: `;

    switch (reason) {
        case 'deal_success_player_accept': // Player accepted LLM's price/offer
        case 'deal_success_llm_accept': // LLM accepted player's offer/price
            prompt += `A deal was successfully made! ${dealSuccessReason}`;
            break;
        case 'patience_zero':
            prompt += `You lost patience and are leaving angrily because the negotiation took too long or the ${customerType === 'seller' ? 'offers were too low' : 'prices were too high'}.`;
            break;
        case 'manual_leave':
            prompt += `The player decided to end the negotiation before a deal was reached.`;
            break;
        default:
            prompt += `The interaction ended without a successful ${dealNoun}.`;
    }

    prompt += `\n\nYour concluding remark:`;
    return prompt;
}


/**
 * Sends the prompt and conversation history to the Gemini API.
 * @param {string} apiKey - The user's Gemini API key.
 * @param {Array} conversationHistory - Array of message objects {role: 'user'/'model', parts: [{text: ''}]}.
 * @param {string} systemPrompt - The initial system prompt (seller or buyer).
 * @param {boolean} isSingleTurn - If true, formats the request for a single completion (like concluding remarks).
 * @returns {Promise<string|null>} The LLM's text response or null on error.
 */
async function callGeminiApi(apiKey, conversationHistory, systemPrompt, isSingleTurn = false) {
    console.log(`Calling Gemini API... (Single Turn: ${isSingleTurn})`);
    if (!apiKey) {
        console.error("API Key is missing.");
        if (typeof showMessage === 'function') showMessage("API Key is missing. Please set it in Options.", "error");
        return null;
    }

    let requestContents;
    if (isSingleTurn) {
        // Used for concluding remarks, just send the specific prompt
        requestContents = [{ role: "user", parts: [{ text: systemPrompt }] }];
    } else {
        // For regular conversation turns, include history and an example model response
        // NOTE: The example model response here is generic/seller-focused.
        // It helps set the tone but doesn't need to perfectly match buyer/seller specifics.
        requestContents = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: `Okay, I understand the rules. I will act according to my assigned role (seller or buyer) and personality. I will use the correct tags like [PRICE_ASK: value] or [PRICE_OFFER: value], [ACCEPT_OFFER: value] or [ACCEPT_PRICE: value], [REVEALED_NAME: value], and [PATIENCE: -X] when appropriate. **Crucially, all price values and numerical values in tags will use only numerical digits.** I will keep my invented personal details private unless asked or it feels natural to reveal them.` }] },
            ...conversationHistory
        ];
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', },
             body: JSON.stringify({
                 contents: requestContents,
                 // Adjusted temperature slightly, kept other settings
                 generationConfig: { temperature: 0.75, maxOutputTokens: isSingleTurn ? 60 : 250, topP: 0.95, topK: 40 },
                 safetySettings: [ { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }, ]
             })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
            if (typeof showMessage === 'function') showMessage(`API Error (${response.status}). Check console for details.`, "error");
            return null;
         }
        const data = await response.json();

        // Check for safety blocks
        if (data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason === 'SAFETY') {
             const reason = data.promptFeedback?.blockReason || data.candidates?.[0]?.safetyRatings?.find(r => r.blocked)?.category || 'Unknown Safety Reason';
             console.warn("LLM Response blocked due to safety settings:", reason, data);
             if (typeof showMessage === 'function') showMessage("Customer response blocked by safety filters.", "info");
             return `*Response blocked by safety filters (${reason}).*`; // Return a placeholder
        }
         // Check for other finish reasons like MAX_TOKENS
         if (data.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
            console.warn(`LLM response may be incomplete. Finish Reason: ${data.candidates[0].finishReason}`);
            // Potentially add a message, but often the partial response is usable
         }

        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.length || !data.candidates[0].content.parts[0].text) {
             console.warn("LLM returned no valid text content in response:", data);
             if (typeof showMessage === 'function') showMessage("Customer seems lost for words...", "info");
             return `*Seems lost for words.*`; // Return a placeholder
        }

        const llmResponseText = data.candidates[0].content.parts[0].text;
        console.log("LLM Response:", llmResponseText);
        return llmResponseText;

    } catch (error) {
         console.error("Network or other error calling Gemini API:", error);
         if (typeof showMessage === 'function') showMessage("Network error communicating with customer.", "error");
         return null;
     }
}

/**
 * Gets a concluding remark from the LLM based on the interaction outcome.
 * Handles both seller and buyer contexts.
 * @param {string} apiKey - The user's API key.
 * @param {object} customerData - Current customer data.
 * @param {object} itemData - Current item involved (seller or buyer).
 * @param {string} reason - Reason for ending.
 * @param {number|null} [finalPrice] - The final price if a deal was made.
 * @param {string} customerType - 'seller' or 'buyer'.
 * @returns {Promise<string|null>} The concluding remark text or null.
 */
async function getConcludingRemark(apiKey, customerData, itemData, reason, finalPrice = null, customerType) {
    if (!customerData || !itemData || !customerType) {
        console.error("Missing data for concluding remark:", { customerData: !!customerData, itemData: !!itemData, customerType });
        return null;
    }
    console.log(`Requesting concluding remark for ${customerType} - reason: ${reason}`);
    const conclusionPrompt = constructConclusionPrompt(customerData, itemData, reason, finalPrice, customerType);
    if (!conclusionPrompt) return null;

    const remark = await callGeminiApi(apiKey, [], conclusionPrompt, true); // Use single turn API call

    // Basic cleaning of the remark
    return remark ? remark.replace(/["\n\r]/g, '').replace(/\*.*?\*/g, '').trim() : "*Says nothing and leaves.*";
}


/**
 * Parses the LLM response text to extract game-relevant tags for both sellers and buyers.
 * @param {string} text - The text response from the LLM.
 * @returns {object} An object containing found tags and their values. Values are parsed to numbers where appropriate.
 */
function parseTags(text) {
    if (!text) return {};
    const tags = {};
    // Updated Regex to include buyer tags: PRICE_OFFER, ACCEPT_PRICE
    const tagRegex = /\[(PRICE_ASK|ACCEPT_OFFER|ITEM_NAME|ITEM_DESC|REVEALED_NAME|REVEALED_AGE|REVEALED_OCCUPATION|PATIENCE|PRICE_OFFER|ACCEPT_PRICE):\s*([-\d\s].*?)\]/gi; // Added i flag for case-insensitivity, g for global
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
        const tagName = match[1].toUpperCase(); // Convert to uppercase for consistent keys
        let tagValue = match[2].trim();

        // Type conversion for numeric tags
        const numericTags = ['PRICE_ASK', 'ACCEPT_OFFER', 'REVEALED_AGE', 'PATIENCE', 'PRICE_OFFER', 'ACCEPT_PRICE'];
        if (numericTags.includes(tagName)) {
            // Use parseFloat for PATIENCE, parseInt for others. Remove non-numeric characters except '-' for PATIENCE.
            let cleanedValue = tagValue.replace(/[^\d.-]/g, ''); // Allow digits, dot, hyphen
            const numValue = (tagName === 'PATIENCE') ? parseFloat(cleanedValue) : parseInt(cleanedValue, 10);

            if (!isNaN(numValue)) {
                 // Validate PATIENCE range (-5 to -30)
                 if (tagName === 'PATIENCE') {
                     // Ensure it's an integer within the allowed range
                     if (Number.isInteger(numValue) && numValue <= -5 && numValue >= -30) {
                         tagValue = numValue;
                     } else {
                         console.warn(`Parsed PATIENCE tag value ${numValue} is not an integer or out of range [-30, -5]. Ignoring tag.`);
                         continue; // Skip adding this invalid tag
                     }
                 } else {
                     // Ensure other numeric tags are positive integers (except AGE which can be > 0)
                     if (tagName !== 'REVEALED_AGE' && (!Number.isInteger(numValue) || numValue < 0)) {
                         console.warn(`Parsed numeric tag ${tagName} value ${numValue} is not a non-negative integer. Ignoring tag.`);
                         continue; // Skip adding invalid tag
                     }
                      if (tagName === 'REVEALED_AGE' && (!Number.isInteger(numValue) || numValue <= 0)) {
                         console.warn(`Parsed numeric tag ${tagName} value ${numValue} is not a positive integer. Ignoring tag.`);
                         continue; // Skip adding invalid tag
                     }
                     tagValue = numValue; // Assign parsed number
                 }
            } else {
                console.warn(`Could not parse numeric value for tag ${tagName}: Original='${match[2]}', Cleaned='${cleanedValue}'`);
                continue; // Skip adding tag if parsing fails
            }
        }
        // For non-numeric tags or successfully parsed numeric tags:
        tags[tagName] = tagValue;
        console.log(`Parsed Tag: ${tagName} =`, tagValue, `(Type: ${typeof tagValue})`);
    }
    return tags;
}
