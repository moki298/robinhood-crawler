const fs = require('fs');
const puppeteer = require('puppeteer');

const crawlers = require('./crawlers')
const { AccountPage, BankingPage, DividendPage, LoginPage, ProfilePage } = crawlers

const utils = require('./utils');
const { createDataFolderIfRequired, getCurrentTimeInMilliSecs, getFormattedPriceInFloat, getSumOfArray, isReturnNegative, lowerCaseFirstLetter, stripWhiteSpace, writeStocksToExcelSheet, writeDataToJSONFile } = utils;

require('dotenv').config();

(async () => {
    // get cookies
    // const cookiesString = await fs.readFileSync(`${__dirname}/../rh-cookies.json`, 'utf8');
    // const cookies = JSON.parse(cookiesString);

    // launch browser
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });

    const page = await browser.newPage();

    // set viewport
    await page.setViewport({
        width: 1340,
        height: 980,
        deviceScaleFactor: 1,
    });

    // // set cookies
    // await page.setCookie.apply(page, cookies);

    const loginPage = new LoginPage()
    await loginPage.crawl(page);

    // get cookies and save them in a JSON file
    // const cookies = await page.cookies()
    // console.info("cookies are ", cookies);

    // fs.writeFile('rh-cookies.json', JSON.stringify(cookies, null, 2), function(err) {
    //     if (err) throw err;
    //     console.log('completed write of cookies');
    // });

    // also set `logged_in` cookie after logging in to the JSON file

    const accountPage = new AccountPage()
    const scrappedStockData = await accountPage.crawl(page)

    const totalPortfolioValue = {}

    scrappedStockData[0].map(valueString => {
        let formattedValueData = valueString.split('\n')
        let valueTypeName = stripWhiteSpace(formattedValueData[0])
        valueTypeName = lowerCaseFirstLetter(valueTypeName)

        totalPortfolioValue[valueTypeName] = getFormattedPriceInFloat(formattedValueData[2], 1)
    })

    const stocks = scrappedStockData[1].map(stockString => {
        let formattedStockData = stockString.split('\n')
        let averageCost = getFormattedPriceInFloat(formattedStockData[4], 1)
        let currentMarketPrice = getFormattedPriceInFloat(formattedStockData[3], 1)
        let equity = getFormattedPriceInFloat(formattedStockData[6], 1)
        let shareCount = Number(formattedStockData[2])
        let totalReturn = isReturnNegative(averageCost, currentMarketPrice, shareCount) ? (-1 * (getFormattedPriceInFloat(formattedStockData[5]), 1)) : getFormattedPriceInFloat(formattedStockData[5], 1)

        return {
            averageCost,
            currentMarketPrice,
            equity,
            name: formattedStockData[0],
            shareCount,
            tickrSymbol: formattedStockData[1],
            totalReturn
        }
    })

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
