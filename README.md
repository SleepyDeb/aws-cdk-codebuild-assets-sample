# Codebuild ECR Image from Source

This project demonstrates a CDK stack that builds Docker images from source code using AWS CodeBuild and pushes them to an Amazon Elastic Container Registry (ECR) repository. 

## Overview

This resource consists of the following key components:

1. **ECR Repository**: An Amazon Elastic Container Registry (ECR) repository that stores the Docker images.
2. **CodeBuild Project**: A CodeBuild project that builds the Docker image from the source code and pushes it to the ECR repository.
3. **Custom Resources**: Custom resources to trigger the build process and retrieve the image details.

## Architecture

### CodebuildSampleStack

This stack demonstrates the usage of the CodebuildEcrImageFromSource and SampleEcrFunction classes to build and deploy a Docker image to an AWS Lambda function.

## Usage

### Prerequisites

- AWS Account
- NodeJS >= 18.0
- Docker

### CodebuildEcrImageFromSource

This stack sets up the ECR repository and CodeBuild project. It uses custom resources to execute the build process and obtain the image details (digest and tag).

#### Parameters

- **buildCommands**: Custom build commands to run during the build phase.
- **imageTagCommand**: Command to generate the image tag.
- **buildTimeImageTag**: Tag for the build-time image.
- **source**: The source of the CodeBuild project.
- **serviceToken**: Optional service token for custom resources.
- **ecrRepository**: Optional existing ECR repository.

### CodebuildResourceProvider

This class sets up the AWS Lambda function used as a custom resource provider for the CodeBuild project. 

#### Parameters

- **functionName**: Optional name for the Lambda function.
- **role**: Optional IAM role for the Lambda function.
- **timeout**: Optional timeout duration for the Lambda function.

### How to Deploy

Before you start, make sure you have Docker installed and accessible. On Windows using Rancher Desktop in moby compatibility, you might need administrator privileges to build due to some limitations in the AwsNodejsLambda bundling process.

1. **Install dependencies:**
    ```bash
    npm ci
    ```

2. **Set the AWS region and profile:**
    ```bash
    export AWS_REGION=xx-xxxx-x
    export AWS_PROFILE=your_profile_name
    ```

3. **Deploy the stack:**
    ```bash
    npx cdk deploy
    ```

## Contributions

Contributions are welcome! Please submit pull requests to the `main` branch.

## Contact

For any inquiries or support, please open an issue on GitHub.
