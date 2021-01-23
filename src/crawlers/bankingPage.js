const selectors = require('../../config/selectors.json')

class BankingPage {
    crawl = page => {
        return new Promise(async (resolve, reject) => {
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

            resolve(scrappedTransactionsData)
        })
    }
}

module.exports = BankingPage
