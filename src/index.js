const fs = require('fs');
const path = require('path');
const util = require('util');

const puppeteer = require('puppeteer');
const writeFile = util.promisify(fs.writeFile);

const selectors = require('../config/selectors.json');
const userInfo = require('../config/credentials.json');
const utils = require('./utils');
const { getFormattedPriceInFloat, isReturnNegative, getCurrentTimeInMilliSecs, getSumOfArray, stripWhiteSpace, lowerCaseFirstLetter, writeToExcelSheet, createDataFolderIfRequired } = utils;

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

    // set cookies
    // await page.setCookie.apply(page, cookies);

    // open login page
    await page.goto('https://robinhood.com/login', {
        waitUntil: 'load'
    })

    // await wait(3000)
    await Promise.all([
        await page.waitForSelector(selectors.loginPage.usernameField),
        await page.waitForSelector(selectors.loginPage.passwordField)
    ])

    // fill in form
    await page.type(selectors.loginPage.usernameField, userInfo.username, { delay: 100 })
    await page.type(selectors.loginPage.passwordField, userInfo.password, { delay: 100 })

    // click Sign In
    await page.click(selectors.loginPage.signInButton)

    await page.waitForSelector(selectors.loginPage.mfaField)

    // get cookies and save them in a JSON file

    // const cookies = await page.cookies()
    // console.info("cookies are ", cookies);

    // fs.writeFile('rh-cookies.json', JSON.stringify(cookies, null, 2), function(err) {
    //     if (err) throw err;
    //     console.log('completed write of cookies');
    // });

    // also set `logged_in` cookie after logging in to the JSON file

    await page.waitForFunction((mfaField) => {
        let keyLength = document.querySelector(mfaField).value.length
        if (keyLength === 6) {
            return true
        }
    }, 1000, selectors.loginPage.mfaField)
    // await wait(15000)

    await page.click(selectors.loginPage.continueButton)

    await page.waitForNavigation()
    // await wait(5000)

    // go to the account page, to get list of all stocks in the portfolio
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
        let totalReturn = isReturnNegative(averageCost, currentMarketPrice, shareCount) ? -(getFormattedPriceInFloat(formattedStockData[5]), 1) : getFormattedPriceInFloat(formattedStockData[5], 1)

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
    transactionsInfo['withDrawalsSum'] = getSumOfArray(transactionsInfo.withDrawals)

    const timeStampInMilliSecs = getCurrentTimeInMilliSecs()

    let data = {
        humanReadableTimeStampInLocalZone: new Date().toLocaleString(),
        totalPortfolioValue,
        transactionsInfo,
        stocks,
        stockCount: stocks.length,
        timeStampInMilliSecs,
    }

    let json = JSON.stringify({ data }, null, 4)

    // create data folder if it doesn't exist

    await createDataFolderIfRequired().catch((err) => {
        console.log(err)
    })

    await writeToExcelSheet(stocks).catch((err) => {
        console.log(err)
    })

    await writeFile(`${path.join(__dirname, '/../data/stocks.json')}`, json, 'utf8')

    await browser.close();
})().then().catch((err) => {
    console.log(err)
});
