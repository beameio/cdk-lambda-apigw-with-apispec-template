import DEBUG from 'debug';
import {Response} from 'express';

const debug = DEBUG('beame:lambda:helpers');

export const isLambdaEnv = process.env.AWS_EXECUTION_ENV?.startsWith('AWS_Lambda_');

export function sendError(res: Response, code: number, msg: string) {
	debug('Sending error (%s): %s', code, msg);
	return res.type('application/problem+json').status(code).json({title: msg, status: code});
}

export function sendOK(res: Response, data?: JSON, code = 200) {
	res.status(code);
	return data ? res.json(data) : res.send();
}
