import { Stack, StackProps } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { aws_lambda as lambda, aws_ecr as ecr } from "aws-cdk-lib"; 

export interface SampleLambdaConfig {
    ecrRepositoryName: string,
    ecrTagOrDigest: string
}

export type SampleLambdaProps = SampleLambdaConfig & StackProps;

export class SampleLambdaStack extends Stack {
    constructor(scope: IConstruct, id: string, props: SampleLambdaProps) {
        super(scope, id, props);

        const repositoryName = props.ecrRepositoryName;
        const repository = ecr.Repository.fromRepositoryName(this, `repository`, repositoryName)
        new lambda.Function(this, `handler`, {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromEcrImage(repository, {
                tagOrDigest: props.ecrTagOrDigest
            }),
            handler: lambda.Handler.FROM_IMAGE
        });
    }
} 