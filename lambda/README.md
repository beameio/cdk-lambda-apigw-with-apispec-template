# Lambda
The code in this folder is an example of an api implementation that can run in AWS Lambda and that automatically validates the incoming request against the OpenAPI spec.

## Running locally
`
npx ts-node src/app.ts
`

then access via browser to 'http://localhost:5001/v1/datetime' to quickly or refer to one of the examples below (PostMan or other tool to make requests can be used)


### API datetime
```bash
$ curl --location 'localhost:5001/datetime'
{"result":"2024-03-06T18:53:22.983Z"}
```

### API addition 
``` bash
$ curl --location 'localhost:5001/addition' --header 'Content-Type: application/json' --data '{
    "first": 4,
    "second": 3
}'
{"result":7}
```

### API subtraction
``` bash
$ curl --location 'localhost:5001/subtraction' --header 'Content-Type: application/json' --data '{
    "first": 3,
    "second": 5
}'
{"result":-2}
```

### API multiplication
``` bash
$ curl --location 'localhost:5001/multiplication' --header 'Content-Type: application/json' --data '{
    "first": 3.1,
    "second": 5
}'
{"result":15.5}
```

### API division
``` bash
$ curl --location 'localhost:5001/division' --header 'Content-Type: application/json' --data '{
    "first": 4,
    "second": 2
}'
{"result":2}
```

### Testing wrong calls

* `division` is protected with iam role as an example, not sending the `x-amz-security-token` will return 500 error, as expected.
```bash
$ curl --location 'localhost:5001/division' --header 'Content-Type: application/json' --data '{
    "first": 4,
    "second": 2
}'
{"title":"'x-amz-security-token' header required","status":500}
```
* sending wrong body
```bash
$ curl --location 'localhost:5001/subtraction' --header 'Content-Type: application/json' --data '{
    "first": 3,
    "third": 5
}'
{"title":"request/body must have required property 'second'","status":500}
```
* sending wrong data type
```bash
$ curl --location 'localhost:5001/subtraction' --header 'Content-Type: application/json' --data '{
    "first": "3",
    "second": 5
}'
{"title":"request/body/first must be number","status":500}
```
