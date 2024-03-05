import {Request, Response} from 'express';
import DEBUG from 'debug';
import {sendError, sendOK} from './helpers';
import * as defaultMiddlewares from './middlewares';

const debug = DEBUG('beame:lambda:routes');

export default async function init(requiresIAM = defaultMiddlewares.requiresIAM) {
	return {
		// users
		// post_users: [async (req, res) => {
		// 	debug('Creating Users:', req.body);
		// 	return sendOK(res);
		// 	// const saved = await Developer.save(req.body);
		// 	// debug('Saved Developer:', saved);
		// 	// sendOK(res, {id: saved.id}, 201);
		// }],
		get_users: [async (req: Request, res: Response) => {
			debug('Getting All Users');
			return sendOK(res);
			// const results = await Developer.find({withDeleted: true});
			// sendOK(res, {results});
		}],

		get_user: [async (req: Request, res: Response) => {
			debug('Getting User:', req.params.user_id);
			return sendOK(res);
			// const result = await Developer.findOneBy({id: req.params.developer_id});
			// result ? sendOK(res, result) : sendError(res, 400, 'Developer not found');
		}],
		put_user: [defaultMiddlewares.setNoCache, async (req: Request, res: Response) => {
			debug('Updating User:', req.params.user_id);
			return sendOK(res);
			// const result = await Developer.update({id: req.params.developer_id}, req.body);
			// result.affected > 0 ? sendOK(res) : sendError(res, 400, 'Unable to update Developer');
		}],
		delete_user: [requiresIAM, async (req: Request, res: Response) => {
			debug('Deleting User:', req.params.user_id);
			return sendOK(res);
			// const developer = await Developer.findOne({relations: {identities: true}, where: {id: req.params.developer_id}});
			// if(developer) {
			// 	await Promise.all(developer.identities.map(x => x.softRemove()));
			// 	await developer.softRemove();
			// 	return sendOK(res);
			// }
			// sendError(res, 400, 'Developer not found');
		}],
	}
}
