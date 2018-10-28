/**
 * @fileoverview Class for getting/deleting files from InContact
 * @author Joey Whelan <joey.whelan@gmail.com>
 */
/*jshint esversion: 6 */

'use strict';
'use esversion 6';

const fetch = require('node-fetch');
const btoa = require('btoa');
const properties = require('./properties');
const logger = require('./logger');

/** @desc Class providing an object wrapper for REST calls to the Incontact Admin API. */
module.exports = class Admin {
	
	constructor() {	
		/** @private @const @type {string} Base64-encoded key to be used to request API token*/
		this.key = btoa(properties.incontactName + '@' + properties.incontactVendor + 
				':' + properties.incontactKey);
	}
	
	/**
	 * Uses a base64-encoded key to make an request for an API token.  Will propagate exceptions.
	 * @private
	 * @param {string} contactId - InContact call ID
	 * @param {string} key - Based64-encoded API key
	 * @param {string} url - API URL for fetching an InContact API token
	 * @return {Promise} Promise object representing the result of fetching an API token
	 */
	_getToken(contactId, key, url) {
		const body = {'grant_type' : 'password',
						'username': properties.incontactUser,
						'password': properties.incontactPwd
		};
		
		return fetch(url, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type' : 'application/json', 
				'Authorization' : 'basic ' + this.key
			},
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
			if (json && json.access_token && json.resource_server_base_uri) {
				logger.info(`contactId:${contactId} _getToken - token received`);
				return json;
			}
			else {
				const msg = 'Missing token and/or uri';
				throw new Error(msg);
			}
		})
		.catch(err => {
			logger.error(`contactId:${contactId} _getToken - ${err}`);
			throw err;
		});
	}
	
	/**
	 * Performs API call to fetch a file from InContact.  Will propagate exceptions.
	 * @private
	 * @param {string} contactId - InContact call ID
	 * @param {string} token - InContact API token
	 * @param {string} uri - API URI
	 * @param {string} fileName - name of file (with full path) to be fetched from InContact
	 * @return {Object} JSON object with filename and Base64-encoded contents of file.
	 */
	_getFile(contactId, token, uri, fileName) {
		const url = `${uri}services/${properties.incontactVersion}/files?fileName=${encodeURIComponent(fileName)}`;
		
		return fetch(url, {
			method: 'GET',
			headers: {'Authorization' : 'bearer ' + token},
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
			if (json && json.files) {
					logger.info(`contactId:${contactId} _getFile - length:${json.files.file.length}`);
					return json.files;
			} 
			else {
				const msg = 'Missing files object';
				throw new Error(msg);
			}
		})
		.catch(err => {
			logger.error(`contactId:${contactId} _getFile - ${err}`);
			throw err;
		});
	}
	
	/**
	 * API call to delete a file from InContact.  Will propagate exceptions.
	 * @private
	 * @param {string} contactId - InContact call ID
	 * @param {string} token - InContact API token
	 * @param {string} fileName - name of file (with full path) to be fetched from InContact
	 * @param {string} uri - API URI
	 * 
	 * @return {string} JSON object of response status text
	 */
	_removeFile(contactId, token, uri, fileName) {
		const url = `${uri}services/${properties.incontactVersion}/files?fileName=${encodeURIComponent(fileName)}`;
		
		return fetch(url, {
			method: 'DELETE',
			headers: {'Authorization' : 'bearer ' + token},
			cache: 'no-store',
		    mode: 'cors'
		})
		.then(response => {
			if (response.ok) {
				logger.info(`contactId:${contactId} _removeFile - file deleted`);
				return {'text': response.statusText};
			}
			else {
				throw new Error(response.statusText);
			}
		})
		.catch(err => {
			logger.error(`contactId:${contactId} _removeFile - ${err}`);
			throw err;
		});
	}
	
	/**
	 * Makes two API calls (get a token, get a file) to fetch a file.  Will propagate exceptions.
	 * @param {string} contactId - InContact call ID
	 * @param {string} fileName - full path of file to be fetched from InContact
	 * @return {Promise} Promise object representing the result of API calls
	 */
	get(contactId, fileName) {
		return this._getToken(contactId, this.key, properties.incontactTokenUrl)
			.then(data => {    //use result of the getToken() call for token and uri
				return this._getFile(contactId, data.access_token, data.resource_server_base_uri, fileName);
			})
			.catch(err => {
				logger.error(`contactId:${contactId} get - ${err}`);
				throw err;
			});
	}
	
	/**
	 * Makes two API calls (get a token, delete a file) to remove a file.  Will propagate exceptions.
	 * @param {string} contactId - InContact call ID
	 * @param {string} fileName - full path of file to be deleted from InContact
	 * @return {Promise} Promise object representing the result of API calls
	 */
	remove(contactId, fileName) {
		return this._getToken(contactId, this.key, properties.incontactTokenUrl)
		.then(data => {    //use result of the getToken() call to for token and uri	
			return this._removeFile(contactId, data.access_token, data.resource_server_base_uri, fileName);
		})
		.catch(err => {
			logger.error(`contactId:${contactId} remove - ${err}`);
			throw err;
		});
	}
};
