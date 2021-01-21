const selectors = require('../../config/selectors.json')

class ProfilePage {
    constructor() {

    }

    crawl = function (page) {
        return new Promise(async (resolve, reject) => {
            await page.goto('https://robinhood.com/profile', {
                waitUntil: 'networkidle0'
            })

            const { portfolioDistribution, sectorDistribution } = await page.$$eval(selectors.profilePage.dataNode, parentNode => {
                const dataNode = parentNode[0].childNodes[1].childNodes

                let portfolioDistribution = {}
                let sectorDistribution = {}


                Array.from(dataNode[0].childNodes).forEach(div => {
                    let [name, value] = div.innerText.split('\n')
                    portfolioDistribution[name] = value
                })

                const sectorDistributionNodeOne = dataNode[2].childNodes[0].childNodes
                const sectorDistributionNodeTwo = dataNode[2].childNodes[1].childNodes
                const sectorDistributionNodeStrings = Array.from(sectorDistributionNodeOne).concat(Array.from(sectorDistributionNodeTwo))

                Array.from(sectorDistributionNodeStrings).forEach(str => {
                    let [name, value] = str.innerText.split('\n')
                    sectorDistribution[name] = value
                })

                return { portfolioDistribution, sectorDistribution }
            })

            resolve({ portfolioDistribution, sectorDistribution })
        })
    }
}

module.exports = ProfilePage
