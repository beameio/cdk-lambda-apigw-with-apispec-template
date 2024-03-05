import DEBUG from 'debug';
import serverless from 'serverless-http';
import cors from 'cors';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import {RouteMetadata} from 'express-openapi-validator/dist/framework/openapi.spec.loader';
import {OpenAPIV3} from 'express-openapi-validator/dist/framework/types';

import {isLambdaEnv} from './helpers';
import initRoutes from './routes';
import {debugRequest, extractToken, handleError, RequestWithContext, ContextType} from './middlewares';

const debug = DEBUG('beame:lambda:api:index');
const routes = await initRoutes();

const app = express();
app.use(cors());
app.use(express.json()); // automatically parse the incoming requests with JSON payloads (needed to correctly validate OpenApiValidator requests)
app.use(debugRequest);
app.use(extractToken); // extracts JWT token (if existing)
app.use(OpenApiValidator.middleware({
	apiSpec: (isLambdaEnv ? './' : './../../') + 'openapi.yaml', // openapi spec is copied to the function folder
	validateApiSpec: true,
	validateRequests: true, // (default)
	validateResponses: true, // false by default,
	operationHandlers: {
		basePath: './',
		// override because default resolver doesn't import correctly ES modules
		// and also avoids having x-eov-operation-handler in the openapi spec
		resolver: (basePath: string, route: RouteMetadata, apiDoc: OpenAPIV3.Document) => {
			const pathKey = route.openApiRoute.substring(route.basePath.length);
			const method = route.method.toLowerCase();
			const schema = apiDoc.paths[pathKey][method];

			// x-eov-operation-id takes priority over operationId
			const fn = schema['x-eov-operation-id'] || schema['operationId'];
			const func = routes[fn]; // use already imported routes instead of x-eov-operation-handler to get file name

			if (!func) {
				throw new Error(`Could not find [${fn}] function in route.js when trying to route [${route.method} ${route.expressRoute}].`);
			}
			return func.constructor.name === 'AsyncFunction'
				? (req: express.Request, res: express.Response, next: express.NextFunction) => Promise.resolve(func(req, res)).catch(next) // handle async function in express (https://bobbyhadz.com/blog/javascript-check-if-function-is-async)
				: func;
		}
	}
}));
app.use(handleError);

export const handler = serverless(app, {
	request(request: RequestWithContext, event: {requestContext: ContextType}, context: Object) {
		debug('event: %o', event);
		debug('context: %o', context);
		request.context = event.requestContext; // allow requestContext to be accessed in routes (used for iam auth)
	}
});

if (!isLambdaEnv) {
	app.listen(5000, () => {
		console.log(`application is listening on port 5000`);
	});
}
