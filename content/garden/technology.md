---
title: "Technology"
categories:
    - Garden
---

# Vue

## Migrating from PHP

In this article I will describe our path on migrating a large PHP application to Vue. This effort has taken us about 6 months where a large portion of our time went to the actual rewrite. We were still able to continually make new releases thanks to the incremental nature of the migration. The PHP application was, as is often the case, a mixture of what I would consider backend and frontend. As well as handling templating and routing a lot of logic and database intercation occured in the PHP layer. In our case we moved most of the backend parts to a new backend written in Java, but that is outside of the scope of this article. As is par for the course the frontend contained a liberal sprinkling of jQuery with a cornucopia of plugins.

### Taking inventory

The first step of a project of this scale is to get a sense of what you are working with. How is the project laid out? How is routing handled? Which parts of the frontend depend on which part. Depending on what you find here some of the advice I give in the article may not apply to you. 

The first thing I realised working on the migration is that jQuery code is very much write only. At least in our case it was very difficult to refactor or extend the existing code. It had served with distinction for many years but when writing jQuery code it is inherently difficult to write code that has the proper separation of concers and with proper encapsulation.

One of the most important things you have to take inventory of is the amount of organizational buy-in that you have. Have you got management and the other developers on board? If the answer is yes you have a greater leeway for disruption the workflow. You can start with setting up build steps, you can start out using single file components, maybe you can even introduce Typescript. But if management or the other developers are on the fence about this migration a few early wins will help you win the leeway needed to make larger disruptions to the workflow. Because if you haven't used NPM, Webpack, Babel, Vue and ES 6 before all of this will come as a bit of a shock. It is a completely different way of developing frontend applications.

If you need early wins you should skip over the step about CI/CI and just include Vue as a script from the CDN. Start writing Vue apps inside the PHP templates and focus on helping developers see the benefits of Vue. At Flinker everyone was positive, and saw the need, for the migration, but none of the development team had worked with Vue previously. So getting their hands dirty and actually seeing the benefits was huge for winning getting them onboard with the changes that were to follow.

### CI/CD

If you're dealing with a legacy PHP application it is probably safe to assume that there is no build pipeline in place and no CI. Deploys are probably made manually over FTP or by pushing to a remote repository. It will be tempting to try to change everything at the same time. But don't change how deploys are made if you don't have to. Your only task is to take the existing deploy method and move it ovver to some CI. That in itself is a huge step. You should not check in build artifacts or vendored libraries in source control, which in our case is a big change. This also forces our developers to get familiar with NPM and Webpack which can be a biggie.

We use Github Actions for CI/CD. Previously I've used CircleCI, but they hooked us with the promise of 10 000 free minutes per month. Had I know that would be changed I would have gone for CircleCi. I found the developer experience of Github Actions to be significantly worse than CircleCI. </rant>

The build step is very simple. It's not pretty but it works. I've warned the team that they are on their own if they try to push to the remote from their development machines.

```
npm i
npm run build
git remote add target git@$REMOTE_HOST:$REMOTE_PATH
git add -f dist
git commit -m "Release build"
git push -f test HEAD:develop
```

If you are writing SFC you should also spend time on setting up a test step so that all PRs can be linted. If your team isn't used to writing in ES 6 you really should have linters in place when you start the migration.


### Don't spend time removing old code

It is tempting to remove old code and dependencies as you go. It just feels so good to delete code! However, since the code you are working probably is a mess of dependencies and global variables, actually figuring out which parts of the legacy code that you can delete can be very time consuming and error prone. We spent way to much time reverting over-zealous cleanups. If you think the migration will be done completely done in a couple of months you can just leave the code as it is. Sure, it will slow down loads. But would you rather have slightly faster loads for a couple of months or complete the migration faster?

### Start with SFCs immediately

This advice conflicts with my previous advice to start out with writing Vue directly in PHP template. Pick whichever suits you better. But since you will eventually be writing only SFC you may as well start doing that from the get go. Also, if the file ends with `.vue` you can be 100% sure that it contains no PHP code. Ergo, when your whole app is in `.vue` files you know you can safely delete all `.php` files. Kinda. Either way you should be writing SFC components.

One of the pitfalls of writing Vue apps directly in the PHP template is that.

# DevOps

* Only deploy stable and tested branches.
* Always do demos from stable and tested branches.
* Follow procedure. Especially if you put the procedure. Procedure is previous you's way of prevent current you from making a mistake.