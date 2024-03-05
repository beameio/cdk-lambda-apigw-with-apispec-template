import DEBUG from 'debug';
import jwt from 'jws';
import {sendError} from './helpers';
import {Request, Response, NextFunction} from 'express';

export type ContextType = {identity?: {user: string}}
export type RequestWithContext = Request & {context?: ContextType};

const debug = DEBUG('beame:lambda:middlewares');

export function debugRequest(req: Request, res: Response, next: NextFunction) {
	debug('%s %s: { headers: %o, body: %o }', req.method, req.url, req.headers, req.body);
	return next();
}
export function extractToken(req: Request, res: Response, next: NextFunction) {
	// token is validated by API GW, so we just need to decode it if it's present
	const token = req.headers.authorization?.split(' ');
	if (token && token.length > 1) {
		// Handle token type and decode it
		switch (token[0].toLowerCase()) {
			case 'bearer':
				res.locals.token_payload = JSON.parse(jwt.decode(token[1]).payload);
				debug('Decoded payload: %o', res.locals.token_payload);
				break;
			default:
				debug('Nothing to do with token type: %s', token[0]);
				break;
		}
	} else {
		debug('No authorization token provided or it\'s invalid');
	}
	return next();
}
export function handleError(err: any, req: Request, res: Response, next: NextFunction) {
	sendError(res, 500, err.message);
	return next(err);
}
export function setNoCache(req: Request, res: Response, next: NextFunction) {
	res.set('Pragma', 'no-cache');
	res.set('Cache-Control', 'no-cache, no-store');
	return next();
}
export async function requiresIAM(req: RequestWithContext, res: Response, next: NextFunction) {
	// IAM is validated on API GW, based on https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
	// $context.identity.user = The principal identifier of the user that will be authorized against resource access. Supported for resources that use IAM authorization.
	return req.context?.identity?.user ? next() : sendError(res, 403, 'IAM auth is required');
}
