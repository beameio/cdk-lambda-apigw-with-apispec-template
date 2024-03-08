import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {ApiDefinition, SpecRestApi} from 'aws-cdk-lib/aws-apigateway';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {AccountRecovery, Mfa, UserPool, VerificationEmailStyle} from 'aws-cdk-lib/aws-cognito';
import {RemovalPolicy} from 'aws-cdk-lib';

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
    userPool.addClient('app-client', {
      userPoolClientName: 'app-client',
      authFlows: {
        userPassword: true,
      },
    });

    new SpecRestApi(this, 'ApiGw', {
      apiDefinition: ApiDefinition.fromAsset(path.join('..', 'openapi.yaml')),
    });

    new NodejsFunction(this, 'LambdaFunction', {
      functionName: 'LambdaFunction',
      runtime: Runtime.NODEJS_18_X,
      bundling: {
        commandHooks: {
          beforeBundling(_: string, outputDir: string) {
            return [`cp ../openapi.yaml "${outputDir}"`, `npm install`];
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
  }
}
