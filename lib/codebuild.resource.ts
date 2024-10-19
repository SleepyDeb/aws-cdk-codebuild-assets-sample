import { CustomResource } from "aws-cdk-lib";
import { IConstruct } from "constructs";

export interface CodebuildResourceProps {
    serviceToken: string,
    projectName: string,
    resultJsonPath: string
}

export class CodebuildResource extends CustomResource {
    public readonly result: string;

    constructor(scope: IConstruct, id: string, props: CodebuildResourceProps) {
        super(scope, id, {
            serviceToken: props.serviceToken,
            resourceType: `Custom::Codebuild-Asset`,
            properties: {
                codebuildProjectName: props.projectName,
                resultJsonPath: props.resultJsonPath
            }
        });
        this.result = this.getAttString('result');
    }
}