/**
 * @fileoverview Object to hold app-specific configuration items
 * @author Joey Whelan <joey.whelan@gmail.com>
 */

/*jshint esversion: 6 */

'use strict';
'use esversion 6';

let properties = {};

properties.incontactVersion = 'v11.0';
properties.incontactName = 'yourName';
properties.incontactVendor = 'yourName';
properties.incontactKey = 'yourKey';
properties.incontactTokenUrl = 'https://api.incontact.com/InContactAuthorizationServer/Token';
properties.incontactUser = 'yourUser';
properties.incontactPwd = 'yourPwd';

properties.gcpKey = 'yourKey';
properties.gcpSttUrl = 'https://speech.googleapis.com/v1/speech:recognize?key=' + properties.gcpKey;
properties.gcpSntUrl = 'https://language.googleapis.com/v1/documents:analyzeSentiment?key=' + properties.gcpKey;
properties.gcpBucket = 'yourBucket';
properties.gcpCredentials = 'yourCred';

properties.path = '/process';  //URL path to REST interface
properties.listenPort = 9080;  //local server tcp port

properties.logLevel = 'debug';  //log level. options:  debug, info, error
properties.logFile = './sentiment.log';  //path to log file
properties.logSize = 50000000; //max log file size in bytes
properties.maxLogFiles = 2;  //number of log files to retain

module.exports = properties;

