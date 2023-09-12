// Created by ro0ti

var ConfigFile = require('./config.json');
var Client_ID = ConfigFile.Client_ID;

var prompt = require('prompt');
prompt.start();

var RPC = require('discord-rpc');
var fs = require('fs');
var colors = require('colors');
colors.enable();
var SCOPES = ConfigFile.Client_Scopes;

var Client = new RPC.Client({
    transport: ConfigFile.Client_Transport
});

var FlashFile = require(ConfigFile.Client_PathManager.Blink_Config);

if (FlashFile.Enabled == true) {
    var DataFile = require(ConfigFile.Client_PathManager.Blink_Presence);
} else {
    var DataFile = require(ConfigFile.Client_PathManager.Normal_Presence);
}


var ClientData = '';
var UserData = '';

Client.on('ready', () => {

    if (ConfigFile.Autoload.Enabled == true) {
        if (ConfigFile.Autoload.Client == "flash") {
            BlinkClient();
            init();
            MainMenu();
        } else if (ConfigFile.Autoload.Client == "normal") {
            LoadClient();
            init();
            MainMenu();
        }
     } else {
        welcome();
     }
    

    function welcome() {
        console.clear();
        log(3, 'Pick A Client', 'Which client shall we load for you? `flash` or `normal`.');
        prompt.get(['WELCOME_BACK'], function (e, i) {
            if (e) { log(0, 'Error', e); }
            if (i.WELCOME_BACK == "flash") {
                BlinkClient();
                init();
                MainMenu();
            } else if (i.WELCOME_BACK == "normal") {
                LoadClient();
                init();
                MainMenu();
            }
        });
    }

    function init() {
        console.clear();

        ClientData = Client;
        UserData = Client.user;

        console.log(colors.gray('##############################################'));
        console.log(colors.gray('### ') + colors.magenta('Discord Presence Display By ro0ti'));
        console.log(colors.gray('##############################################'));
        console.log(colors.gray('   >_ Connected: ') + colors.green(Client.user.id));
        console.log(colors.gray('   >_ Client ID: ') + colors.green(Client_ID));
        if (FlashFile.Enabled == true) {
            log(2, "Flashing", FlashFile.Enabled);
            
        } else {
            log(0, "Flashing", FlashFile.Enabled);
        }
    }

    function MainMenu() {
        // docs
        // 0 - Game
        // 1 - Streaming | url: "",
        // 2 - Listening
        // 3 - Watching
        // 4 - Custom {emoji} {name}
        // 5 - Competing
        prompt.get(['MENU'], function(err, input) {
            if (err) { console.log(err); }
            if (input.MENU == "user") {
                console.log(UserData);
                MainMenu();
            } else if (input.MENU == "client") {
                console.log(ClientData);
                MainMenu();
            } else if (input.MENU == "reload") {
                if (FlashFile.Enabled == true) {
                    FlashFile = JSON.parse(fs.readFileSync(ConfigFile.Client_PathManager.Blink_Presence, 'utf-8'));
                    init();
                    log(1, 'Reloaded', 'Flash file has been reloaded.');
                    MainMenu();
                } else {
                    DataFile = JSON.parse(fs.readFileSync(ConfigFile.Client_PathManager.Normal_Presence, 'utf-8'));
                    init();
                    log(1, 'Reloaded', 'Normal presence has been reloaded.');
                    MainMenu();
                }
            } else if (input.MENU == "text") {
                // load settings
                var data = JSON.parse(fs.readFileSync(ConfigFile.Client_PathManager.Normal_Presence, 'utf-8'));

                console.log('Current Line 1: ' + data.details);
                console.log('Current Line 2: ' + data.state);

                log(3, 'Warning', 'This will not change blinking text only normal presence.json file.');

                prompt.get(['KEEP_SETTINGS'], function(er, ks) {
                    if (er) { console.log(er); }
                    if (ks == "y") {
                        // yes
                        init();
                        MainMenu();
                    } else if (ks == "n") {
                        // no
                        prompt.get(['LINE_1', 'LINE_2'], function(error, t) {
                            if (error) { console.log(error); }
                                data.details = t.LINE_1;
                                data.state = t.LINE_2;
                                fs.writeFileSync(ConfigFile.Client_PathManager.Normal_Presence, JSON.stringify(data, 4, null));
                                init();
                                console.log('Text has been reloaded.\n');
                                MainMenu();
                        });
                    } else {
                        // reset
                        init();
                        MainMenu();
                    }
                });
            } else if (input.MENU == "blink-enable") {
                FlashFile.Enabled = true;
                BlinkClient();
            } else if (input.MENU == "blink-disable") {
                FlashFile.Enabled = false;
                LoadClient();
            } else if (input.MENU == "guild") {
                prompt.get(['ID'], function (e, i) {
                    if (!i.id) { MainMenu(); }
                    Client.request('GET_GUILD', {
                        guild_id: i.id
                    });
                });
            }
        });
    }

    function LoadClient() {
        Client.request('SET_ACTIVITY', {
            pid: process.pid,
            activity: DataFile
        });
    }

    function BlinkClient() {

        if (!FlashFile.Enabled == true) {
            log(0, 'Error', 'Enable flash file in `blink` > `' + ConfigFile.Client_PathManager.Blink_Config + '`.');
            welcome();
            return;
        }
        
        var ButtonData = FlashFile.Buttons;

        var Messages = FlashFile.Messages;

        var Emoji = {
            Set_1: FlashFile.Emoji_Set_1,
            Set_2: FlashFile.Emoji_Set_2
        }

        var BlinkTicker = setInterval(function() {

            var HistoryData = {
                Line_1: Messages[Math.floor(Math.random() * Messages.length)],
                Line_2: Messages[Math.floor(Math.random() * Messages.length)],
                Emoji_1: Emoji.Set_1[Math.floor(Math.random() * Emoji.Set_1.length)],
                Emoji_2: Emoji.Set_2[Math.floor(Math.random() * Emoji.Set_2.length)]
            }

            if (HistoryData.Line_1 == HistoryData.Line_2) {
                HistoryData.Line_1 = Messages[Math.floor(Math.random() * Messages.length)];
            }

            if (HistoryData.Emoji_1 == HistoryData.Emoji_2) {
                HistoryData.Emoji_1 = Emoji.Set_1[Math.floor(Math.random() * Emoji.Set_1.length)];
            }

            Client.request('SET_ACTIVITY', {
                pid: process.pid,
                activity: {
                    type: 3,
                    state: HistoryData.Line_1,
                    details: HistoryData.Line_2,
    
                    assets: {
                        large_image: FlashFile.Avatar,
                        large_text: HistoryData.Emoji_1,
                        small_image: FlashFile.Icon,
                        small_text: HistoryData.Emoji_2
                    },
                    buttons: ButtonData
                }
            });
        }, FlashFile.Speed);
    }

});

Client.on('error', (err) => {
    if (err) { console.log(err); }
});

Client.login({
    clientId: Client_ID,
    SCOPES
}).catch(console.error);


// log(1, 'Info', 'Welcome!');

// 0 - Error
// 1 - Info
// 2 - Success
// 3 - Warn
// 4 - Normal

function log(type, title, message) {
    switch(type) {
        case 0:
            return console.log(colors.gray('   >_ ') + colors.red(title + ': ') + colors.gray(message));
        case 1:
            return console.log(colors.gray('   >_ ') + colors.cyan(title + ': ') + colors.gray(message));
        case 2:
            return console.log(colors.gray('   >_ ') + colors.green(title + ': ') + colors.gray(message));
        case 3:
            return console.log(colors.gray('   >_ ') + colors.yellow(title + ': ') + colors.gray(message));
        case 4:
            return console.log(colors.gray('   >_ ' + title + ': ' + message));
    }
}