-- DingDong Delivery configuration
-- Placed in `shared/config.lua` so it's loaded for both client and server via fxmanifest

Config = {}

-- Resource/app identifiers
Config.ResourceName = 'dingdong-delivery' -- used by NUI fetch URLs
Config.AppIdentifier = 'dingdong-delivery' -- lb-phone app identifier
Config.AppName = 'DingDong'

-- Currency / pricing
Config.Currency = '$'
Config.DeliveryFee = 5.00

-- UI behavior
Config.CartMaxItems = 100

-- Cache busting
-- If true, client will add a timestamp parameter when requesting UI to avoid CEF caching
Config.EnableCacheBusting = true

-- Defaults for items (can be overridden per-item)
Config.DefaultItemPrice = 8.00

-- Items available in the app (id, name, price, category, icon, description)
-- Edit this list to add/remove items easily.
Config.Items = {
	{
        id = 1,
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
		id = 2,
		name = 'Pepperoni Pizza',
		price = 12,
		category = 'pizza',
		icon = '🍕',
		desc = 'Large pizza with pepperoni',
		itemId = 'pizza'
	},
	{
		id = 3,
		name = 'Cola',
		price = 3,
		category = 'drinks',
		icon = '🥤',
		desc = 'Cold refreshing drink',
		itemId = 'cola'
	},
	{
        id = 4,
        name = 'Water',
        price = 2,
        category = 'drinks',
        icon = 'https://items.bit-scripts.com/images/drinks/water_bottle.png',
        desc = 'Cold refreshing bottle o wahtah',
        itemId = 'water',

        sizes = {
            { label = "Bottle", price = 0 },
            { label = "Large Bottle", price = 1 }
        },

        extras = {} -- no extras for water
    },
	{
		id = 5,
		name = 'Chocolate Cake',
		price = 4.99,
		category = 'desserts',
		icon = '🍰',
		desc = 'Rich and fluffy cake',
		itemId = 'cake'
	}
}

-- Debugging toggles
-- Set to true to enable debug messages in the UI/client
Config.Debug = {
	Enabled = false
}

return Config
