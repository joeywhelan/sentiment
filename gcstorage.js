/**
 * @fileoverview Class for depositing data on Google Cloud storage.
 * @author Joey Whelan <joey.whelan@gmail.com>
 */

/*jshint esversion: 6 */

'use strict';
'use esversion 6';

const intoStream = require('into-stream');
const storage = require('@google-cloud/storage')();
const properties = require('./properties');
const logger = require('./logger');
process.env.GOOGLE_APPLICATION_CREDENTIALS = properties.gcpCredentials;

/** @desc Class providing an object wrapper for API call to the Google Cloud Storage */
module.exports = class GCStorage {
	
	constructor() {	
		this.bucket = storage.bucket(properties.gcpBucket);
	}
	
	/**
	 * Private function for uploading a file to Google Cloud Storage.  Will propagate exceptions.
	 * @private
	 * @param {string} contactId - InContact call ID
	 * @param {string} name - file name
	 * @param {object} file - Google Cloud Storage File object
	 * @param {bytes}  content - bytes for audio files, string for transcripts and sentiments
	 * @return {Promise} Promise object representing the result of the save operation
	 */
	_save(contactId, name, file, content) {
		return new Promise((resolve, reject) => {
			intoStream(content)
			.pipe(file.createWriteStream())
			.on('error', (err) => {
				logger.error(`contactId:${contactId} _save - ${err}`);
				reject(err);
			})
			.on('finish', () => {
				logger.info(`contactId:${contactId} _save - ${name} uploaded`);
				resolve();
			});
		});
	}
	
	/**
	 * Public function for uploading audio, transcript, and sentiment Google Cloud Storage.  
	 * Will propagate exceptions.
	 * @param {string} contactId - InContact call ID
	 * @param {bytes} audio - call recording bytes
	 * @param {string} transcript - transcript of the audio
	 * @param {string} sentiment - stringified JSON object representing sentiment of transcript
	 * @return {Promise} Promise object representing the result of the uploads
	 */
	upload(contactId, audio, transcript, sentiment) {
		const dirName = contactId + '/';
		this.bucket.file(dirName);
		const audioName = dirName + contactId + '.wav';
		const transName = dirName + contactId + '.txt';
		const sntName   = dirName + contactId + '.json';
		
		const audioFile = this.bucket.file(audioName);
		const transFile = this.bucket.file(transName);
		const sntFile   = this.bucket.file(sntName);
		
		return this._save(contactId, audioName, audioFile, audio)
		.then(() => {
			this._save(contactId, transName, transFile, transcript);
		})
		.then(() => {
			this._save(contactId, sntName, sntFile, sentiment);
		})
		.catch((err) => {
			logger.error(`contactId:${contactId} _upload - ${err}`);
			throw err;
		});
	}

};
