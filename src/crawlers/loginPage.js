const selectors = require('../../config/selectors.json');
const userInfo = require('../../config/credentials.json');

class LoginPage {
    crawl = async page => {
        return new Promise(async (resolve, reject) => {
            // open login page
            await page.goto('https://robinhood.com/login', {
                waitUntil: 'load'
            })

            // await wait(3000)
            await Promise.all([
                await page.waitForSelector(selectors.loginPage.usernameField),
                await page.waitForSelector(selectors.loginPage.passwordField)
            ])

            const userName = process.env.RH_USERNAME;
            const password = process.env.RH_PASSWORD;

            // fill in form
            await page.type(selectors.loginPage.usernameField, (userName || userInfo.username), { delay: 100 })
            await page.type(selectors.loginPage.passwordField, (password || userInfo.password), { delay: 100 })

            // click Sign In
            await page.click(selectors.loginPage.signInButton)

            await page.waitForSelector(selectors.loginPage.mfaField)

            await page.waitForFunction(mfaField => {
                let keyLength = document.querySelector(mfaField).value.length
                if (keyLength === 6) {
                    return true
                }
            }, 1000, selectors.loginPage.mfaField)
            // await wait(15000)

            await page.click(selectors.loginPage.continueButton)

            await page.waitForNavigation()
            // await wait(5000)

            resolve()
        })
    }
}

module.exports = LoginPage
