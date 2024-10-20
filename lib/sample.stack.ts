import { Stack, StackProps, aws_codebuild as codebuild } from "aws-cdk-lib";
import { CodebuildEcrImageFromSource } from "./codebuild-ecr-image-from-source.resource";
import { IConstruct } from "constructs";
import { SampleEcrFunction } from "./sample-ecr-function.resource";

export class SampleStack extends Stack {
    constructor(scope: IConstruct, id: string, props?: StackProps) {
        super(scope, id, props);

        const { ecrRepository, ecrDigest } = new CodebuildEcrImageFromSource(this, `codebuild-assets`, {
            source: codebuild.Source.gitHub({
                owner: `SleepyDeb`,
                repo: `aws-lambda-custom-container`,
                branchOrRef: `main`
            })
        });
        
        new SampleEcrFunction(this, `codebuild-assets-sample-lambda`, {
            ecrRepository,
            ecrImageReference: ecrDigest,
            ecrImageReferenceType: 'DIGEST'
        });
    }
}