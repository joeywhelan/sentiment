/**
 * @fileoverview Class for converting audio to text and then performing sentiment analytics on that text.
 * @author Joey Whelan <joey.whelan@gmail.com>
 */

/*jshint esversion: 6 */

'use strict';
'use esversion 6';

const fetch = require('node-fetch');
const properties = require('./properties');
const logger = require('./logger');

/** @desc Class providing an object wrapper for REST calls to the Google STT and Sentiment API's. */
module.exports = class Sentiment {
	
	/**
	 * Wrapper for sending audio to Google Speech REST API for speech to text (stt).  Will propagate exceptions.
	 * @private
	 * @param {string} contactId - InContact call ID
	 * @param {string} msg base64-encoded string of the audio input
	 * @return {Promise} Promise object representing the result of the API call: audio bytes converted to a string.
	 */
	_stt(contactId, msg) {
		const audio = {'content' : msg};
		const config = {
				languageCode: 'en-US'
		};
		const body = {
				'audio' : audio,
				'config' : config
		};
		
		return fetch(properties.gcpSttUrl, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {'Content-Type' : 'application/json; charset=utf-8'},
			cache: 'no-store',
			mode: 'cors'
		})
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			else {
				const msg = 'Response status: ' + response.status;
				throw new Error(msg);
			}	
		})
		.then(json => {
			if (json.results &&
				json.results.length > 0 &&
				json.results[0].alternatives &&
				json.results[0].alternatives.length > 0 &&
				json.results[0].alternatives[0].transcript) {
				const transcript = json.results[0].alternatives[0].transcript;
				logger.info(`contactId:${contactId} _stt - transcript length:${transcript.length}`);
				return transcript;
			}
			else {
				const msg = 'Invalid/missing result value';
				throw new Error(msg);
			}
		})
		.catch(err => { 
			logger.error(`contactId:${contactId} _stt - ${err}`);
			throw err;
		});		
	}
	
	/**
	 * Wrapper for sending text to Google Sentiment REST API for analytics.  Will propagate exceptions.
	 * @private
	 * @param {string} contactId - InContact call ID
	 * @param {string} text
	 * @return {Promise} Promise object representing the result of the API call: sentiment.
	 */
	_analyze(contactId, text) {
		const document = {
				'type': 'PLAIN_TEXT',
				'language': 'en',
				'content': text
		};
		
		const body = {
				'document' : document,
				'encodingType' : 'UTF8'
		};	
		
		return fetch(properties.gcpSntUrl, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {'Content-Type' : 'application/json; charset=utf-8'},
			cache: 'no-store',
			mode: 'cors'
		})
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			else {
				const msg = 'Response status: ' + response.status;
				throw new Error(msg);
			}	
		})
		.then(json => {
			if (json.documentSentiment) {
				logger.info(`contactId:${contactId} _analyze - sentiment analysis complete`);
				const result = {
						'transcript': text,
						'sentiment': json.documentSentiment
				};
				return result;
			}
			else {
				const msg = 'Invalid/missing result value';
				throw new Error(msg);
			}
		})
		.catch(err => { 
			logger.error(`contactId:${contactId} _analyze - ${err}`);
			throw err;
		});		
	}
	
	/**
	 * Main function of class.  Receives audio bytes as input and returns a text sentiment analysis.
	 *  Will propagate exceptions.
	 * @param {string} contactId - InContact call ID
	 * @param {string} msg Base64-encoded string of audio bytes
	 * @return {Promise} Promise object representing the result of the sentiment analytics API cal
	 */
	process(contactId, audio) {
		return this._stt(contactId, audio)
			.then((text) => {
				return this._analyze(contactId, text);
			})
			.catch(err => {
				logger.error(`contactId:${contactId} process - ${err}`);
				throw err;
			});
	}
};
