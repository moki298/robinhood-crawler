const selectors = require('../../config/selectors.json')
const utils = require('../utils');

const { getFormattedPriceInFloat, isReturnNegative, lowerCaseFirstLetter, stripWhiteSpace } = utils;

class AccountPage {
    crawl = async (page) => {
        // get asset data from account 
        await page.goto('https://robinhood.com/account', {
            waitUntil: 'networkidle0'
        })
        // await wait(5000)

        const scrapedData = await page.$$eval(selectors.accountPage.assetsTable, (arr) => {
            return arr.map((div, index) => {
                if (index === 1) {      // for stocks
                    let childNodes = div.firstChild.childNodes[1].childNodes

                    return Array.from(childNodes).map(node => {
                        return node.innerText
                    })
                } else if (index == 0) {
                    return Array.from(div.childNodes).map(node => {
                        return node.innerText
                    })
                } else if (index == 2) {    // for crypto assets
                    let childNodes = div.firstChild.childNodes[1].childNodes

                    return Array.from(childNodes).map(node => {
                        return node.innerText
                    })
                }
            })
        })

        const { crypto, stocks, totalPortfolioValue } = this.cleanScrapedData(scrapedData);

        return { crypto, stocks, totalPortfolioValue }
    }

    cleanScrapedData = (scrapedData) => {
        const totalPortfolioValue = {}
        const data = {}

        scrapedData[0].map(valueString => {
            let formattedValueData = valueString.split('\n')
            let valueTypeName = stripWhiteSpace(formattedValueData[0])
            valueTypeName = lowerCaseFirstLetter(valueTypeName)

            totalPortfolioValue[valueTypeName] = getFormattedPriceInFloat(formattedValueData[2], 1)
        })

        const stocks = scrapedData[1].map(stockString => {
            let formattedStockData = stockString.split('\n')
            let averageCost = getFormattedPriceInFloat(formattedStockData[4], 1)
            let currentMarketPrice = getFormattedPriceInFloat(formattedStockData[3], 1)
            let equity = getFormattedPriceInFloat(formattedStockData[6], 1)
            let shareCount = Number(formattedStockData[2])
            let totalReturn = isReturnNegative(averageCost, currentMarketPrice, shareCount) ? (-1 * (getFormattedPriceInFloat(formattedStockData[5]), 1)) : getFormattedPriceInFloat(formattedStockData[5], 1)

            return {
                averageCost,
                currentMarketPrice,
                equity,
                name: formattedStockData[0],
                shareCount,
                tickrSymbol: formattedStockData[1],
                totalReturn
            }
        })

        data['stocks'] = stocks
        data['totalPortfolioValue'] = totalPortfolioValue

        // if crypto assets exist
        if (scrapedData.length === 3 && scrapedData[2] !== null) {
            const crypto = scrapedData[2].map(cryptoString => {
                let formattedCryptoData = cryptoString.split('\n')
                let averageCost = getFormattedPriceInFloat(formattedCryptoData[4], 1)
                let currentPrice = getFormattedPriceInFloat(formattedCryptoData[3], 1)
                let equity = getFormattedPriceInFloat(formattedCryptoData[6], 1)
                let coinCount = Number(formattedCryptoData[2])
                let totalReturn = isReturnNegative(averageCost, currentPrice, coinCount) ? (-1 * (getFormattedPriceInFloat(formattedCryptoData[5]), 1)) : getFormattedPriceInFloat(formattedCryptoData[5], 1)

                return {
                    averageCost,
                    currentPrice,
                    equity,
                    coinName: formattedCryptoData[0],
                    coinCount,
                    tickrSymbol: formattedCryptoData[1],
                    totalReturn
                }
            })

            data['crypto'] = crypto
        }

        return data
    }
}

module.exports = AccountPage
