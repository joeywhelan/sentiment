/**
 * @fileoverview Winston logging config
 * @author Joey Whelan <joey.whelan@gmail.com>
 */
/*jshint esversion: 6 */

'use strict';
'use esversion 6';

const logger = require('winston');
const properties = require('./properties');

logger.add(logger.transports.File, {	
	level: properties.logLevel,
	filename: properties.logFile, 
	json: false, 
	timestamp: true,
	maxsize: properties.logSize,
	maxFiles: properties.maxLogFiles,
	handleExceptions: true
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
	level: properties.logLevel,
	timestamp: true,
	handleExceptions: true,
	colorize: true,
	json: false
});

logger.exitOnError = false;

module.exports = logger;
