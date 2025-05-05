# Pawn-Shop-LLM
A Pawn Shop game where you interact with an LLM, and negotiate to purchase and sell items.

## How to Play / Gameplay Loop

1.  **Setup:** Open the game and go to **Options** to enter your **Google Gemini API Key**. The game cannot function without it. You can also customize your player name and avatar style here.
2.  **New Customer:** Click the **New Customer** button. A customer will arrive.
3.  **Customer Type:**
    * **Seller:** The customer will present an item they want to sell, describe it, and state their initial asking price.
    * **Buyer:** (Requires at least 2 items in your inventory) The customer will express interest in a random item from *your* inventory and make an initial offer.
4.  **Negotiation:** Use the **Your Message** input box (you can press Enter to send, Shift+Enter for new lines) to chat with the customer. You can:
    * Discuss the item.
    * Try to gauge their personality and willingness to negotiate.
    * Make counter-offers (for sellers) or state your asking price (for buyers) directly in your message (e.g., "I can offer $50", "My price is $150").
    * Build rapport – sometimes revealing customer details like name/age/occupation can happen through conversation.
5.  **Appraisal (Sellers Only):** You have one chance per seller to **Appraise Item**. This might reveal hints about the item's true condition, rarity, or base value.
6.  **Decision:**
    * Click **Accept Price** (for sellers) or **Accept Offer** (for buyers) if you agree to their current price/offer.
    * Click **End Negotiation** if you don't want to make a deal.
    * The customer might accept your offer/price, make a counter-offer, or leave if their patience runs out or they feel insulted by your prices/offers.
7.  **Outcome:**
    * **Purchase (Seller):** If you buy an item, the cost is deducted from your cash, and the item is added to your inventory.
    * **Sale (Buyer):** If you sell an item, it's removed from your inventory, and the sale price is added to your cash.
    * **No Deal:** The customer leaves, and your cash/inventory remain unchanged.
8.  **Inventory:** Click **View Inventory** to see the items you've purchased, their details, and potential profit margins.
9.  **Save/Load:** Between customers, you can go to **Options** to **Save Game** (progress saved to browser) or **Load Game**.
10. **Repeat:** Click **New Customer** to continue!

## Key Features

* **LLM-Powered Customers:** Each customer (seller or buyer) is driven by Google's Gemini LLM, giving them unique personalities, dialogue styles, and negotiation tactics.
* **Natural Language Negotiation:** Haggle prices by typing offers and responses in the chat box. The LLM understands and reacts based on its programmed persona and price limits.
* **Dynamic Personalities & Patience:** Customers have varying levels of patience that decrease based on time and negotiation difficulty. Their personality (e.g., Grumpy, Cheerful, Shady, Collector) influences how they talk and bargain.
* **Item Variety:** Items are generated with random conditions and rarities, affecting their value and the customer's attachment. The LLM generates unique names and descriptions based on themes.
* **Buying & Selling Cycle:** Engage in both buying items from sellers to build inventory and selling items from your inventory to buyers.
* **Basic Appraisal:** Get limited insights into items brought by sellers.
* **Inventory Management:** Keep track of purchased items and their costs.
* **Save/Load System:** Save your shop's progress (cash, inventory, settings) locally in your browser and load it later.
* **Customizable Avatars:** Choose from various DiceBear avatar styles for customers and the player.

## Technical Details

* **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript (ES6 Modules)
* **LLM:** Google Gemini API (specifically `gemini-1.5-flash-latest` as configured in `llm.js`)
* **Avatars:** DiceBear API (<https://www.dicebear.com/>)
* **Storage:** Browser `localStorage` is used for saving the API key, player settings, and game state.

---

Enjoy running your pawn shop!

