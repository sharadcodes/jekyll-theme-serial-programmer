---
layout: post
title: Azure Container Apps As A Dev Environment
date: 2022-09-15
categories: ["DevEx", "Blog", "Azure", "GitHub Actions"]
---

# The Idea
So the idea behind this little project was to have the ability to create instances of an application to be used during code reviews or just to allow developers to share in-progress work.

The basic flow works like this:
- A developer has some changes in a feature branch that they want to merge.
- A pull request is created and the application is built and deployed from the commit tied to the pull request.
- The URL to the application is provided within the PR comments.
- Once the PR has been approved the application is removed from the dev environment.

# Technology in use
To accomplish this I have used the following:
- GitHub and GitHub Actions
- Azure Container Registry
- Azure Container Apps
- Azure Service Principal

# What is the Azure Container Apps service
Azure Container Apps is a service that lets you deploy containerized applications into a managed environment. It is a PaaS offering that allows you to deploy your containerized application without having to worry about the underlying infrastructure.

It lets you use any language or framework to write your application and offers full support for Distributed Application Runtime (Dapr) which is a framework that allows you to write microservices and distributed applications.

With its ability to scale apps to zero and billing by the second it is a great fit for this use case.

Further details about the service can be found here: <a href="https://docs.microsoft.com/en-us/azure/container-apps/">https://docs.microsoft.com/en-us/azure/container-apps/</a>

# Initial setup
So to start with we need a few things to already be set up, an Azure subscription, Azure CLI, a Github account and an application with a dockerfile, I have used the standard Weather Forecast API example from DotNet.'

First, we are going to set up a couple of variables, for this example, I will be using zsh as my shell of choice.

```zsh
resourceGroupName=rg-aca-dev-env
location=australiaeast
acaEnvironmentName=aca-dev-env
```

Next, we want to log into the azure CLI using `az login`

This should bring up a page in your default browser to log you into azure.

From here we create the Resource Group that will hold the Azure Container Apps Environment

```zsh
az group create --name $resourceGroup --location $location
```

Next, we create the Azure Container Registry, this will be where the application's container images are stored after they have been built.

```zsh
az acr create --name <unique-acr-name> --resource-group $resourceGroupName --sku Basic
```

Before we get started with creating the Azure Container Apps elements we need to ensure that the proper extensions are installed for the Azure CLI

```zsh
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

Now we can create the Azure Container Apps Environment

```zsh
az containerapp env create --name $acaEnvironmentName --resource-group $resouceGroupName --location $location
```

The next step is to set up the Azure Service Principal, this is used as the credentials for GitHub Actions to access both the Azure Container Registry as well as the Azure Container Apps Environment. 

The details on this are provided here:

<a href="https://docs.microsoft.com/en-us/azure/developer/github/connect-from-azure">https://docs.microsoft.com/en-us/azure/developer/github/connect-from-azure</a>

# Creating the Pipelines and Initial Deployment

Now that this is all set up I recommend creating a basic GitHub action pipeline to do the initial container app deployment. The reason for this is that container apps only run containers based on Linux x64 (linux/amd64). So the easiest way to ensure your image is all good is to define the GitHub action runner to use ubuntu-latest as its container image.

All of the deployment pipelines are created using GitHub actions.

The first pipeline is to create the initial deployment of the application. 

It has two parts, the first builds and pushes the container image to the Azure Container Registry and the second deploys the container image to the Azure Container Apps Environment.

```yaml
{% raw %}
name: Initial Deployment

# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

on:
  workflow_dispatch:
    branches: [ "main" ]

env:
  IMAGE_NAME: weatherapi
  IMAGE_TAG: ${{ github.run_number }}
  ACA_RG: rg-aca-dev-env
  AZ_LOCATION: australiaeast

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: 'Login via Azure CLI'
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
        
      - name: 'Build and Push image'
        uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.REGISTRY_LOGIN_SERVER }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      - run: |
          docker build . -t ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}
          docker push ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}
  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: read
      packages: write
      # This is used to complete the identity challenge
      # with sigstore/fulcio when running outside of PRs.
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Container Apps Environment
        id: aca-deploy
        uses: azure/CLI@v1
        with:
          azcliversion: 2.40.0
          inlinescript: |
            az extension add --name containerapp --upgrade
            az provider register --namespace Microsoft.App
            az provider register --namespace Microsoft.OperationalInsights
            az containerapp create --name ${{ env.IMAGE_NAME }} --resource-group ${{ env.ACA_RG }} --image ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }} 
{% endraw %}
            
```

Once this pipeline has been added to the repository you can access it via the Actions tab on GitHub.

Pipelines should be created in the .github/workflows folder at the root of the repository.

Running the pipeline should create the Container App inside the Container App Environment.

# Creating the Pull Request Pipeline

The next step is to create the Pull Request Deployment pipeline, this will look very similar to the initial deployment pipeline. The key differences here are in the workflow trigger, the IMAGE_TAG variable and the final deploy steps where the Container App is updated instead of created and the application URL is added to the pull request comments.

```yml
{% raw %}
name: Pull Request Deployment

# This workflow uses actions that are not certified by GitHub.
# They are provided by a third-party and are governed by
# separate terms of service, privacy policy, and support
# documentation.

on:
  pull_request:
    branches: [ "main" ]
    types: ["opened", "edited","reopened", "synchronize"]

env:
  IMAGE_NAME: weatherapi
  IMAGE_TAG: pr-${{ github.event.number }}
  ACA_RG: rg-aca-dev-env
  AZ_LOCATION: australiaeast

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: 'Login via Azure CLI'
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
        
      - name: 'Build and Push image'
        uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.REGISTRY_LOGIN_SERVER }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      - run: |
          docker build . -t ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}
          docker push ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }}
  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      contents: read
      packages: write
      pull-requests: write
      # This is used to complete the identity challenge
      # with sigstore/fulcio when running outside of PRs.
      id-token: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Container Apps Environment
        id: aca-deploy
        uses: azure/CLI@v1
        with:
          azcliversion: 2.40.0
          inlinescript: |
            az extension add --name containerapp --upgrade
            az provider register --namespace Microsoft.App
            az provider register --namespace Microsoft.OperationalInsights
            az containerapp update --name ${{ env.IMAGE_NAME }} --resource-group ${{ env.ACA_RG }} --image ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }} --revision-suffix ${{ env.IMAGE_TAG }}
            url=$(az containerapp revision show -n ${{ env.IMAGE_NAME }} -g ${{ env.ACA_RG }} --revision ${{ env.IMAGE_NAME }}--${{ env.IMAGE_TAG}} --query "properties.fqdn" -o tsv)
            echo "testurl=$url" >> $GITHUB_ENV
      - name: Add Url to PR
        id: add-pr-comment
        uses: peter-evans/create-or-update-comment@v2
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            Url for this PR is: https://${{ env.testurl }}
{% endraw %}
```

With the workflow triggering on pull_request with types: ["opened", "edited", "reopened", "synchronize"] this ensures that this pipeline only triggers when pull requests are created or modified. This will now allow a developer to create a pull request and trigger the deployment.

Using `az container update` will create a revision of the application. This revision will have a different URL and does not have traffic automatically routed to it.

After the update, there is a call to `az containerapp revision show` this allows us to get the URL for the new revision and output that to the last step.

The last step here updates the pull request with a comment that shows the URL to this version of the application running inside the environment.

If the developer pushes a change to this pull request the pipeline will trigger again and update the container running inside the revision.

# Cleaning up the environment

Once the pull request has been merged into the main branch the environment will no longer be needed. To clean up the environment we can create a new workflow that will run when the pull request is closed.

```yml
{% raw %}
name: Cleanup

on:
  pull_request:
    branches: ["main"]
    types: ["closed"]

env:
  IMAGE_NAME: weatherapi
  IMAGE_TAG: pr-${{ github.event.number }}
  ACA_RG: rg-aca-dev-env
  AZ_LOCATION: australiaeast

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: 'Login via Azure CLI'
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Deactivate App revision
        uses: azure/CLI@v1
        with:
          azcliversion: 2.40.0
          inlinescript: |
            az extension add --name containerapp --upgrade
            az provider register --namespace Microsoft.App
            az provider register --namespace Microsoft.OperationalInsights
            az containerapp revision deactivate -g ${{ env.ACA_RG }} --revision ${{ env.IMAGE_NAME }}--${{ env.IMAGE_TAG }}      
{% endraw %}

```

This workflow will run when the pull request is closed and will deactivate the revision that was created for the pull request.

# Conclusion

We have looked at how to use Azure Container Apps to create a development environment for a pull request. 

This allows developers to create a pull request, have the application deployed into a test environment and then have the environment cleaned up once the pull request is merged.

In doing this we allow for a better experience for developers and code reviewers to see changes that are in progress and allow for a more efficient review process.

This process is not without its drawbacks, the Azure Container Apps revisions are not deleted but instead just made inactive once finished. This can lead to a large number of revisions being created and stored in the environment. This can be mitigated by deleting the container app and recreating it using the latest production version of the application.

Other considerations are the networking and configuration to allow for integration testing. This could be done using environment variables to specify the URLs of the dependent services but would depend on the design of the system.

# Future Improvements
A few improvements that could be made to this project:
- Change initial deployment into Terraform
- Develop a multi-container example showing integration testing options

# Repository for this project
All code for this example can be found on GitHub: 
<a href="https://github.com/dylan-mccarthy/Azure-Container-Apps-Dev-Env-Demo">https://github.com/dylan-mccarthy/Azure-Container-Apps-Dev-Env-Demo</a>