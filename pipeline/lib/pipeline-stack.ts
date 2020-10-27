import * as cdk from '@aws-cdk/core';
import s3 = require('@aws-cdk/aws-s3');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import codebuild = require('@aws-cdk/aws-codebuild');

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const artifactsBucket = new s3.Bucket(this, "ArtifactsBucket");
    
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket: artifactsBucket
    });

    const sourceOutput = new codepipeline.Artifact();
    // Declare the source code
    const action = new codepipeline_actions.GitHubSourceAction({
      actionName: 'SourceCodeRepo',
      owner: 'cokkike88',
      repo: 'serverless-with-pipeline-aws-sam-aws-cdk',
      branch: 'master',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput          
    });

    // Add source stage to pipeline
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        action
      ]
    });

    // *********************************** BUILD STATGE ********************************

    const buildOutput = new codepipeline.Artifact();

    const buildProject = new codebuild.PipelineProject(this, 'Build', {
      environment: { buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2},
      environmentVariables: {
        'PACKAGE_BUCKET': {
          value: artifactsBucket.bucketName
        }
      }
    });

    // Add the build stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });


  }
}
