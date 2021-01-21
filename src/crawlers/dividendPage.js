const utils = require('../utils');
const { autoScrollToBottom } = utils

class DividendPage {
    crawl = function (page) {
        return new Promise(async (resolve, reject) => {
            await page.goto('https://robinhood.com/account/history?type=dividends', {
                waitUntil: 'networkidle0'
            })
    
            await autoScrollToBottom(page);
    
            resolve()
    
            // const dividendData = await page.$$eval('section', sectionNodes => {
            //     let dividendData = sectionNodes.map(eachSection => {
            //         const sectionName = eachSection.childNodes[0].innerText
    
            //         let sectionData = Array.from(eachSection.childNodes).map((childNode, index) => {
            //             if (index !== 0) {
            //                 let dataString = childNode.innerText;
    
            //                 const [companyInfo, dividendDate, dividendAmount] = dataString.split('\n');
            //                 const companyName = companyInfo.replace(/Dividend\sfrom\s/, '');
    
            //                 return {
            //                     companyName,
            //                     dividendDate: dividendDate,
            //                     dividendAmount: dividendAmount
            //                 }
            //             }
            //         })
    
            //         return {
            //             sectionName,
            //             sectionData
            //         }
            //     })
    
            //     return dividendData
            // })
        })
    }
}

module.exports = DividendPage
