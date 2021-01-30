const selectors = require('../../config/selectors.json');
const utils = require('../utils');

const { autoScrollToBottom, getAbsolutePriceInFloat, getFormattedPriceInFloat, getValidDateWithYear } = utils;

class TransferPage {
    crawl = async page => {
        await page.goto('https://robinhood.com/account/history?type=transfers', {
            waitUntil: 'networkidle0'
        })

        await autoScrollToBottom(page);

        const scrapedTransferData = await page.$$eval(selectors.historyPage.transfersNode, sectionNodes => {
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

        const transferData = this.cleanScrapedData(scrapedTransferData)

        return transferData
    }

    cleanScrapedData = scrapedTransferData => {
        const transferData = {}
        let totalAmountInvested = 0

        scrapedTransferData.forEach(eachState => {
            const stateName = eachState.name
            const dataStrings = eachState.nodeStrings

            const stateData = dataStrings.map(string => {
                const [transferTypeInfo, transferDateInfo, transferAmount] = string.split('\n')
                const transferDate = getValidDateWithYear(transferDateInfo)
                const transferType = transferTypeInfo.includes('Deposit') ? 'deposit' : 'withdrawal'

                totalAmountInvested = totalAmountInvested + getFormattedPriceInFloat(transferAmount, 2)

                return {
                    transferType,
                    transferDate,
                    transferAmount: getAbsolutePriceInFloat(transferAmount, 2),
                }
            })

            transferData[stateName] = stateData
        })

        transferData['totalAmountInvested'] = parseFloat(totalAmountInvested.toFixed(2))

        return transferData
    }
}

module.exports = TransferPage
