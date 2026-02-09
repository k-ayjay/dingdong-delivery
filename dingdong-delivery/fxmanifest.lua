fx_version 'cerulean'
game 'gta5'

name 'dingdong-delivery'
description 'Simple food delivery app for lb-phone'
author 'David'
version '0.0.1'

shared_scripts {
    'shared/*.lua'
}

client_scripts {
    'client/*.lua'
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/*.lua'
}

file 'ui/**/*'
