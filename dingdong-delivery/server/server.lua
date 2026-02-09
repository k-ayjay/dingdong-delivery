ESX = exports["es_extended"]:getSharedObject()

RegisterNetEvent('dingdong:server:addToCart')
AddEventHandler('dingdong:server:addToCart', function(data)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)
    if xPlayer then
        print(("^2[DingDong] ^7Player %s added to cart: %s"):format(xPlayer.getName(), json.encode(data)))
    else
        print("^2[DingDong] ^7addToCart from unknown player: " .. tostring(src))
    end
end)

RegisterNetEvent('dingdong:server:quickAddItem')
AddEventHandler('dingdong:server:quickAddItem', function(data)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)
    if xPlayer then
        print(("^2[DingDong] ^7Quick add by %s: %s"):format(xPlayer.getName(), tostring(data.name)))
    else
        print("^2[DingDong] ^7quickAddItem from unknown player: " .. tostring(src))
    end
end)

RegisterNetEvent('dingdong:server:filterCategory')
AddEventHandler('dingdong:server:filterCategory', function(data)
    print(("^2[DingDong] ^7Filter category from client: %s"):format(tostring(data.category)))
end)

RegisterNetEvent('dingdong:server:search')
AddEventHandler('dingdong:server:search', function(data)
    print(("^2[DingDong] ^7Search query from client: %s"):format(tostring(data.query)))
end)

-- Place order: client should call TriggerServerEvent('dingdong:server:placeOrder', items, orderMeta)
RegisterNetEvent('dingdong:server:placeOrder')
AddEventHandler('dingdong:server:placeOrder', function(items, meta)
    local src = source
    local xPlayer = ESX.GetPlayerFromId(src)

    if not xPlayer then
        print("^1[DingDong ERROR] ^7Player not found for placeOrder")
        return
    end

    -- Calculate total price
    local totalPrice = 0
    if type(items) == 'table' then
        for _, item in ipairs(items) do
            local price = tonumber(item.price) or 0
            local qty = tonumber(item.quantity) or 1
            totalPrice = totalPrice + (price * qty)
        end
    end

    print(("^2[DingDong] ^7Player %s placing order: total $%s"):format(xPlayer.getName(), tostring(totalPrice)))

    -- Check player money and deduct
    local playerMoney = xPlayer.getMoney and xPlayer.getMoney() or 0
    if playerMoney >= totalPrice then
        if xPlayer.removeMoney then
            xPlayer.removeMoney(totalPrice)
        end

        -- Add items to ox_inventory
        if type(items) == 'table' then
            for _, item in ipairs(items) do
                local itemId = item.itemId or string.lower(string.gsub(item.name, ' ', '_'))
                local qty = tonumber(item.quantity) or 1
                -- Add item to inventory (with optional metadata)
                local success = exports.ox_inventory:AddItem(src, itemId, qty, {
                    label = item.name,
                    price = tonumber(item.price) or 0
                })
                if success then
                    print(("^2[DingDong] ^7Added %d x %s to %s's inventory"):format(qty, itemId, xPlayer.getName()))
                else
                    print(("^1[DingDong] ^7Failed to add %s to %s's inventory"):format(itemId, xPlayer.getName()))
                end
            end
        end
        print(("^2[DingDong] ^7Order placed by %s for $%s"):format(xPlayer.getName(), tostring(totalPrice)))
    else
        print(("^1[DingDong] ^7Insufficient funds for %s: need $%s, have $%s"):format(xPlayer.getName(), tostring(totalPrice), tostring(playerMoney)))
    end
end)