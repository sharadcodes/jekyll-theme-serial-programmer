---
layout: post
title: GitHub Actions 101
date: 2022-10-13
categories: ["GitHub Actions", "CI/CD", "DevOps"]
---

# GitHub Actions 101

GitHub Actions is the CI/CD tool that is built into GitHub.

They allow you to create workflows that can be triggered by events inside your repository such as a push to a branch or a pull request.

As well as defining workflows you can also create actions that can be used within your workflows or shared with the community.

In this post, I will go over the basics of GitHub Actions, how to create a workflow, how to create an action and how to create a reusable workflow.

## Workflows

Workflows are defined in a YAML file located in the `.github/workflows` directory of your repository.
You can have multiple workflows in this directory with each workflow needing a distinct name.

The following is a basic workflow that will run on every push to the repository.

```yaml
name: My Workflow

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: echo "Hello World"
```

To break down the sections of the file the first part is the name of the workflow. This is used to identify the workflow in the GitHub UI.

The next section is the `on` section, this is where you define the events that will trigger the workflow. In this case, we are using the `push` event which will trigger the workflow on every push to the repository.

Many other events can be used to trigger a workflow, you can find a list of them [here](https://docs.github.com/en/actions/reference/events-that-trigger-workflows).

The next section is the `jobs` section, this is where you define the jobs that will be run as part of the workflow. In this case, we are only running one job called `build`.

The `build` job is running on the latest version of Ubuntu, this is defined in the `runs-on` section.

The last section is the `steps` section, this is where you define the steps that will be run as part of the job. In this case, we are using the `actions/checkout@v2` action to checkout the code from the repository and then running the `echo "Hello World"` command.

## Actions

Actions are the building blocks of workflows, they are the smallest unit of work that can be run in a workflow.

Actions can be created by anyone and can be shared with the community.

There are three types of actions:

- JavaScript Actions
- Docker Actions
- Composite Actions

JavaScript and Docker actions allow you to write code that can be run in a workflow, composite actions allow you to combine multiple actions into a single action.

### JavaScript Actions

JavaScript Actions are written in JavaScript and can be written in either Node.js or TypeScript.

To see an example of a JavaScript action you can check out the GitHub docs here: [https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)

### Docker Actions

Docker Actions use a Docker container to run the code in the action. The advantage of using a Docker container is that you can use any language that can be run in a Docker container.

To see an example of a Docker action you can check out the GitHub docs here: [https://docs.github.com/en/actions/creating-actions/creating-a-docker-container-action](https://docs.github.com/en/actions/creating-actions/creating-a-docker-container-action)

### Composite Actions

Composite actions allow you to combine multiple actions into a single action. This can be useful if you have a set of actions that you want to run together.

To see an example of a composite action you can check out the GitHub docs here: [https://docs.github.com/en/actions/creating-actions/creating-a-composite-action](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)

## Reusable Workflows

Reusable workflows allow you to create a workflow that can be used in multiple repositories.

The main use of reusable workflows is to create common workflows that can be called from other repositories. This can be useful if you have a common deployment method that you want to make available to other teams.

Reusable workflows are created much like normal workflows using yaml files.

To create a reusable workflow you need to create a yml file within the `.github/workflows` directory of your repository, the same as a normal workflow.

Then when you are defining the workflow you need to use the workflow_call keyword in the `on` section.

```yaml
name: My Reusable Workflow

on:
  workflow_call:

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
        - uses: actions/checkout@v2
        - run: echo "Hello World"
```

To call a reusable workflow from the same repository you can use the `uses` keyword in a workflow.

```yaml
name: My Workflow

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/workflows/my-reusable-workflow.yml
```

To call a reusable workflow from a different repository you can use the `uses` keyword in a workflow but this time you need to specify the repository and a reference, this can be a branch, tag or commit.

```yaml
name: My Workflow

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: my-org/my-reusable-workflow@main
```

## Conclusion

In this post, I went over the basics of GitHub Actions, how to create a workflow, how to create an action and how to create a reusable workflow. 

They are a powerful automation tool and with community actions, you can do almost anything you can think of.
Hopefully, you have found this post helpful and in the future, I plan to go a bit deeper into the creation of actions and different ways to set up CI/CD pipelines.
