---
layout: post
title: Branching Strategies
date: 2022-09-26
categories: ["DevEx", "Source Control", "Git"]
---
# Branching Strategies

## Introduction

Source control is a key part of modern development, it allows us to keep our code in a central location and improves the ability of teams to collaborate.

The main technology used for source control today is Git.

Git is a distributed version control system, which means that every developer has a full copy of the repository on their local machine. This allows developers to work offline and work on multiple features at the same time.

A key feature of Git is braches. A branch is a copy of the code at a specific point in time. This allows developers to work on a feature without affecting the main code base. When the feature is complete, the branch can be merged back into the main code base.

## Branching Strategies
Many different branching strategies can be used. The most common are Git Flow, GitHub Flow and Trunk-Based Development.

### Git Flow

Git Flow was created by Vincent Driessen in 2010. It is a branching strategy that is designed to be used with a release cycle. It is based on the idea that there are two main branches, the main branch and the develop branch. The main branch contains the code that is currently in production. The develop branch contains the code that is currently being worked on.

![Git Flow](/assets/images/branching-strategies/gitflow-img.png)
<sub>Image source: https://nvie.com/posts/a-successful-git-branching-model/</sub>

Developers create feature branches from the develop branch. When the feature is complete, the feature branch is merged back into the develop branch. 

Release branches are created from the develop branch when a release is ready to be created. The release branch is used to fix any bugs that are found during testing. When the release is ready, the release branch is merged into the main branch and the develop branch.

Hotfix branches are created from the main branch when a bug is found in production. The hotfix branch is used to fix the bug. When the bug is fixed, the hotfix branch is merged into the main branch and the develop branch.

When releases are ready tags are created on the main branch to mark the state of the code at the point in time that a release was created.

### GitHub Flow

GitHub flow is similar to Git flow, it differs by not having a develop branch. Instead, the main branch is used for development. When a release is ready, a tag is created on the main branch to mark the state of the code at the point in time that a release was created.

![GitHub Flow](/assets/images/branching-strategies/githubflow-img.png)

Developers create feature branches from the main branch. When the feature is complete, the feature branch is merged back into the main branch. 

To merge a change into the main branch a pull request is used, this allows for the review of the code before it is merged into the main branch.

When releases are ready tags are created on the main branch to mark the state of the code at the point in time that a release was created.ß

### Trunk-Based Development

Trunk-Based Development is similar to GitHub flow in that it has a single long-running branch. This branch is referred to as the trunk.

![Trunk-Based Development](/assets/images/branching-strategies/tbd-img.png)

Changes are pushed directly to the trunk. The goal is to always keep the trunk in a releasable state. To achieve this it is recommended to have automated testing as well as short development cycles.

Another tool that can be used with this branching strategy is feature flags. Feature flags allow features to be turned on and off. This allows features to be developed in the trunk without affecting the main code base.

When releases are ready a branch is made for the release, these branches do not have any commits pushed to them and are only used to indicate the state of the code at the point in time that a release was created.

To scale out trunk-based development teams can create short-lived feature branches and do pull requests similar to GitHub flow.
These branches should only be open for a few days at maximum and deleted once the changes have been merged into the trunk.

## Conclusion

As with many things in software development, it is not always a case of one size fits all, each of these strategies has its pros and cons and it is important to choose the right one for your team. 

Git flow can work well for teams that have structured release cycles or need a high degree of control over the code base and releases. 

GitHub flow can work well for teams that have a high degree of autonomy, but also requires more time to be spent on code reviews.

Trunk-Based Development works well for small fast-paced teams but can be difficult to scale out as well as being hard to get more junior developers up to speed and working on the trunk.

Due to the flexible nature of git, it is also possible to take elements from each of these strategies and combine them to create a branching strategy that works for your team.

Hopefully, these brief overviews have helped give you an idea of some of the different branching strategies and helped you work with your teams to find one that best suits your needs.

## References
Git Flow: <a href='https://nvie.com/posts/a-successful-git-branching-model/'>https://nvie.com/posts/a-successful-git-branching-model/</a>

GitHub Flow: <a href='https://docs.github.com/en/get-started/quickstart/github-flow'>https://docs.github.com/en/get-started/quickstart/github-flow</a>

Trunk-Based Development: <a href='https://trunkbaseddevelopment.com/'>https://trunkbaseddevelopment.com/</a>
