import DEBUG from 'debug';
import {Response} from 'express';

const debug = DEBUG('beame:lambda:helpers');

export const isLambdaEnv = process.env.AWS_EXECUTION_ENV?.startsWith('AWS_Lambda_');

export function sendError(res: Response, code: number, msg: Error | unknown) {
	const message = msg instanceof Error ? msg.message : String(msg);
	debug('Sending error (%s): %s', code, message);
	return res.type('application/problem+json').status(code).json({title: message, status: code});
}

export function sendOK(res: Response, data?: object, code = 200) {
	res.status(code);
	return data ? res.json(data) : res.send();
}
