import { Stack, StackProps } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { aws_lambda as lambda, aws_ecr as ecr } from "aws-cdk-lib"; 

export interface SampleLambdaConfig {
    ecrRepositoryArn: string,
    ecrTagOrDigest: string
}

export type SampleLambdaProps = SampleLambdaConfig & StackProps;

export class SampleLambda extends Stack {
    constructor(scope: IConstruct, id: string, props: SampleLambdaProps) {
        super(scope, id, props);

        const repositoryArn = props.ecrRepositoryArn;
        const repository = ecr.Repository.fromRepositoryArn(this, `repository`, repositoryArn)
        new lambda.Function(scope, `handler`, {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromEcrImage(repository, {
                tagOrDigest: props.ecrTagOrDigest
            }),
            handler: `bootstrap`
        });
    }
} 