import { Stack, StackProps } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import { aws_lambda as lambda, aws_ecr as ecr } from "aws-cdk-lib";

export interface SampleLambdaConfig {
    ecrRepository: ecr.IRepository,
    ecrImageReference: string,
    ecrImageReferenceType: 'TAG' | 'DIGEST'
}

export type SampleLambdaProps = SampleLambdaConfig & StackProps;

// public repositoryUriForTagOrDigest(tagOrDigest?: string): string {
//     if (tagOrDigest?.startsWith('sha256:')) {
//       return this.repositoryUriForDigest(tagOrDigest);
//     } else {
//       return this.repositoryUriForTag(tagOrDigest);
//     }
//   }

export class SampleLambdaStack extends Stack {
    constructor(scope: IConstruct, id: string, props: SampleLambdaProps) {
        super(scope, id, props);

        // Patch for repositoryUriForTagOrDigest function issue
        // Handles the case where digest is an unresolved token
        const isDigest = props.ecrImageReferenceType === 'DIGEST';

        if (isDigest) {
            const originalFunction = props.ecrRepository.repositoryUriForTagOrDigest;

            props.ecrRepository.repositoryUriForTagOrDigest = function (tagOrDigest) {
                return tagOrDigest === props.ecrImageReference
                    ? this.repositoryUriForDigest(tagOrDigest)
                    : originalFunction.apply(this, [tagOrDigest]);
            };
        }

        new lambda.Function(this, `handler`, {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromEcrImage(props.ecrRepository, {
                tagOrDigest: props.ecrImageReference
            }),
            handler: lambda.Handler.FROM_IMAGE
        });
    }
}