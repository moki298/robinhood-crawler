const fs = require('fs');
const path = require('path');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const screenLogger = require('./logger').screenLogger

exports.createDataFolderIfRequired = function () {
    return new Promise((resolve, reject) => {
        fs.mkdir(`${path.join(__dirname, '/../../data')}`, {}, function (err) {
            if (err) {
                if (err.code == 'EEXIST') {
                    // resolve if folder already exists
                    resolve()
                } else {
                    reject(err)
                }
            } else {
                resolve()
            }
        });
    })
}

exports.getCookiesAndSave = async function (page) {
    const cookies = await page.cookies()
    screenLogger.info("Cookies are ", cookies);

    await writeFile(`${path.join(__dirname, '/../../rh-cookies.json')}`, JSON.stringify(cookies, null, 2), 'utf8');
    // also set `logged_in` cookie after logging-in in the JSON file
}

exports.getCurrentTimeInMilliSecs = function () {
    return new Date().getTime()
}

exports.getFormattedPriceInFloat = function (value, charCountToRemove) {
    // string format for below case: '+$123.00'
    if (charCountToRemove === 2) {
        if (value[0] === '+') {
            return parseFloat(value.substring(charCountToRemove).replace(',', ''));
        } else if (value[0] === '-') {
            return -(parseFloat(value.substring(charCountToRemove).replace(',', '')));
        }
    }

    // remove $ symbol in first char and any commas
    return parseFloat(value.substring(charCountToRemove).replace(',', ''));
}

exports.getAbsolutePriceInFloat = function (value, charCountToRemove) {
    return parseFloat(value.substring(charCountToRemove).replace(',', ''));
}

exports.setCookiesFromJSON = async function () {
    const cookiesString = await fs.readFileSync(`${__dirname}/../../rh-cookies.json`, 'utf8');
    return JSON.parse(cookiesString)
}

exports.getSumOfArray = function (list) {
    let sum = 0

    list.map(value => {
        sum = sum + value
    })

    return sum
}

exports.getValidDateWithYear = function (dateString) {
    const currentYear = new Date().getFullYear()

    if (dateString.length < 8) {
        return new Date(`${dateString} ${currentYear}`)
    } else return new Date(dateString)
}

exports.isReturnNegative = function (averageCost, currentMarketPrice, shareCount) {
    const returnValue = (shareCount * currentMarketPrice) - (shareCount * averageCost)

    if (returnValue < 0) {
        return true
    } else {
        return false
    }
}

exports.lowerCaseFirstLetter = function (string) {
    return string.charAt(0).toLowerCase() + string.slice(1)
}

exports.autoScrollToBottom = async function (page) {
    await page.evaluate(async () => {
        await new Promise(resolve => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 1000);
        });
    });
}

exports.stripComma = function (string) {
    return string.replace(',', '')
}

exports.stripWhiteSpace = function (string) {
    return string.replace(/\s+/g, '')
}

exports.wait = function (timeInMilliSecs) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSecs));
}

exports.writeDataToJSONFile = async function (data) {
    const json = JSON.stringify({ data }, null, 4);
    await writeFile(`${path.join(__dirname, '/../../data/stocks.json')}`, json, 'utf8');
}

exports.writeStocksToExcelSheet = function (data) {
    return new Promise((resolve, reject) => {
        const csvWriter = createCsvWriter({
            path: `${path.join(__dirname, '/../../data/stocks.csv')}`,
            header: [
                { id: 'tickrSymbol', title: 'Ticker' },
                { id: 'shareCount', title: 'Quantity' },
                { id: 'averageCost', title: 'Cost Per Share' },
                { id: 'currentMarketPrice', title: 'Market Price' },
                { id: 'equity', title: 'Equity' },
                { id: 'name', title: 'Name' },
                { id: 'totalReturn', title: 'Return' }
            ]
        });

        csvWriter.writeRecords(data)
            .then(() => {
                resolve()
            })
            .catch(() => {
                reject()
            })
    })
}
