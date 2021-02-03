# robinhood-crawler

## Overview

Use this tool to scrape portfolio data from your [Robinhood](http://www.robinhood.com/) account


Currently the tool scrapes the following data from the app and stores it in a JSON file:

- Stocks data from https://robinhood.com/account
- Dividends history from https://robinhood.com/account/history?type=dividends
- Portfolio and sector distribution percentage from https://robinhood.com/profile
- Transfer history from https://robinhood.com/account/history?type=transfers

## Prerequisites
- Node JS and npm(prefer node version 12+)

## Installation and Setup Instructions:

- Clone the repo to your machine
- Run `npm i` from the repo's root directory
- Fill the robinhood account username and password in `/config/credentials.json` file
  - Alternatively, the username and password can also be set as environment variables with names `RH_USERNAME` and `RH_PASSWORD` respectively

## Scraping Data:

- Once the setup is done, run `npm start` from the terminal for the tool to start scraping
- When requested to enter OTP(the tool should pass here waiting for the user input), carefully click inside the input field and enter the six digit code, the program should resume automatically once all the six digits are entered
- Scarping all the pages might take 2-3 minutes
- The tool should exit automatically once scraping is done

## Output

The data scraped is written to stocks.json file in the data directory, it contains the following properties(inside parent Object named data)

| Property        | Type           | Description  |
| :------------- |:-------------:| :-----|
| crypto     | Array      |   contains crypto information |
| dividendData | Object |  contains dividend information |
| humanizedLocalTime | String |  human interpretable local time |
| portfolioDistribution | Object | contains portfolio distribution in percentages, includes Stocks, ETFs, Crypto, Options |
| sectorDistribution | Object | contains sector distribution scraped from [profile](https://robinhood.com/profile) page |
| stocks | Array | lists all the stocks owned |
| stockCount | Number | total number of stocks owned|
| timeStampInMilliSecs | Number | Unix time stamp in milli secs |
| totalPortfolioValue | Object | contains total portfolio value scraped from [account](https://robinhood.com/account) page|
| transferInfo | Object | contains bank deposits and withdrawals information|

## Note

- The tool supports accounts with Two-Factor Authentication(2FA) turned on, just enter the One Time Password(OTP) in the webpage when requested and the app should successfully log you in and start scraping data
- The tool does not yet support accounts which does options trading.
