const selectors = require('../../config/selectors.json')
const utils = require('../utils');

const { getFormattedPriceInFloat, isReturnNegative, lowerCaseFirstLetter, stripWhiteSpace } = utils;

class AccountPage {
    crawl = async (page) => {
        // get stocks data from account 
        await page.goto('https://robinhood.com/account', {
            waitUntil: 'networkidle0'
        })
        // await wait(5000)

        const scrappedStockData = await page.$$eval(selectors.accountPage.stocksTable, (arr) => {
            return arr.map((div, index) => {
                if (index === 1) {
                    let childNodes = div.firstChild.childNodes[1].childNodes

                    return Array.from(childNodes).map(node => {
                        return node.innerText
                    })
                } else if (index == 0) {
                    return Array.from(div.childNodes).map(node => {
                        return node.innerText
                    })
                }
            })
        })

        const { stocks, totalPortfolioValue } = this.cleanScrappedData(scrappedStockData);

        return { stocks, totalPortfolioValue }
    }

    cleanScrappedData = (scrappedStockData) => {
        const totalPortfolioValue = {}

        scrappedStockData[0].map(valueString => {
            let formattedValueData = valueString.split('\n')
            let valueTypeName = stripWhiteSpace(formattedValueData[0])
            valueTypeName = lowerCaseFirstLetter(valueTypeName)

            totalPortfolioValue[valueTypeName] = getFormattedPriceInFloat(formattedValueData[2], 1)
        })

        const stocks = scrappedStockData[1].map(stockString => {
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

        return {
            stocks,
            totalPortfolioValue
        }
    }
}

module.exports = AccountPage
