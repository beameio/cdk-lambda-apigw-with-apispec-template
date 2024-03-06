import {Request, Response} from 'express';
import DEBUG from 'debug';
import {sendError, sendOK} from './helpers';
import * as defaultMiddlewares from './middlewares';

const debug = DEBUG('beame:lambda:routes');

export default function init(requiresIAM = defaultMiddlewares.requiresIAM) {
	return {
		// datetime
		get_datetime: [async (req: Request, res: Response) => {
			debug('get_datetime');
			return sendOK(res, {result: new Date()});
		}],

		// operations
		post_addition: [defaultMiddlewares.setNoCache, async (req: Request, res: Response) => {
			debug('post_addition - ', req.body);
			try {
				return sendOK(res, {result: req.body.first + req.body.second});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
		post_subtraction: [defaultMiddlewares.setNoCache, async (req: Request, res: Response) => {
			debug('post_subtraction - ', req.body);
			try {
				return sendOK(res, {result: req.body.first - req.body.second});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
		post_multiplication: [defaultMiddlewares.setNoCache, async (req: Request, res: Response) => {
			debug('post_multiplication - ', req.body);
			try {
				return sendOK(res, {result: req.body.first * req.body.second});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
		post_division: [defaultMiddlewares.setNoCache, requiresIAM, async (req: Request, res: Response) => {
			debug('post_division - ', req.body);
			try {
				return sendOK(res, {result: req.body.first / req.body.second});
			} catch(ex) {
				sendError(res, 400, ex);
			}
		}],
	}
}
