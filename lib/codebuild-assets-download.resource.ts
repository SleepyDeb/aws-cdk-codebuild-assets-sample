import { aws_codebuild as codebuild, StackProps, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodebuildResource } from './codebuild.resource';

export interface CodebuildAssetsDownloadConfig {
    serviceToken?: string,
    bucket: s3.IBucket,
    path: string,
    assets: {
        [name: string]: {
            url: string
        }
    }
}

export type CodebuildAssetsDownloadProps = CodebuildAssetsDownloadConfig & StackProps;

export class CodebuildAssetsDownload extends Construct {
    public readonly assetsS3Url = {} as {
        [name: string]: string
    }

    constructor(scope: Construct, id: string, props: CodebuildAssetsDownloadProps) {
        super(scope, id);

        const environmentVariables = {
            S3_BUCKET: {
                value: props.bucket.s3UrlForObject(`${props.path}`),
                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
            }
        } as {
            [varName: string]: codebuild.BuildEnvironmentVariable
        };

        const exportedVariables = [] as string[];
        const resultJsonPaths = [] as string[];

        const commands = [
            "mkdir -p ./download/ &&  cd ./download/"
         ] as string[];

        for (const [assetName, assetValue] of Object.entries(props.assets)) {
            const upperName = assetName.toUpperCase().replaceAll('-', '_');

            const urlVariable = `${upperName}_DOWNLOAD_URL`;
            const locationVariable = `${upperName}_S3_LOCATION`;
            
            environmentVariables[urlVariable] = {
                value: assetValue.url,
                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT
            }

            exportedVariables.push(locationVariable);
            resultJsonPaths.push(`$.exportedEnvironmentVariables[?(@.name=='${locationVariable}')].value`)

            commands.push(`export ${locationVariable}=$\{S3_BUCKET\}$(basename $${urlVariable})`);
            commands.push(`wget $${urlVariable}`);
            commands.push(`aws s3 cp ./$(basename $${urlVariable}) $${locationVariable}`);
        }

        const project = new codebuild.Project(this, `downloader`, {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                environmentVariables
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: 0.2,
                env: {
                    shell: 'bash',
                    'exported-variables': exportedVariables
                },
                phases: {
                    build: {
                        commands,                    
                        'on-failure': 'ABORT'
                    }
                }
            })
        });
        props.bucket.grantWrite(project);

        const resource = new CodebuildResource(this, `resource`, {
            projectName: project.projectName,
            serviceToken: props.serviceToken,
            resultJsonPaths
        });

        for (const [index, assetName] of Object.keys(props.assets)) {
            this.assetsS3Url[assetName] = resource.results[Number.parseInt(index)]
        }
    }
}
