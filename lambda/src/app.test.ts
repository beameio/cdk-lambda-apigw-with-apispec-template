import initApp from './app';
import initRoutes from './routes';
import request from 'supertest';
import {Application} from 'express';

const userAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const user_bearer_headers:  Record<string, string> = {
	'Authorization': `Bearer ${userAuthToken}`,
	'Content-Type': 'application/json'
};
const iam_headers:  Record<string, string> = {
	'x-amz-security-token': 'XXXXXX',
	'Authorization': 'AWS4-HMAC-SHA256 Credential=ASIA2H7J7BBCS3NSG47S/20220803/eu-central-1/execute-api/aws4_request, SignedHeaders=accept;content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token, Signature=XXXXXX',
	'Content-Type': 'application/json'
};

let app: Application;
beforeEach(async () => {
	const routes = initRoutes((req, res, next) => next());
	app = initApp(routes);
});

describe('/datetime', () => {
	const endpoint = '/datetime';
	test('get', async () => {
		const startDate = Date.now();
		const response = await request(app)
			.get(endpoint)
			.set(user_bearer_headers);

		expect(response.statusCode).toBe(200);
		expect(response.body.result).not.toBeNull();
		const date = new Date(response.body.result).getTime();
		expect(date).toBeGreaterThan(startDate);
		expect(date).toBeLessThan(Date.now());
	});
});


[
	{method: '/addition', validation: (a: number, b: number) => a + b},
	{method: '/subtraction', validation: (a: number, b: number) => a - b},
	{method: '/multiplication', validation: (a: number, b: number) => a * b},
	{method: '/division', validation: (a: number, b: number) => a / b, isDivision: true, isIAMRequired: true},
].forEach(api => {
	describe(api.method, () => {
		const endpoint = api.method;
		const authHeaders =  api.isIAMRequired ? iam_headers : user_bearer_headers;
		test('post - integers', async () => {
			const response = await request(app)
				.post(endpoint)
				.set(authHeaders)
				.send({
					first: 5,
					second: 10
				});
			expect(response.statusCode).toBe(200);
			expect(response.body.result).toBe(api.validation(5, 10));
		});
		test('post - floats', async () => {
			const response = await request(app)
				.post(endpoint)
				.set(authHeaders)
				.send({
					first: 5.2,
					second: 3.1
				});
			expect(response.statusCode).toBe(200);
			expect(response.body.result).toBe(api.validation(5.2, 3.1));
		});
		test('post - zero', async () => {
			const response = await request(app)
				.post(endpoint)
				.set(authHeaders)
				.send({
					first: 0,
					second: 0
				});

			if(api.isDivision) {
				expect(response.statusCode).toBe(500);
				expect(response.body.result).toBeUndefined();
			} else {
				expect(response.statusCode).toBe(200);
				expect(response.body.result).toBe(0);
			}
		});
		test('post - missing property', async () => {
			const response = await request(app)
				.post(endpoint)
				.set(authHeaders)
				.send({
					second: 0
				});
			expect(response.statusCode).toBe(500);
			expect(response.body.result).toBeUndefined();
			expect(response.body.title).toContain('request/body must have required property \'first\'');
		});
		test('post - wrong property', async () => {
			const response = await request(app)
				.post(endpoint)
				.set(authHeaders)
				.send({
					first123: 1,
					second: 0
				});
			expect(response.statusCode).toBe(500);
			expect(response.body.result).toBeUndefined();
			expect(response.body.title).toContain('request/body must have required property \'first\'');
		});
		test('post - no auth fails', async () => {
			const response = await request(app)
				.post(endpoint)
				.send({
					first: 5,
					second: 10
				});
			expect(response.statusCode).toBe(500);
			expect(response.body.result).toBeUndefined();
			expect(response.body.title).toContain('header required');
		});
	});
});

