ESX = exports["es_extended"]:getSharedObject()

local identifier = "dingdong-delivery"

while GetResourceState("lb-phone") ~= "started" do
    Wait(500)
end

local function addApp()
    -- Use game timer for cache-busting (FiveM doesn't always expose os.time)
    local timestamp = GetGameTimer()
    local added, errorMessage = exports["lb-phone"]:AddCustomApp({
        identifier = identifier,
        name = "DingDong",
        description = "Order delicious food and have it delivered to your location!",
        developer = "! David",
        defaultApp = false,
        game = false,
        size = 42069,
        ui = GetCurrentResourceName() .. "/ui/index.html?v=" .. timestamp,
        images = { "https://i.ibb.co/3XJb8Lv/dingdong.png" },
        icon = "https://i.ibb.co/3XJb8Lv/dingdong.png",
        price = 0,
        landscape = false,
        keepOpen = true,
    })

    if not added then
        print("^1[DingDong ERROR]^7 Could not add app:", errorMessage)
    else
        print("^2[DingDong]^7 App loaded successfully!")
        if Config then
            exports["lb-phone"]:SendCustomAppMessage(identifier, {
                type = "config",
                config = {
                    ResourceName = GetCurrentResourceName(),
                    DeliveryFee = Config.DeliveryFee,
                    Currency = Config.Currency,
                    EnableCacheBusting = Config.EnableCacheBusting,
                    items = Config.Items,
                    Debug = Config.Debug
                }
            })
        end
    end
end

addApp()

AddEventHandler("onResourceStart", function(resource)
    if resource == "lb-phone" then
        addApp()
    end
end)

local directions = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" }
local oldYaw, oldDirection

-- Get player location from coordinates
local function getPlayerLocationName()
    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    local streetName = GetStreetNameFromHashKey(GetStreetNameAtCoord(playerCoords.x, playerCoords.y, playerCoords.z))
    local areaName = GetNameOfZone(playerCoords.x, playerCoords.y, playerCoords.z)
    return streetName .. ", " .. areaName
end

-- Server requests location
RegisterNetEvent('dingdong:getLocationFromClient')
AddEventHandler('dingdong:getLocationFromClient', function(callback)
    local location = getPlayerLocationName()
    callback(location)
end)

RegisterNUICallback("getDirection", function(data, cb)
    cb(oldDirection)
end)

RegisterNUICallback("getLocation", function(data, cb)
    local location = getPlayerLocationName()
    cb({location = location})
end)

RegisterNUICallback("drawNotification", function(data, cb)
    BeginTextCommandThefeedPost("STRING")
    AddTextComponentSubstringPlayerName(data.message)
    EndTextCommandThefeedPostTicker(false, false)

    cb("ok")
end)

-- Forward NUI calls to server events
RegisterNUICallback('addToCart', function(data, cb)
    -- data: cart item
    TriggerServerEvent('dingdong:server:addToCart', data)
    cb({success = true})
end)

RegisterNUICallback('quickAddItem', function(data, cb)
    -- data: { name, price }
    TriggerServerEvent('dingdong:server:quickAddItem', data)
    cb({success = true})
end)

RegisterNUICallback('filterCategory', function(data, cb)
    TriggerServerEvent('dingdong:server:filterCategory', data)
    cb({success = true})
end)

RegisterNUICallback('search', function(data, cb)
    TriggerServerEvent('dingdong:server:search', data)
    cb({success = true})
end)

RegisterNUICallback('placeOrder', function(data, cb)
    -- data: { items = [...], deliveryNotes, subtotal, deliveryFee, total }
    TriggerServerEvent('dingdong:server:placeOrder', data.items, data)
    cb({success = true})
end)

-- Handle config requests from NUI
RegisterNUICallback('requestConfig', function(data, cb)
    if Config then
        cb({
            config = {
                ResourceName = GetCurrentResourceName(),
                DeliveryFee = Config.DeliveryFee,
                Currency = Config.Currency,
                EnableCacheBusting = Config.EnableCacheBusting,
                items = Config.Items,
                Debug = Config.Debug
            }
        })
    else
        cb({config = nil})
    end
end)

-- Update location in real-time
Citizen.CreateThread(function()
    local lastLocation = ""
    while true do
        Wait(5000) -- Update every 5 seconds
        
        local currentLocation = getPlayerLocationName()
        if currentLocation ~= lastLocation then
            lastLocation = currentLocation
            exports["lb-phone"]:SendCustomAppMessage(identifier, {
                type = "updateLocation",
                location = currentLocation
            })
        end
    end
end)

-- Direction updates
Citizen.CreateThread(function()
    while true do
        Wait(25)

        local yaw = math.floor(360.0 - ((GetFinalRenderedCamRot(0).z + 360.0) % 360.0) + 0.5)

        if yaw == 360 then
            yaw = 0
        end

        -- get closest direction
        if oldYaw ~= yaw then
            oldYaw = yaw
            oldDirection = yaw .. "° " .. directions[math.floor((yaw + 22.5) / 45.0) % 8 + 1]

            exports["lb-phone"]:SendCustomAppMessage(identifier, {
                type = "updateDirection",
                direction = oldDirection
            })
        end
    end
end)


-- Notification handler
local function sendNotification(message, type)
    type = type or 'inform'
    TriggerEvent('chat:addMessage', {
        args = {'DingDong', message},
        color = {220, 20, 60}
    })
end

RegisterNetEvent('dingdong:notify')
AddEventHandler('dingdong:notify', function(message, type)
    sendNotification(message, type)
end)