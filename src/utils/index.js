exports.getFormattedPriceInFloat = function (value) {
    // remove $ symnbol in first char and any commas
    return parseFloat(value.substring(1).replace(',', ''));
}

exports.isReturnNegative = function (averageCost, currentMarketPrice, shareCount) {
    const returnValue = (shareCount * currentMarketPrice) - (shareCount * averageCost)

    if (returnValue < 0) {
        return true
    } else {
        return false
    }
}

exports.wait = function (timeInMilliSecs) {
    return new Promise(resolve => setTimeout(resolve, timeInMilliSecs));
}
