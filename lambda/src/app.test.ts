import initApp from './app';
import initRoutes from './routes';
import request from 'supertest';
import {Application} from 'express';

const userAuthToken = 'eyJraWQiOiJHNXYwYm5jRUFkTnNrcDVocit3SkNsaFhUcjZMQkY5b3A5S1JacGJtYW5zPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiM19nbURPRlBlU3hsNWNqQk1kTXZmdyIsInN1YiI6ImZlZTIwYzVkLTY4OWMtNGQ4OS04MTZjLTc3YjRlNDEzMDU2NiIsImNvZ25pdG86Z3JvdXBzIjpbImV1LWNlbnRyYWwtMV9Fd1lVbzJkamZfR2l0aHViIl0sImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiY3VzdG9tOmFkbWluIjoiZmFsc2UiLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLmV1LWNlbnRyYWwtMS5hbWF6b25hd3MuY29tL2V1LWNlbnRyYWwtMV9Fd1lVbzJkamYiLCJjb2duaXRvOnVzZXJuYW1lIjoiR2l0aHViXzM5ODU1MDQiLCJub25jZSI6IjhUelEzWVc5X3hwNTlaZ3JtSHEwNkxvZ0tnRllMclp1cUFxMnJOc21fdXFfTFg2dUt5ZmphX3FuNlhzNlB2ZVR3RTYwRDNEN0hfbUcwZ2xoV2p1SDEwcU96TGcyMGJDUUVFZ1dNVjhIS2h0RTVnLVZLQ2pXSElzdVNEcVdQV1lWU0xSR2ZrVEprcE9ORzBkcDNURTlmOE0wUVJSX21DUDBFd2RTWGd6Q1VPbyIsImN1c3RvbTpvcmdhbml6YXRpb25zIjoiWzEsMiwzLDRdIiwib3JpZ2luX2p0aSI6IjgwNjA3Y2JiLTcxMjctNGFhMC05NmIwLTBkODhlOTg3NDE0OCIsImF1ZCI6Imt0M2prZmcyMzY3MzlhOXIyOGk2a2dxc3UiLCJpZGVudGl0aWVzIjpbeyJ1c2VySWQiOiIzOTg1NTA0IiwicHJvdmlkZXJOYW1lIjoiR2l0aHViIiwicHJvdmlkZXJUeXBlIjoiT0lEQyIsImlzc3VlciI6bnVsbCwicHJpbWFyeSI6InRydWUiLCJkYXRlQ3JlYXRlZCI6IjE2NTc4OTY5Njk5NTMifV0sInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjY0NTM1Nzg2LCJuYW1lIjoiUmljYXJkbyBHb21lcyIsIm5pY2tuYW1lIjoib3JnYW5vbSIsImV4cCI6MTY2NDUzOTM4NiwiaWF0IjoxNjY0NTM1Nzg2LCJqdGkiOiI1YzdjZWUwMi1lYmU3LTRkYmItODE4Yy0zMDFkYjQwZjU2NGIifQ.Yf5KbDlm5PCXdeUeKOWGT1JsskS8_5nL7MvuegdwyUtfu-Nv2MzgF4LoMqDO7u0IiDxMveusnpsAaMozAxfaVtHwFoM6gFFgvqMIaIMw9MBIq2D2VYpwJapWhUa8QtY3-i_JXPA6vnwT6uW5x3Bg3SoO3bfi9DdNv4RGiywLJgh3-Wo6hyUBcbU77KSAZcNoM6IfRnDeUODLf0e7zYaxHOrlPHhLK4fMZzEbjg5_XsZOGo6HdzB-wB-k9wjeKevIEG0RQMuEq8HTNu6VtFnWLVg1M6GqCQIBltRwPI1c67pJaoJq8IfZDghBUh_bjCbjOJmuR7LM63FQutFwI44vcw';

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

describe('/v1/datetime', () => {
	const endpoint = '/v1/datetime';
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
	{method: '/v1/addition', validation: (a: number, b: number) => a + b},
	{method: '/v1/subtraction', validation: (a: number, b: number) => a - b},
	{method: '/v1/multiplication', validation: (a: number, b: number) => a * b},
	{method: '/v1/division', validation: (a: number, b: number) => a / b, isDivision: true},
].forEach(api => {
	describe(api.method, () => {
		const endpoint = api.method;
		const authHeaders =  api.isDivision ? iam_headers : user_bearer_headers;
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
	});
});

