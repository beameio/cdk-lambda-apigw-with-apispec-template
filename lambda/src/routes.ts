import {Request, Response} from 'express';
import DEBUG from 'debug';
import {sendError, sendOK} from './helpers';
import * as defaultMiddlewares from './middlewares';

const debug = DEBUG('beame:lambda:routes');

export default function init(requiresIAM = defaultMiddlewares.requiresIAM, setNoCache = defaultMiddlewares.setNoCache) {
	return {
		// datetime
		get_datetime: [async (req: Request, res: Response) => {
			debug('get_datetime');
			return sendOK(res, {result: new Date()});
		}],

		// operations
		post_addition: [async (req: Request, res: Response) => {
			debug('post_addition - %o', req.body);

			// token_payload -- Example on using authentication payload (parsed already via middleware when available)
			debug('authentication headers - %s', req.headers.authorization);
			debug('authentication payload - %s', res.locals.token_payload);

			try {
				const result = req.body.first + req.body.second;
				debug('result - %s', result);
				return sendOK(res, {result});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
		// setNoCache -- example with no cache enabled
		post_subtraction: [setNoCache, async (req: Request, res: Response) => {
			debug('post_subtraction - %o', req.body);
			try {
				const result = req.body.first - req.body.second;
				debug('result - %s', result);
				return sendOK(res, {result});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
		post_multiplication: [async (req: Request, res: Response) => {
			debug('post_multiplication - %o', req.body);
			try {
				const result = req.body.first * req.body.second;
				debug('result - %s', result);
				return sendOK(res, {result});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
		// requiresIAM -- API Gw already validates IAM permissions, requireIAM is a way to enforce it on server side and serve as an example on how to handle it
		post_division: [requiresIAM, async (req: Request, res: Response) => {
			debug('post_division - %o', req.body);
			try {
				const result = req.body.first / req.body.second;
				debug('result - %s', result);
				return sendOK(res, {result});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
	}
}
