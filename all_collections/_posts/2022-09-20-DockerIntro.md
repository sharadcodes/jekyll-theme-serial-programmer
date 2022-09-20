---
layout: post
title: Docker and Docker Compose Introduction
date: 2022-09-20
categories: ["Docker", "Docker-compose", "Containers"]
---

# Introduction to Docker and Docker Compose
In last week's blog post I went pretty deep into a technical demo showing how to set up an ephemeral development environment using Azure Container Apps. A core part of this was using Docker to define the images for the containers that would be used to run the application. In this post I want to go over the basics of Docker and Docker Compose, and how they can be used to create and run containers.

## Pre-requisites

To follow along with this post you will need to have Docker installed on your machine. You can download Docker from [here](https://www.docker.com/products/docker-desktop).

## GitHub Repo
All examples in this post are available on GitHub [here](https://github.com/dylan-mccarthy/docker-demo-application)

## What are Containers?

A container is a runnable image that contains all the dependencies and configurations needed to run an application. The container image is a read-only template that describes the instructions for setting up the container environment and is run using a container runtime. 

The container runtime is responsible for creating the container from the image and running the application inside it. The container runtime is also responsible for managing the lifecycle of the container, including starting, stopping, and restarting the container.

In this instance the container runtime we are using is Docker.

## What is Docker?
Docker is a containerization platform that allows you to package your application and all of its dependencies. 

It consists of a client and a daemon that run on the local machine. The client application is used to interact with the daemon, and the daemon is responsible for building, running, and distributing your containers.

Docker has been around since 2013 and has become the de facto standard for containerization. It is a great tool for developers because it allows you to build and test your application in a standardized environment. 

To build a docker image you need to create a Dockerfile. A Dockerfile is a text file that contains all of the commands that you would normally execute on the command line to build your application. The Dockerfile is then used by the Docker daemon to build your application.

Later in this post, I will show examples of a Dockerfile and how to use it to build a docker image.

Aside from building your containers, Docker can also be used to run containers that have already been built by other people. These container images are stored in a container registry. 

DockerHub is the most popular container registry and is where most people store their container images. Images can also be stored within private container registries on cloud services like AWS, Azure, and Google Cloud.

To run a Docker image you need to use the `docker run` command. The `docker run` command will pull the image from the container registry and run it in a container. The `docker run` command can also be used to run a container that you have already built locally.

An example of this is:
```bash
docker run hello-world
```
This command will pull the `hello-world` image from DockerHub and run it in a container. The `hello-world` image is a simple image that prints a message to the console. This is a good image to use to test that Docker is working correctly on your machine.

## What is Docker-Compose?
Docker Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application’s services. Then, with a single command, you create and start all the services from your configuration.

Docker-compose files consist of three main sections: services, networks, and volumes. 

The service section is where the application images are defined, these can either be local images that are built using a Dockerfile, or they can be images that are pulled from a container registry.

The networks section is where you define the networks that you want to use. These networks can be used for inter-container communication.

The volumes section is where you define the volumes that you want to use. These volumes can be used to persist data between container restarts.

For simplicity of this post, I will only be using the service section of the docker-compose file.

You can also provide an override file to override the default configuration. The override file is a YAML file that contains the same sections as the main docker-compose file. The override file is used to override the default configuration and can be used to specify different configuration options for different environments.


## Dockerfile

The following is an example of a Dockerfile.

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Application.csproj", "/src"]
RUN dotnet restore "Application.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "Application.csproj" -c Release -o /app/build

FROM build as publish
RUN dotnet publish "Application.csproj" -c Release -o /app/publish

FROM base as final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT [ "dotnet", "Application.dll" ]
```

The first section of this file defines a base image, a working directory, and the ports that the application will use.
Specifically, in this example, the base image is the ASP.NET 6.0 runtime image used for running ASP.NET applications. The working directory is set to /app and the application will use ports 80 and 443 for use with HTTP and HTTPS.

The second section now defines the build image, the image is tagged as build and is based on the .NET 6.0 SDK image. The working directory is set to /src and the application project file is copied into the container. Once copied in the `dotnet restore` command is run to download all the dependencies.

Once the dependencies have been downloaded the rest of the application is copied into the container and the `dotnet build` command is run to build the application. The output of the build is then copied to the /app/build directory.

The next section defines the publish image. This image is based on the build image and the `dotnet publish` command is run to publish the application. The output of the publish command is then copied to the /app/publish directory.

The final section copies the published application from the publish image to the base image and sets the entry point for the application which will run when the container is started.

To run this Dockerfile you would run the following command:

```bash
docker build -t application .
```

This command will build the docker image and tag it as `application`. The `.` at the end of the command tells docker to use the current directory as the build context.

To run the application you would then run the following command:

```bash
docker run -d -p 8080:80 application
```

This command will run the application in a container and map port 80 on the container to port 8080 on the host machine. The `-d` flag tells docker to run the container in detached mode.

You can now access the application by navigating to `http://localhost:8080` in your browser.

To see what containers are currently running you can run the following command:

```bash
docker ps
```

This command will display any currently running containers and their status.

To stop the container you can run the following command:

```bash
docker stop <container-id>
```

The container id can be found by running the previous command.

## Docker-Compose Example

The following is an example of a docker-compose file.

docker.compose.yml
```yaml
version: "3.9"
services:
  application:
    image: application
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
      - "4430:443"
    depends_on:
      - database
  database:
    image: mcr.microsoft.com/azure-sql-edge
```

This file defines two services, an application service and a database service. The application service is based on the application image that we built in the previous section. The application service will use port 8080 on the host machine and will depend on the database service.

The database service is based on the Azure SQL Edge image. This image is a SQL Server database that is optimized for running on edge devices. This image is available on DockerHub and can be found [here](https://hub.docker.com/_/microsoft-azure-sql-edge).

To configure the database as well as environmental variables you can use an override file. The following is an example of an override file.

docker.compose.override.yml
```yaml
version: "3.9"
services:
  application:
    environment:
      - "ASPNETCORE_ENVIRONMENT=Development"
      - "ASPNETCORE_URLS=http://+:80"
  database:
    environment:
      - "ACCEPT_EULA=Y"
      - "SA_PASSWORD=Password123!"
```

In this override file, we are setting the ASP.NET environment to development and the URL that the application will listen on. We are also setting the SQL Server password to `Password123!`.

To run the application you can run the following command:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

To stop the application you can run the following command:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml down
```

One of the advantages of using docker-compose to run multi-container applications is that you can use the same docker-compose file to run the applications in different environments. Using override files for the different environments to control the configuration settings.

Containers run with docker-compose also share an internal network which allows for easy configuration of the services. For example, the application service can access the database service by using the name `database` as the connection string.

## Conclusion

In this post, we looked at Docker and Docker-compose and how to use them to build containers and run multi-container applications.

We have defined both the Dockerfile as well as docker-compose and docker-compose.override files to build and run the application.

Hopefully, this has given a good overview of the basics, in the future I will explore how this setup can be used to provide a full local development environment that can be used to develop and test applications.
