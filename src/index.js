const puppeteer = require('puppeteer');

const crawlers = require('./crawlers')
const screenLogger = require('./utils/logger').screenLogger
const utils = require('./utils');

const { AccountPage, BankingPage, DividendPage, LoginPage, ProfilePage, TransferPage } = crawlers
const { createDataFolderIfRequired, getCookiesAndSave, getCurrentTimeInMilliSecs, setCookiesFromJSON, writeStocksToExcelSheet, writeDataToJSONFile } = utils;

require('dotenv').config();

(async () => {
    // const cookies = await setCookiesFromJSON()

    screenLogger.info(`Launching Chrome`)
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
    screenLogger.info(`Logging-in`)
    const loginPage = new LoginPage()
    await loginPage.crawl(page);
    screenLogger.info(`Successfully Logged-in`)

    // run this to save cookies to rh-cookies JSON file
    // await getCookiesAndSave(page);

    screenLogger.info(`Scraping Account Page`)
    const accountPage = new AccountPage()
    const { crypto, stocks, totalPortfolioValue } = await accountPage.crawl(page)

    // const bankingPage = new BankingPage()
    // const transferInfo = await bankingPage.crawl(page)

    screenLogger.info(`Scraping Dividend Data`)
    const dividendPage = new DividendPage()
    const dividendData = await dividendPage.crawl(page)

    screenLogger.info(`Scraping Profile Page`)
    const profilePage = new ProfilePage()
    const { portfolioDistribution, sectorDistribution } = await profilePage.crawl(page)

    screenLogger.info(`Scraping Transfer Data`)
    const transferPage = new TransferPage()
    const transferInfo = await transferPage.crawl(page)

    const timeStampInMilliSecs = getCurrentTimeInMilliSecs()

    let data = {
        crypto,
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
        screenLogger.error(err)
    })

    screenLogger.info(`Writing data to csv file`)
    await writeStocksToExcelSheet(stocks).catch((err) => {
        screenLogger.error(err)
    })

    screenLogger.info(`Writing data to JSON file`)
    writeDataToJSONFile(data)

    screenLogger.info(`Exiting`)
    await browser.close();
})().then().catch((err) => {
    screenLogger.error(err)
});
