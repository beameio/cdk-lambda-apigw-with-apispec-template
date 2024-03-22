import serverless from 'serverless-http';
import {ContextType, RequestWithContext} from './middlewares';
import {isLambdaEnv} from './helpers';
import initApp from './app';
import DEBUG from 'debug';

const debug = DEBUG('beame:lambda:index');
const app = initApp();

export const handler = serverless(app, {
	request(request: RequestWithContext, event: {requestContext: ContextType}, context: object) {
		debug('event: %o', event);
		debug('context: %o', context);
		request.context = event.requestContext; // allow requestContext to be accessed in routes (used for iam auth)
	}
});

if (!isLambdaEnv) {
	const port = 5001;
	app.listen(port, () => {
		console.log(`application is listening on port ${port}`);
	});
}
