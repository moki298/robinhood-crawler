const fs = require('fs');
const path = require('path');
const util = require('util');

const puppeteer = require('puppeteer');
const writeFile = util.promisify(fs.writeFile);

const selectors = require('../config/selectors.json');
const userInfo = require('../config/credentials.json');
const utils = require('./utils');
const { autoScrollToBottom, getFormattedPriceInFloat, isReturnNegative, getCurrentTimeInMilliSecs, getSumOfArray, stripWhiteSpace, lowerCaseFirstLetter, writeToExcelSheet, createDataFolderIfRequired } = utils;

require('dotenv').config();
const userName = process.env.RH_USERNAME;
const password = process.env.RH_PASSWORD;

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
    await page.type(selectors.loginPage.usernameField, (userName || userInfo.username), { delay: 100 })
    await page.type(selectors.loginPage.passwordField, (password || userInfo.password), { delay: 100 })

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
    transactionsInfo['withDrawalsSum'] = -1 * getSumOfArray(transactionsInfo.withDrawals)
    // end banking page scrapping

    // get data from profile page https://robinhood.com/profile
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
    // end scrapping profile page

    // get dividend data from history page
    await page.goto('https://robinhood.com/account/history?type=dividends', {
        waitUntil: 'networkidle0'
    })

    await autoScrollToBottom(page);

    const dividendData = await page.$$eval('section', sectionNodes => {
        let dividendData = sectionNodes.map(eachSection => {
            const sectionName = eachSection.childNodes[0].innerText

            let sectionData = Array.from(eachSection.childNodes).map((childNode, index) => {
                if (index !== 0) {
                    let dataString = childNode.innerText;

                    const [companyInfo, dividendDate, dividendAmount] = dataString.split('\n');
                    const companyName = companyInfo.replace(/Dividend\sfrom\s/, '');

                    return {
                        companyName,
                        dividendDate: dividendDate,
                        dividendAmount: dividendAmount
                    }
                }
            })

            return {
                sectionName,
                sectionData
            }
        })

        return dividendData
    })
    // end dividend data scrapping

    const timeStampInMilliSecs = getCurrentTimeInMilliSecs()

    let data = {
        dividendData,
        humanReadableTimeStampInLocalZone: new Date().toLocaleString(),
        portfolioDistribution,
        sectorDistribution,
        totalPortfolioValue,
        transactionsInfo,
        stocks,
        stockCount: stocks.length,
        timeStampInMilliSecs,
    }

    let json = JSON.stringify({ data }, null, 4);

    // create data folder if it doesn't exist

    await createDataFolderIfRequired().catch((err) => {
        console.log(err)
    })

    await writeToExcelSheet(stocks).catch((err) => {
        console.log(err)
    })

    await writeFile(`${path.join(__dirname, '/../data/stocks.json')}`, json, 'utf8')

    // await browser.close();
})().then().catch((err) => {
    console.log(err)
});
