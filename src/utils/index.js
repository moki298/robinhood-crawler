const fs = require('fs');
const path = require('path');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

exports.getSumOfArray = function (list) {
    let sum = 0

    list.map(value => {
        sum = sum + value
    })

    return sum
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

exports.stripWhiteSpace = function (string) {
    return string.replace(/\s+/g, '')
}

exports.wait = function (timeInMilliSecs) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSecs));
}

exports.writeToExcelSheet = function (data) {
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
