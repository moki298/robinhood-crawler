const selectors = require('../../config/selectors.json');
const utils = require('../utils');

const { getFormattedPriceInFloat, getSumOfArray } = utils;

class BankingPage {
    crawl = async page => {
        await page.goto('https://robinhood.com/account/banking', {
            waitUntil: 'networkidle0'
        })

        const scrappedTransactionsData = await page.$$eval(selectors.bankingPage.transfersNode, (arr) => {
            return arr.map((div, index) => {
                // if pending transfers exists the length would be 3 else the length is 2
                if (arr.length == 2) {
                    if (index == 1) {
                        return Array.from(div.childNodes).map(node => {
                            // the first child is a title with a h2 tag so we ignore it and only consider div tags
                            if (node.nodeName === "DIV") {
                                return node.innerText
                            }
                        })
                    }
                } else if (arr.length == 3) {
                    if (index == 1) {
                        // index 1 is pending transfers

                    } else if (index == 2) {
                        // index 2 is approved transfers

                    }
                }
            })
        })

        const transactionsInfo = this.cleanScrappedData(scrappedTransactionsData)

        return transactionsInfo
    }

    cleanScrappedData = (scrappedTransactionsData) => {
        const transactionsStrings = scrappedTransactionsData[1]

        // remove the first element which is null
        transactionsStrings.shift()

        // Eg String: 'Deposit from CHASE COLLEGE\nJan 8\n+$123.00',
        const transactions = transactionsStrings.map(value => {
            const amountString = value.split('\n')[2]
            return getFormattedPriceInFloat(amountString, 2)
        })

        let transactionsInfo = {
            deposits: [],
            withDrawals: [],
        }

        transactions.map(value => {
            if (value >= 0) {
                transactionsInfo.deposits.push(value)
            } else if (value < 0) {
                transactionsInfo.withDrawals.push(value)
            }
        })

        transactionsInfo['depositsSum'] = getSumOfArray(transactionsInfo.deposits)
        transactionsInfo['withDrawalsSum'] = -1 * getSumOfArray(transactionsInfo.withDrawals)

        return transactionsInfo
    }
}

module.exports = BankingPage
