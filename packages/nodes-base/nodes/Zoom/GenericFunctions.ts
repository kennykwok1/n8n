import { OptionsWithUri } from 'request';

import {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	ILoadOptionsFunctions
} from 'n8n-core';

import { IDataObject } from 'n8n-workflow';
import * as _ from 'lodash';

export async function zoomApiRequest(this: IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions, method: string, resource: string, body: object = {}, query: object = {}, headers: {} | undefined = undefined, option: {} = {}): Promise<any> { // tslint:disable-line:no-any

	// tslint:disable-line:no-any
	const authenticationMethod = this.getNodeParameter('authentication', 0, 'accessToken') as string;

	let options: OptionsWithUri = {
		method,
		headers: headers || {
			'Content-Type': 'application/json'
		},
		body,
		qs: query,
		uri: `https://api.zoom.us/v2${resource}`,
		json: true
	};
	options = Object.assign({}, options, option);
	if (Object.keys(body).length === 0) {
		delete options.body;
	}
	if (Object.keys(query).length === 0) {
		delete options.qs;
	}
	try {
		if (authenticationMethod === 'accessToken') {
			const credentials = this.getCredentials('zoomApi');
			if (credentials === undefined) {
				throw new Error('No credentials got returned!');
			}
			options.headers!.Authorization = `Bearer ${credentials.accessToken}`;

			//@ts-ignore
			return await this.helpers.request(options);
		} else {
			//@ts-ignore

			return await this.helpers.requestOAuth2.call(this, 'zoomOAuth2Api', options);
		}
	} catch (error) {
		if (error.statusCode === 401) {
			// Return a clear error
			throw new Error('The Zoom credentials are not valid!');
		}

		if (error.response && error.response.body && error.response.body.message) {
			// Try to return the error prettier
			throw new Error(`Zoom error response [${error.statusCode}]: ${error.response.body.message}`);
		}

		// If that data does not exist for some reason return the actual error
		throw error;
	}


}


export async function zoomApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	propertyName: string,
	method: string,
	endpoint: string,
	body: any = {},
	query: IDataObject = {}
): Promise<any> {
	// tslint:disable-line:no-any
	const returnData: IDataObject[] = [];

	let responseData;
	//query.maxResults = 300;

	do {
		responseData = await zoomApiRequest.call(
			this,
			method,
			endpoint,
			body,
			query
		);
		query.page_number = responseData['page_number'];
		returnData.push.apply(returnData, responseData[propertyName]);
	} while (
		responseData['page_number'] !== undefined &&
		responseData['page_number'] !== ''
	);

	return returnData;
}


