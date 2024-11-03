import { aws_codebuild as codebuild, StackProps, aws_ecr as ecr, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodebuildResource } from './codebuild.resource';

export interface CodebuildEcrImageFromSourceConfig {
  buildCommands?: string[],
  imageTagCommand?: string,
  buildTimeImageTag?: string,
  source: codebuild.ISource,
  serviceToken?: string,
  ecrRepository?: ecr.IRepository
}

export type CodebuildEcrImageFromSourceProps = CodebuildEcrImageFromSourceConfig & StackProps;

export class CodebuildEcrImageFromSource extends Construct {
  public readonly ecrRepository: ecr.IRepository;
  public readonly ecrDigest: string;
  public readonly ecrTag: string;

  constructor(scope: Construct, id: string, props: CodebuildEcrImageFromSourceProps) {
    super(scope, id);

    const ecrRepository = this.ecrRepository = props.ecrRepository ?? new ecr.Repository(this, `repository`, {
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true
    });
    
    const imageTagBash = props.imageTagCommand ? `$(${props.imageTagCommand})` : 'latest';
    const project = new codebuild.Project(this, `builder`, {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: ecrRepository.repositoryUri
          },
          BUILD_IMAGE_TAG: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: props.buildTimeImageTag ?? `local`
          }
        }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        env: {
          shell: 'bash',
          'exported-variables': [
            "FULL_IMAGE_URI",
            "IMAGE_DIGEST",
            "IMAGE_TAG"
          ]
        },
        phases: {
          pre_build: {
            commands: [
              "echo Logging in to Amazon ECR...",
              "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI"
            ],
            'on-failure': 'ABORT'
          },
          build: {
            commands: props.buildCommands ?? [
              "docker build . -t $BUILD_IMAGE_TAG"
            ],
            'on-failure': 'ABORT'
          },
          post_build: {
            commands: [
              `export IMAGE_TAG=${imageTagBash}`,
              "export FULL_IMAGE_URI=$ECR_REPOSITORY_URI:$IMAGE_TAG",
              "docker tag $BUILD_IMAGE_TAG $FULL_IMAGE_URI",
              `TEMP_FILE=$(mktemp)`,
              `docker push $FULL_IMAGE_URI | tee "$TEMP_FILE"`,
              `export IMAGE_DIGEST=$(grep -oP 'digest: \\K[^ ]*' "$TEMP_FILE")`
            ],
            'on-failure': 'ABORT'
          }
        }
      }),
      source: props.source
    });
    ecrRepository.grantPush(project);

    const resource = new CodebuildResource(this, `resource`, {
      projectName: project.projectName,
      serviceToken: props.serviceToken,
      resultJsonPaths: [
        "$.exportedEnvironmentVariables[?(@.name=='IMAGE_DIGEST')].value",
        "$.exportedEnvironmentVariables[?(@.name=='IMAGE_TAG')].value"
      ]
    });

    this.ecrRepository = ecrRepository;
    this.ecrDigest = resource.results[0];
    this.ecrTag = resource.results[1];
  }
}

