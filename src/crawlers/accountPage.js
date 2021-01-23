const selectors = require('../../config/selectors.json')

class AccountPage {
    crawl = page => {
        return new Promise(async (resolve, reject) => {
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

            resolve(scrappedStockData)
        })
    }
}

module.exports = AccountPage
