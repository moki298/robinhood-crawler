const fs = require('fs');
const util = require('util');

const puppeteer = require('puppeteer');
const writeFile = util.promisify(fs.writeFile);
const userInfo = require('../config/credentials.json');

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
        await page.waitForSelector('input[name="username"]'),
        await page.waitForSelector('input[type="password"]')
    ])

    // fill in form
    await page.type('input[name="username"]', userInfo.username, { delay: 100 })
    await page.type('input[type="password"]', userInfo.password, { delay: 100 })

    // click Sign In
    await page.click('button span')

    await page.waitForSelector('input[name="mfa_code"]')

    // get cookies and save them in a JSON file

    // const cookies = await page.cookies()
    // console.info("cookies are ", cookies);

    // fs.writeFile('rh-cookies.json', JSON.stringify(cookies, null, 2), function(err) {
    //     if (err) throw err;
    //     console.log('completed write of cookies');
    // });

    // also set `logged_in` cookie after logging in to the JSON file

    await page.waitForFunction(() => {
        let keyLength = document.querySelector('input[name="mfa_code"]').value.length
        if (keyLength === 6) {
            return true
        }
    }, 1000)
    // await wait(15000)

    await page.click('button[type="submit"]')

    await page.waitForNavigation()
    // await wait(5000)

    // go to the account page, to get list of all stocks in the portfolio
    await page.goto('https://robinhood.com/account', {
        waitUntil: 'networkidle0'
    })
    // await wait(5000)

    const data = await page.$$eval('.col-13', (arr) => {
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
    
    // async data => {
    const stocks = data[1].map(stockString => {
        let  formattedStockData = stockString.split('\n')
        return {
            name: formattedStockData[0],
            tickrSymbol: formattedStockData[1],
            shareCount: formattedStockData[2],
            currentMarketPrice: formattedStockData[3],
            averageCost: formattedStockData[4],
            totalReturn: formattedStockData[5],
            equity: formattedStockData[6]
        }
    })

    let json = JSON.stringify({stocks}, null, 4)
    
    await writeFile(`${__dirname}/../data/stocks.json`, json, 'utf8')

    // await browser.close();
})().then().catch((err) => {
    console.log(`${err}`)
});

function wait(timeInMilliSecs) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSecs));
}
