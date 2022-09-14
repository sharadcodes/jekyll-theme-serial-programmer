---
layout: post
title: Azure Container Apps As A Dev Environment
date: 2022-09-13
categories: ["DevEx", "Blog", "Azure", "Github Actions"]
---

# The Idea
So the idea behind this little project was to have the ability to create instances of an application to be used during code reviews or just to allow developers to share in progress work.

The basic flow works like this:

- Developer has some changes in a feature branch that they want to merge.
- A pull request is created and the application is build and deployed from the commit tied to the pull request.
- The url to the application is provided within the PR comments.
- Once the PR has been approved the application is removed from the dev environment.

# Technology in use
To accomplish this I have used the following:

- Github and Github Actions
- Azure Container Registry
- Azure Container Apps
- Azure Service Principal

# What is Azure Container Apps
TODO - Describe Azure Container Apps

# Initial setup
So to start with we need a few things to already be set up, a Azure subscription, Azure CLI, a Github account and an application with a dockerfile, I have used the standard Weather Forecast api example from dotnet.

First we are going to set up a couple of variables, for this example I will be using zsh as my shell of choice.

```zsh
resourceGroupName=rg-aca-dev-env
location=australiaeast
acaEnvironmentName=aca-dev-env
```

Next we want to log into the azure cli using `az login`

This should bring up a page in your default browser to log you into azure.

From here we create the Resource Group that will hold the Azure Container Apps Environment

```zsh
az group create --name $resourceGroup --location $location
```

Next we create the Azure Container Registry, this will be where the application's container images are stored after they have been built.

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

Next step is to set up the Azure Service Principal, this is used as the credentials for Github Actions to access both the Azure Container Registry as well as the Azure Container Apps Environment. 

The details on this are provided here:

<a href="https://docs.microsoft.com/en-us/azure/developer/github/connect-from-azure">https://docs.microsoft.com/en-us/azure/developer/github/connect-from-azure</a>

# Creating the Pipelines and Initial Deployment

Now that this is all set up I recommend creating a basic github action pipeline to do the initial container app deployment. The reason for this is that container apps only run containers based on Linux x64 (linux/amd64). So the easiest way to ensure your image is all good is to define the github action runner to use ubuntu-latest as its container image.

Feel free to check out the example application here: <a href="https://github.com/dylan-mccarthy/Azure-Container-Apps-Dev-Env-Demo">Azure-Container-Apps-Dev-Env-Demo</a>

So to start create the following file named prod-inital-deployment.yml in the .github/workflows folder in the base of your repository.

```yaml
{% raw %}name: Prod Initial Deployment

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
            az containerapp create --name ${{ env.IMAGE_NAME }} --resource-group ${{ env.ACA_RG }} --image ${{ secrets.REGISTRY_LOGIN_SERVER }}/${{ env.IMAGE_NAME }}:${{ env.IMAGE_TAG }} {% endraw %}
            
```

Once this pipeline has been added to the repository you can access it via the Actions tab in github.

Running the pipeline should create the Container App inside the Container App Environment.

Next step is to create the Pull Request Dev Delopment pipeline, this will look very similar to the initial deployment pipeline. The key differences here are in the workflow trigger, the IMAGE_TAG variable and the final deploy steps where the Container App is updated instead of created and the application URL is added into the pull request comments.

```yml
{% raw %}name: Pull Request Dev Deployment

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
            Url for this PR is: https://${{ env.testurl }}{% endraw %}
```

With the workflow triggering on pull_request with types: ["opened", "edited","reopened", "synchronize"] this ensures that this pipeline only triggers when pull requests are created or modified. This will now allow a developer to create a pull request and trigger the deployment.

Using `az container update` will create a revision of the application. This revision will have a different URL and does not have traffic automatically routed to it.

After the update there is a call to `az containerapp revision show` this allows us to get the URL for the new revision and output that to the last step.

The last step here updates the pull request with a comment that shows the URL to this version of the application running inside of the environment.

If the developer pushes a change to this pull request the pipeline will trigger again and udpate the container running inside the revision.

TODO - Complete the last steps about the cleanup step.