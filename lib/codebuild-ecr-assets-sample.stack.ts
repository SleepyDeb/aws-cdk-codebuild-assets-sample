import { aws_codebuild as codebuild, aws_s3 as s3, Stack, StackProps, aws_ecr as ecr } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodebuildResource } from './codebuild.resource';

export interface CodebuildAssetsSampleConfig {
  serviceToken: string
}

export type CodebuildAssetsSampleProps = CodebuildAssetsSampleConfig & StackProps;

export class CodebuildAssetsSampleStack extends Stack {
  public readonly ecrImageUri: string;

  constructor(scope: Construct, id: string, props: CodebuildAssetsSampleProps) {
    super(scope, id, props);

    const ecrRepository = new ecr.Repository(this, `repository`, {})
    const project = new codebuild.Project(this, `builder`, {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: ecrRepository.repositoryUri
          }
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        env: {
          shell: 'bash',
          'exported-variables': [
            "FULL_IMAGE_URI"
          ]
        },
        phases: {
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"
            ],
            'on-failure': 'ABORT'
          },
          build: {
            commands: [
              "docker build . -t local"
            ],
            'on-failure': 'ABORT'
          },
          post_build: {
            commands: [
              "export FULL_IMAGE_URI=$ECR_REPOSITORY_URI:latest",
              "docker tag local $FULL_IMAGE_URI",
              "docker push $FULL_IMAGE_URI"
            ],
            'on-failure': 'ABORT'
          }
        },
        source: codebuild.Source.gitHub({
          owner: `SleepyDeb`,
          repo: `aws-lambda-custom-container`
        })
      })
    });
    ecrRepository.grantPush(project);

    const resource = new CodebuildResource(this, `resource`, {
      serviceToken: props.serviceToken,
      projectName: project.projectName,
      resultJsonPath: '$.exportedEnvironmentVariables.FULL_IMAGE_URI'
    });
    this.ecrImageUri = resource.result;
  }
}

