const utils = require('../utils');
const { autoScrollToBottom, getFormattedPriceInFloat } = utils

class DividendPage {
    crawl = async function (page) {
        await page.goto('https://robinhood.com/account/history?type=dividends', {
            waitUntil: 'networkidle0'
        })

        await autoScrollToBottom(page);

        const scrappedDividendData = await page.$$eval('section', sectionNodes => {
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

        const dividendData = this.cleanScrappedData(scrappedDividendData)

        return dividendData
    }

    cleanScrappedData = scrappedDividendData => {
        let dividendData = {}

        // dividend state can be pending, recent or older
        scrappedDividendData.forEach(eachState => {
            const stateName = eachState.name
            const dataStrings = eachState.nodeStrings

            const stateData = dataStrings.map(string => {
                const [companyInfo, dividendDate, dividendAmount, reInvestedInfo] = string.split('\n')
                const companyName = companyInfo.replace(/Dividend\sfrom\s/, '');
                const reInvested = reInvestedInfo === "Reinvested" ? true : false

                return {
                    companyName,
                    dividendDate: new Date(dividendDate),
                    dividendAmount: getFormattedPriceInFloat(dividendAmount, 2),
                    reInvested
                }
            })

            dividendData[stateName] = stateData
        })

        const totalDividenReceived = this.calculateTotalDividend(dividendData)
        dividendData["totalDividenReceived"] = totalDividenReceived

        return dividendData
    }

    calculateTotalDividend = dividendData => {
        let totalDividenReceived = 0
        const values = [...Object.values(dividendData)]

        values.forEach(eachState => {
            eachState.forEach(dividendInfo => {
                totalDividenReceived = totalDividenReceived + dividendInfo.dividendAmount
            })
        })

        return totalDividenReceived.toFixed(2)
    }
}

module.exports = DividendPage
