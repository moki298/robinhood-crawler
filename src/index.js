const fs = require('fs');
const util = require('util');

const puppeteer = require('puppeteer');
const writeFile = util.promisify(fs.writeFile);

const selectors = require('../config/selectors.json');
const userInfo = require('../config/credentials.json');
const { getFormattedPriceInFloat, isReturnNegative, wait } = require('./utils');

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

    const scrappedStockData = await page.$$eval('.col-13', (arr) => {
        return arr.map((div, index) => {
            // two elements with className col-13, we need the second one
            if (index === 1) {

                let childNodes = div.firstChild.childNodes[1].childNodes

                return Array.from(childNodes).map(node => {
                    return node.innerText
                })
            } else {
                return null
            }
        })
    })

    const stocks = scrappedStockData[1].map(stockString => {
        let formattedStockData = stockString.split('\n')
        let averageCost = getFormattedPriceInFloat(formattedStockData[4])
        let currentMarketPrice = getFormattedPriceInFloat(formattedStockData[3])
        let equity = getFormattedPriceInFloat(formattedStockData[6])
        let shareCount = Number(formattedStockData[2])
        let totalReturn = isReturnNegative(averageCost, currentMarketPrice, shareCount) ? -(getFormattedPriceInFloat(formattedStockData[5])) : getFormattedPriceInFloat(formattedStockData[5])

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

    const timeStampMilliSecs = new Date().getTime()

    let data = {
        stocks,
        timeStampMilliSecs,
    }

    let json = JSON.stringify({ data }, null, 4)

    await writeFile(`${__dirname}/../data/stocks.json`, json, 'utf8')

    // await browser.close();
})().then().catch((err) => {
    console.log(`${err}`)
});
