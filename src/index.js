const puppeteer = require('puppeteer');

const crawlers = require('./crawlers')
const utils = require('./utils');

const { AccountPage, BankingPage, DividendPage, LoginPage, ProfilePage } = crawlers
const { createDataFolderIfRequired, getCookiesAndSave, getCurrentTimeInMilliSecs, getFormattedPriceInFloat, getSavedCookiesFromJSON, getSumOfArray, isReturnNegative, lowerCaseFirstLetter, stripWhiteSpace, writeStocksToExcelSheet, writeDataToJSONFile } = utils;

require('dotenv').config();

(async () => {
    // const cookies = await getSavedCookiesFromJSON()

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });

    const page = await browser.newPage();

    await page.setViewport({
        width: 1340,
        height: 980,
        deviceScaleFactor: 1,
    });

    // await page.setCookie.apply(page, cookies);

    const loginPage = new LoginPage()
    await loginPage.crawl(page);

    // run this to save cookies to rh-cookies JSON file
    // await getCookiesAndSave(page);

    const accountPage = new AccountPage()
    const { stocks, totalPortfolioValue } = await accountPage.crawl(page)

    // get data from banking page
    const bankingPage = new BankingPage()
    const scrappedTransactionsData = await bankingPage.crawl(page)

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
    // end banking page scrapping

    // get data from profile page https://robinhood.com/profile
    const profilePage = new ProfilePage()
    const { portfolioDistribution, sectorDistribution } = await profilePage.crawl(page)
    // end scrapping profile page

    // scrap dividend page
    const dividendPage = new DividendPage()
    const scrappedDividenData = await dividendPage.crawl(page)
    // end scrap dividend page

    const timeStampInMilliSecs = getCurrentTimeInMilliSecs()

    let data = {
        // dividendData,
        humanReadableTimeStampInLocalZone: new Date().toLocaleString(),
        portfolioDistribution,
        sectorDistribution,
        totalPortfolioValue,
        transactionsInfo,
        stocks,
        stockCount: stocks.length,
        timeStampInMilliSecs,
    }

    // create data folder if it doesn't exist
    await createDataFolderIfRequired().catch((err) => {
        console.log(err)
    })

    await writeStocksToExcelSheet(stocks).catch((err) => {
        console.log(err)
    })

    writeDataToJSONFile(data)

    await browser.close();
})().then().catch((err) => {
    console.log(err)
});
