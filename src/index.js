const puppeteer = require('puppeteer');

const crawlers = require('./crawlers')
const utils = require('./utils');

const { AccountPage, BankingPage, DividendPage, LoginPage, ProfilePage, TransferPage } = crawlers
const { createDataFolderIfRequired, getCookiesAndSave, getCurrentTimeInMilliSecs, getSavedCookiesFromJSON, writeStocksToExcelSheet, writeDataToJSONFile } = utils;

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

    // const bankingPage = new BankingPage()
    // const transferInfo = await bankingPage.crawl(page)

    const transferPage = new TransferPage()
    const transferInfo = await transferPage.crawl(page)

    const profilePage = new ProfilePage()
    const { portfolioDistribution, sectorDistribution } = await profilePage.crawl(page)

    const dividendPage = new DividendPage()
    const dividendData = await dividendPage.crawl(page)

    const timeStampInMilliSecs = getCurrentTimeInMilliSecs()

    let data = {
        dividendData,
        humanReadableTimeStampInLocalZone: new Date().toLocaleString(),
        portfolioDistribution,
        sectorDistribution,
        totalPortfolioValue,
        transferInfo,
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
