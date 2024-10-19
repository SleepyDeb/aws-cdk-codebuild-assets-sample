import { Duration, Stack, StackProps, aws_lambda_nodejs as lambdajs, aws_lambda as lambda, aws_iam as iam } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { Statement } from 'cdk-iam-floyd';

export class CodebuildResourceProviderStack extends Stack {
    public readonly resourceProvider: lambda.IFunction;

    constructor(scope: IConstruct, id: string, props: StackProps) {
        super(scope, id, props);

        this.resourceProvider = new lambdajs.NodejsFunction(this, `handler`, {
            timeout: Duration.minutes(6),
            initialPolicy: [
                new Statement.Codebuild()
                    .toStartBuild()
                    .toBatchGetBuilds()
            ]
        })
    }
}