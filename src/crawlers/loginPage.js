const selectors = require('../../config/selectors.json');
const userInfo = require('../../config/credentials.json');
class LoginPage {
    crawl = async page => {
        return new Promise(async resolve => {
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

            // check if the user has 2FA enabled
            // as of now robinhood supports 2FA for sms and authenticator app

            // if 2FA is enabled the user is requested to enter a six digit code to get login access
            // even if 2FA is disabled the user will still be asked to enter a six digit code 
            // since he is logging-in for the first time in the browser

            // below i am using `waitForFunction` and `waitForSelector` functions to check if 2FA is enabled

            // the two promises are in a race condition, which ever resolves first executes the `then` part
            // the other promise will eventually fail due to a timeout error which is being caught

            // promise one
            // checking for `sms` button for accounts with with 2FA disabled
            page.waitForFunction(smsConfirmationButton => {
                if (document.querySelector(smsConfirmationButton).innerText === "SMS") {
                    return true
                }
            }, 1000, selectors.loginPage.smsConfirmationButton).then(async () => {
                await page.click(selectors.loginPage.smsConfirmationButton)

                await page.waitForSelector(selectors.loginPage.mfaFieldForSMS)

                await page.waitForFunction(mfaFieldForSMS => {
                    let keyLength = document.querySelector(mfaFieldForSMS).value.length
                    if (keyLength === 6) {
                        return true
                    }
                }, 1000, selectors.loginPage.mfaFieldForSMS)
                // await wait(15000)

                await page.click(selectors.loginPage.continueButton)

                await page.waitForNavigation()
                // await wait(5000)

                resolve()
            }).catch(err => { })

            // promise two
            // checking for button with name `mfa_code` for accounts with 2FA enabled
            page.waitForSelector(selectors.loginPage.mfaFieldForTwoFactAuth, { timeout: 5000 }).then(async () => {
                await page.waitForFunction(mfaFieldForTwoFactAuth => {
                    let keyLength = document.querySelector(mfaFieldForTwoFactAuth).value.length
                    if (keyLength === 6) {
                        return true
                    }
                }, 1000, selectors.loginPage.mfaFieldForTwoFactAuth)
                // await wait(15000)

                await page.click(selectors.loginPage.continueButton)

                await page.waitForNavigation()
                // await wait(5000)

                resolve()
            }).catch(err => { })
        })
    }
}

module.exports = LoginPage
