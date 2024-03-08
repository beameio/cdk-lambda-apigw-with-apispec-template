import cors from 'cors';
import assert from 'assert';
import express from 'express';
import * as OpenApiValidator from 'express-openapi-validator';
import {RouteMetadata} from 'express-openapi-validator/dist/framework/openapi.spec.loader';
import {OpenAPIV3} from 'express-openapi-validator/dist/framework/types';

import {isLambdaEnv} from './helpers';
import initRoutes from './routes';
import {debugRequest, extractToken, handleError, RequestWithContext, ContextType} from './middlewares';

export default function init(routes = initRoutes()) {
	const app = express();
	app.use(cors()); // allow cors
	app.use(express.json()); // automatically parse the incoming requests with JSON payloads (needed to correctly validate OpenApiValidator requests)
	app.use(debugRequest); // prints debug information on the call
	app.use(extractToken); // extracts JWT token (if existing) - available extracted at `res.locals.token_payload`
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
				const operationId = operation.operationId; // check method on operationId fields, by default library checks on x-eov-operation-handler
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
	app.use(handleError); // handle errors in case they exist
	return app;
}
