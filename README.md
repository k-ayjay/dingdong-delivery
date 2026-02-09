# 🍔 DingDong Delivery  -  ESX
A fully interactive food‑ordering app for **lb‑phone** on FiveM.  
Players can browse menus, customize items, add extras, place orders, and enjoy a clean, modern UI built for immersive RP servers.

---

## 📱 Features

### ✔ Fully integrated lb‑phone custom app  
- Uses the **Custom App Backport** API  
- Opens directly from the phone  
- Supports open/close actions, config injection, and live updates  

### ✔ Modern, responsive UI  
- Built with HTML, CSS, and JavaScript  
- Smooth modal transitions  
- Category filtering  
- Search bar  
- Sticky cart button  
- Real‑time location display  

### ✔ Complete ordering system  
- Item modal with:
  - Sizes  
  - Extras  
  - Quantity selector  
  - Dynamic price calculation  
- Quick‑add (“+”) button  
- Full cart & checkout modal  
- Delivery notes  
- Subtotal, delivery fee, and total calculation  

### ✔ Server‑side order handling  
- Receives orders via NUI callbacks  
- Logs or processes orders server‑side  
- Ready for integration with delivery NPCs or job systems  

### ✔ Config‑driven menu  
- Add unlimited items  
- Each item supports:
  - Name  
  - Description  
  - Price  
  - Category  
  - Icon (emoji or URL)  

---

## 🔧 Dependencies
-**[ESX Framework](https://github.com/esx-framework)**<br>
-**[LB-Phone](https://lbscripts.com/package/phone)**

## ⚙️ Installation

1. Download or clone the repository  
2. Place the folder into your FiveM server’s `resources` directory  
3. Add the resource to your `server.cfg`
4. `ensure dingdong-delivery`
5. Make sure **lb-phone** is installed and running  
6. Restart your server  

---

## 🧩 Configuration

All menu items and app settings are controlled through `config.lua`.

Example:

```lua
Config.Items = {
	{
	    name = 'Burger',
	    price = 8,
	    category = 'burgers',
	    icon = '🍔',
	    desc = 'Fresh beef with lettuce',
	    itemId = 'burger',
	
	    sizes = {
	        { label = "Small", price = 0 },
	        { label = "Medium", price = 1 },
	        { label = "Large", price = 2 }
    	},

	    extras = {
	        { label = "Extra Cheese", price = 1 },
	        { label = "Bacon", price = 2 },
	        { label = "Avocado", price = 1.50 }
	    }
    },
	{
		name = 'Pepperoni Pizza',
		price = 12,
		category = 'pizza',
		icon = '🍕',
		desc = 'Large pizza with pepperoni',
		itemId = 'pizza'
	},
	{
	    name = 'Water',
	    price = 2,
	    category = 'drinks',
	    icon = 'https://items.bit-scripts.com/images/drinks/water_bottle.png', -- utilize a URL for icons
	    desc = 'Cold refreshing bottle o wahtah',
	    itemId = 'water',
	
	    sizes = {
	        { label = "Bottle", price = 0 },
	        { label = "Large Bottle", price = 1 }
	    },
	
	    extras = {} -- no extras for water
		}
	}
```
You can add unlimited categories and items.

🔌 Exports & Events
Client → NUI
- getLocation
- addToCart
- quickAddItem
- placeOrder
- filterCategory
- search
Server Events
- dingdong:server:addToCart
- dingdong:server:quickAddItem
- dingdong:server:placeOrder
These can be expanded to integrate:
- Delivery drivers
- Job systems
- Payment systems
- Inventory systems

## 🛠️ Requirements
- FiveM
- lb-phone (Custom App Backport)
- Optional: oxmysql for order logging

## 🧪 Known Issues / Notes
- UI animations may vary depending on phone theme
- Delivery system is not included by default (but ready to be added)
- Ensure modals remain inside .app container for proper z-index behavior

## 📜 License
This resource is provided as-is.
You may modify it for your server, but please credit the original author.

## ❤️ Credits
<br>Developer: ! David
<br>Phone Integration: lb-phone Custom App Backport
