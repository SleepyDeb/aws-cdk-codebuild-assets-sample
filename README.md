# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## How to deploy
Before you start, ensure that you have docker installed and accessibile, 
on windows it may be required to be administrator to build due to some akwards
limitation on AwsNodejsLambda Bundling process s
> npm ci
> npx cdk synth
> export AWS_REGION=xx-xxxx-x
> export AWS_PROFILE=********
> npx cdk deploy --all
