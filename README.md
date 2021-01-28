# robinhood-crawler

## Overview

Use this tool to scrap portfolio data from your [Robinhood](http://www.robinhood.com/) account.

## Prerequisites
- Node JS and npm(prefer node version 12+)

## Installation Instructions:

- Clone the repo to your machine
- Run `npm i` from the repo's root directory
- Fill the robinhood account username and password in `/config/credentials.json` file
  - Alternatively, the username and password can also be set as environment variables with names `RH_USERNAME` and `RH_PASSWORD` respectively
- Once this is done, run `npm start` from the terminal for the app to start

## Note

- The tool supports accounts with Two-Factor Authentication(2FA) turned on, just enter the One Time Password(OTP) in the webpage when required and the app should successfully log you in and start scrapping data
