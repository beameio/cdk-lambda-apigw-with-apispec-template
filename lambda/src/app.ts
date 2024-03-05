import DEBUG from 'debug';
import serverless from 'serverless-http';
import cors from 'cors';
import assert from 'assert';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import {RouteMetadata} from 'express-openapi-validator/dist/framework/openapi.spec.loader';
import {OpenAPIV3} from 'express-openapi-validator/dist/framework/types';

import {isLambdaEnv} from './helpers';
import initRoutes from './routes';
import {debugRequest, extractToken, handleError, RequestWithContext, ContextType} from './middlewares';

const debug = DEBUG('beame:lambda:api:index');
const routes = initRoutes();

const app = express();
app.use(cors());
app.use(express.json()); // automatically parse the incoming requests with JSON payloads (needed to correctly validate OpenApiValidator requests)
app.use(debugRequest);
app.use(extractToken); // extracts JWT token (if existing)
app.use(OpenApiValidator.middleware({
	apiSpec: (isLambdaEnv ? './' : './../') + 'openapi.yaml', // openapi spec is copied to the function folder
	validateApiSpec: true,
	validateRequests: true, // (default)
	validateResponses: true, // false by default,
	operationHandlers: {
		basePath: './',
		// override because default resolver doesn't import correctly ES modules
		// and also avoids having x-eov-operation-handler in the openapi spec
		resolver: (basePath: string, route: RouteMetadata, apiDoc: OpenAPIV3.Document) => {
			type methodTypes = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
			const method = route.method.toLowerCase() as methodTypes;
			const path = route.openApiRoute.substring(route.basePath.length);
			const operation = apiDoc.paths[path][method];
			assert(operation, `Unable to find operation with '${path}' and '${method}'`);
			const operationId = operation.operationId;
			assert(operationId, `OperationId is not available for operation with '${path}' and '${method}'`);
			const func = routes[operationId as keyof typeof routes];
			assert(func, `Could not find '${operationId}' function in routes when trying to route [${route.method} ${route.expressRoute}].`)

			return func.constructor.name === 'AsyncFunction'
				// @ts-ignore
				? (req: express.Request, res: express.Response, next: express.NextFunction) => Promise.resolve(func(req, res, next)).catch(next) // handle async function in express (https://bobbyhadz.com/blog/javascript-check-if-function-is-async)
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
	const port = 5001;
	app.listen(port, () => {
		console.log(`application is listening on port ${port}`);
	});
}
