import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {ApiDefinition, SpecRestApi} from 'aws-cdk-lib/aws-apigateway';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SpecRestApi(this, 'ApiGw', {
      apiDefinition: ApiDefinition.fromAsset(path.join('..', 'openapi.yaml')),
    });

    new NodejsFunction(this, 'Lambda', {
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
