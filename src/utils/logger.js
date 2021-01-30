const winston = require('winston')

const format = winston.format
const combine = format.combine
const timestamp = format.timestamp
const label = format.label
const printf = format.printf

const logFormat = printf(({ label, level, message, timestamp }) => {
    return `[${label}] ${new Date(timestamp).toLocaleString()} ${level}: ${message}`;
});

const defaultLabel = 'RHCrawler'

// logs to both console and the log file
exports.logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: `log.txt` })
    ],

    format: combine(
        label({ label: defaultLabel }),
        timestamp(),
        logFormat
    ),
})

exports.screenLogger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ],

    format: combine(
        winston.format.colorize(),
        label({ label: defaultLabel }),
        timestamp(),
        logFormat
    ),
})

exports.fileLogger = winston.createLogger({
    transports: [
        new winston.transports.File({ filename: `log.txt` }),
    ],

    format: combine(
        label({ label: defaultLabel }),
        timestamp(),
        logFormat
    ),
})
