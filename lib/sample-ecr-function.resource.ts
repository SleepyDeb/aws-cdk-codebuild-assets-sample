import { IConstruct } from "constructs";
import { aws_lambda as lambda, aws_ecr as ecr } from "aws-cdk-lib";

export interface SampleEcrFunctionProps {
    ecrRepository: ecr.IRepository,
    ecrImageReference: string,
    ecrImageReferenceType: 'TAG' | 'DIGEST'
}

export class SampleEcrFunction extends lambda.Function {
    constructor(scope: IConstruct, id: string, props: SampleEcrFunctionProps) {
        SampleEcrFunction.patchRepositoryUriForTagOrDigest(props);
        
        super(scope, id, {
            runtime: lambda.Runtime.FROM_IMAGE,
            code: lambda.Code.fromEcrImage(props.ecrRepository, {
                tagOrDigest: props.ecrImageReference
            }),
            handler: lambda.Handler.FROM_IMAGE
        });
    }

    // Patch for repositoryUriForTagOrDigest function issue
    // Handles the case where digest is an unresolved token
    private static patchRepositoryUriForTagOrDigest(props: SampleEcrFunctionProps) {   
        const isDigest = props.ecrImageReferenceType === 'DIGEST';
        
        if (isDigest) {
            const originalFunction = props.ecrRepository.repositoryUriForTagOrDigest;

            props.ecrRepository.repositoryUriForTagOrDigest = function (tagOrDigest) {
                return tagOrDigest === props.ecrImageReference
                    ? this.repositoryUriForDigest(tagOrDigest)
                    : originalFunction.apply(this, [tagOrDigest]);
            };
        }
    }
}