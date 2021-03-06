const selectors = require('../../config/selectors.json');
const utils = require('../utils');
const { autoScrollToBottom, getFormattedPriceInFloat, getValidDateWithYear } = utils

class DividendPage {
    crawl = async function (page) {
        await page.goto('https://robinhood.com/account/history?type=dividends', {
            waitUntil: 'networkidle0'
        })

        await autoScrollToBottom(page);

        const scrapedDividendData = await page.$$eval(selectors.historyPage.dividendsNode, sectionNodes => {
            const data = sectionNodes.map(eachSection => {
                const name = eachSection.childNodes[0].innerText
                const nodeStrings = []

                // remove first node as it is name
                const dataNodes = Array.from(eachSection.childNodes).slice(1)

                dataNodes.forEach(childNode => {
                    nodeStrings.push(childNode.innerText)
                })

                return {
                    name,
                    nodeStrings
                }
            })

            return data
        })

        const dividendData = this.cleanScrapedData(scrapedDividendData)

        return dividendData
    }

    cleanScrapedData = scrapedDividendData => {
        let dividendData = {}

        // dividend state can be pending, recent or older
        scrapedDividendData.forEach(eachState => {
            const stateName = eachState.name
            const dataStrings = eachState.nodeStrings

            const stateData = dataStrings.map(string => {
                const [companyInfo, dividendDateInfo, dividendAmount, reInvestedInfo] = string.split('\n')
                const companyName = companyInfo.replace(/Dividend\sfrom\s/, '');
                const reInvested = reInvestedInfo === "Reinvested" ? true : false
                const dividendDate = getValidDateWithYear(dividendDateInfo)

                return {
                    companyName,
                    dividendDate,
                    dividendAmount: getFormattedPriceInFloat(dividendAmount, 2),
                    reInvested
                }
            })

            dividendData[stateName] = stateData
        })

        const totalDividendReceived = this.calculateTotalDividend(dividendData)
        dividendData["totalDividendReceived"] = totalDividendReceived

        return dividendData
    }

    calculateTotalDividend = dividendData => {
        let totalDividendReceived = 0
        const values = [...Object.values(dividendData)]

        values.forEach(eachState => {
            eachState.forEach(dividendInfo => {
                totalDividendReceived = totalDividendReceived + dividendInfo.dividendAmount
            })
        })

        return parseFloat(totalDividendReceived.toFixed(2))
    }
}

module.exports = DividendPage
