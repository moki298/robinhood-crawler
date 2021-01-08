const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

exports.getFormattedPriceInFloat = function (value) {
    // remove $ symnbol in first char and any commas
    return parseFloat(value.substring(1).replace(',', ''));
}

exports.isReturnNegative = function (averageCost, currentMarketPrice, shareCount) {
    const returnValue = (shareCount * currentMarketPrice) - (shareCount * averageCost)

    if (returnValue < 0) {
        return true
    } else {
        return false
    }
}

exports.wait = function (timeInMilliSecs) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSecs));
}

exports.getCurrentTimeInMilliSecs = function () {
    return new Date().getTime()
}

exports.stripWhiteSpace = function (string) {
    return string.replace(/\s+/g, '')
}

exports.lowerCaseFirstLetter = function (string) {
    return string.charAt(0).toLowerCase() + string.slice(1)
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
