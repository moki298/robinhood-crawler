const selectors = require('../../config/selectors.json');
const utils = require('../utils');

const { autoScrollToBottom, getFormattedPriceInFloat, getSumOfArray } = utils;

class TransferPage {
    crawl = async page => {
        await page.goto('https://robinhood.com/account/history?type=transfers', {
            waitUntil: 'networkidle0'
        })

        await autoScrollToBottom(page);

        const scrapedTransactionsData = await page.$$eval(selectors.historyPage.transfersNode, sectionNodes => {
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

        console.log(scrapedTransactionsData)

        // const transferData = this.cleanScrapedData(scrapedDividendData)

        // return transferData
    }

    cleanScrapedData = scrapedDividendData => {
        // let dividendData = {}

        // // dividend state can be pending, recent or older
        // scrapedDividendData.forEach(eachState => {
        //     const stateName = eachState.name
        //     const dataStrings = eachState.nodeStrings

        //     const stateData = dataStrings.map(string => {
        //         const [companyInfo, dividendDateInfo, dividendAmount, reInvestedInfo] = string.split('\n')
        //         const companyName = companyInfo.replace(/Dividend\sfrom\s/, '');
        //         const reInvested = reInvestedInfo === "Reinvested" ? true : false
        //         const dividendDate = getDividendDate(dividendDateInfo)

        //         return {
        //             companyName,
        //             dividendDate,
        //             dividendAmount: getFormattedPriceInFloat(dividendAmount, 2),
        //             reInvested
        //         }
        //     })

        //     dividendData[stateName] = stateData
        // })

        // const totalDividenReceived = this.calculateTotalDividend(dividendData)
        // dividendData["totalDividenReceived"] = totalDividenReceived

        // return dividendData
    }

    // cleanScrapedData = (scrapedTransactionsData) => {
    // const transactionsStrings = scrapedTransactionsData[1]

    // // remove the first element which is null
    // transactionsStrings.shift()

    // // Eg String: 'Deposit from CHASE COLLEGE\nJan 8\n+$123.00',
    // const transactions = transactionsStrings.map(value => {
    //     const amountString = value.split('\n')[2]
    //     return getFormattedPriceInFloat(amountString, 2)
    // })

    // let transactionsInfo = {
    //     deposits: [],
    //     withDrawals: [],
    // }

    // transactions.map(value => {
    //     if (value >= 0) {
    //         transactionsInfo.deposits.push(value)
    //     } else if (value < 0) {
    //         transactionsInfo.withDrawals.push(value)
    //     }
    // })

    // transactionsInfo['depositsSum'] = getSumOfArray(transactionsInfo.deposits)
    // transactionsInfo['withDrawalsSum'] = -1 * getSumOfArray(transactionsInfo.withDrawals)

    // return transactionsInfo
    // }
}

module.exports = TransferPage
