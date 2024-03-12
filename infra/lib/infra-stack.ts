import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';
import {Construct} from 'constructs';
import {ApiDefinition, SpecRestApi} from 'aws-cdk-lib/aws-apigateway';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime} from 'aws-cdk-lib/aws-lambda';

import {AccountRecovery, Mfa, UserPool, VerificationEmailStyle} from 'aws-cdk-lib/aws-cognito';
import {Aws, RemovalPolicy} from 'aws-cdk-lib';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'UserPool', {
      userPoolName: 'UserPool',
      mfa: Mfa.OFF,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      autoVerify: {email: true},
      userVerification: {
        emailSubject: 'You need to verify your email',
        emailBody: 'Thanks for signing up Your verification code is {####}', // # This placeholder is a must if code is selected as preferred verification method
        emailStyle: VerificationEmailStyle.CODE,
      },
      signInAliases: {email: true},
      standardAttributes: {
        email: {required: true, mutable: true},
        givenName: {required: false, mutable: true},
        familyName: {required: false, mutable: true}
      },
      removalPolicy: RemovalPolicy.DESTROY
    })

    const lambda = new NodejsFunction(this, 'LambdaFunction', {
      runtime: Runtime.NODEJS_18_X,
      bundling: {
        commandHooks: {
          beforeBundling(_: string, outputDir: string) {
            return [`cp ../openapi.yaml "${outputDir}"`, `npm install`, `npm run setup`];
          },
          beforeInstall() {return []},
          afterBundling() {return []}
        }
      },
      entry: path.join('..', 'lambda', 'src', 'index.ts'),
      depsLockFilePath: path.join('..', 'lambda', 'package-lock.json'),
      description: 'Lambda function',
      environment: {
        DEBUG: 'beame:*'
      }
    });

    const openApi = fs.readFileSync(path.join('..', 'openapi.yaml'), {encoding: 'utf8'})
        //${LAMBDA_INVOCATION_URI} - arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations
        .replaceAll('${LAMBDA_INVOCATION_URI}', `arn:${Aws.PARTITION}:apigateway:${Aws.REGION}:lambda:path/2015-03-31/functions/${lambda.functionArn}/invocations`)
        .replaceAll('${USERPOOL_ARN}', userPool.userPoolArn);

    console.log(openApi);

    const apiGw = new SpecRestApi(this, 'ApiGw', {
      deployOptions: {
        stageName: 'v1'
      },
      apiDefinition: ApiDefinition.fromInline(yaml.parse(openApi)),
    });
    apiGw.node.addDependency(userPool);
    apiGw.node.addDependency(lambda);
  }
}
