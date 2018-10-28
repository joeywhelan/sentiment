/**
 * @fileoverview App server
 * @author Joey Whelan <joey.whelan@gmail.com>
 */
/*jshint esversion: 6 */
'use strict';
'use esversion 6';

const express = require('express');
const app = express();
const jsonParser = express.json();
const Admin = require('./admin.js');
const admin = new Admin();
const Sentiment = require('./sentiment.js');
const sentiment = new Sentiment();
const Storage = require('./gcstorage.js');
const storage = new Storage();
const properties = require('./properties');
const logger = require('./logger');

app.post(properties.path, jsonParser, (request, response) => {
	//send a response back to InContact immediately to release script-side resources
	response.status(200).end();
	
	const contactId = request.body.contactId;
	const fileName = request.body.fileName;
	let audio;
	
	logger.info(`contactId:${contactId} webserver - fileName:${fileName}`);
	admin.get(contactId, fileName) //Fetch the audio file (Base64-encoded) from InContact
	.then((json) => {
		audio = json.file;
		return sentiment.process(contactId, audio);  //Get transcript and sentiment of audio bytes
	})
	.then((json) => { //Upload the audio, transcript, and sentiment to Google Cloud Storage
		return storage.upload(contactId, Buffer.from(audio, 'base64'), json.transcript, JSON.stringify(json.sentiment));
	})
	.then(() => {
		admin.remove(contactId, fileName); //Delete the audio file from InContact
	})
	.catch((err) => {
		logger.error(`contactId:${contactId} webserver - ${err}`);
	});
});

app.listen(properties.listenPort);
logger.info(`webserver - started on port ${properties.listenPort}`);
