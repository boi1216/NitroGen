const request = require('request');
const logger = require(__dirname + '/util/logger');
const fs = require('fs');

const PROXY_FILE = __dirname + "/proxies.txt";

const triesPerSecond = 0.5;

var proxyLine = 0;
var proxyUrl = "";
var working = [];

getGiftCode = function () {
    let code = '';
    let dict = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for(var i = 0; i < 18; i++){
        code = code + dict.charAt(Math.floor(Math.random() * dict.length));
    }
    return code;
}

function updateLine(){
    proxyLine++;
    var lineReader = require('line-reader');
    var readLine = 0;
    lineReader.eachLine(PROXY_FILE, function(line, last) {
        readLine++;
        if (readLine === proxyLine) {
            proxyUrl = "http://" + line;
        }
        if (last) {
            readLine = 0;
        }
    });
}

updateLine();

checkCode =  function (code) {
   var proxiedRequest = request.defaults({'proxy': proxyUrl});
    proxiedRequest.timeout = 1500;
    proxiedRequest.get(`https://discordapp.com/api/v6/entitlements/gift-codes/${code}?with_application=false&with_subscription_plan=true`,  (error, resp, body)  => {
        if(error){
            console.log('\x1b[33m%s\x1b[0m', `Connection error: switching proxy`);
            updateLine();
            return;
        }
        try {
            body = JSON.parse(body);
            if(body.message != "Unknown Gift Code" && body.message != "You are being rate limited."){
                logger.log('\x1b[41m', `FOUND CODE THAT WORKS: https://discord.gift/${code}`);
                console.log(JSON.stringify(body, null, 4));
                working.push(`https://discord.gift/${code}`);
                fs.writeFileSync(__dirname + '/codes.json', JSON.stringify(working, null, 4));
            }
            else if(body.message === "You are being rate limited.") {
                updateLine();
                console.log("Rate limit reached! Switched proxy");

            }else{
                console.log('\x1b[36m%s\x1b[0m', `Invalid: ${code} : Searching!`);
            }
        }
        catch (error) {
            logger.error(`An error occurred:`);
            logger.error(error);
            return;
        }
    });
}
logger.info(`Nitro Generator by boi#1485`);
logger.info(`\n\n\n\nConnection with discordapp.com!\n\n\n\n\n\n\n`);

checkCode(getGiftCode());
setInterval(() => {
    checkCode(getGiftCode());
    }, (5/triesPerSecond) * 50);