---
title: "Technology"
categories:
  - Garden
---

# Vue

## Migrating from PHP

**There is a summary at the end of the article.**

In this article I will describe our path on migrating a large PHP application to Vue. This effort has taken us about 6 months where a large portion of our time went to the actual rewrite. We were still able to continually make new releases thanks to the incremental nature of the migration. The PHP application was, as is often the case, a mixture of what I would consider backend and frontend. As well as handling templating and routing, a lot of logic and database interaction occured in the PHP layer. In our case we moved most of the backend parts to a new backend written in Java, but that is outside of the scope of this article. As is par for the course the frontend contained a liberal sprinkling of jQuery with a cornucopia of plugins.

### Taking inventory

The first step of a project of this scale is to get a sense of what you are working with. How is the project laid out? How is routing handled? Which parts of the frontend depend on which part. Depending on what you find here some of the advice I give in the article may not apply to you.

The first thing I realised working on the migration is that jQuery code is very much write only. At least in our case it was very difficult to refactor or extend the existing code. It had served with distinction for many years but when writing jQuery code it is inherently difficult to write code that has the proper separation of concerns and with proper encapsulation.

One of the most important things you have to take inventory of is the amount of organizational buy-in that you have. Have you got management and the other developers on board? If the answer is yes you have a greater leeway for disrupting the workflow. You can start with setting up build steps, you can start out using single file components, maybe you can even introduce Typescript. But if management or the other developers are on the fence about this migration a few early wins will help you win the leeway needed to make the bigger changes to the workflow that needs to happen. Because if you're colleagues haven't used NPM, Webpack, Babel, Vue or ES 6 before the migration all new tools will come as a bit of a shock. It is a completely different way of developing frontend applications.

If you need early wins you should skip over the step about CI/CI and just include Vue as a script from the CDN. Start writing Vue apps inside the PHP templates and focus on helping developers see the benefits of Vue. At \$WORK everyone was positive, and saw the need, for the migration, but none of the development team had worked with Vue previously. So letting them get their hands dirty and actually seeing the benefits was a huge for winning getting them onboard with the changes that were to follow.

### CI/CD

If you're dealing with a legacy PHP application it is probably safe to assume that there is no build pipeline in place and no CI. Deploys are probably made manually over FTP or by pushing to a remote repository. It will be tempting to try to change everything at the same time. But don't change how deploys are made if you don't have to. Your only task is to take the existing deploy method and move it over to some CI. That in itself is a huge step. Previously build artifacts and vendored libraries would all be checked into Git, so just adding a build step will be a big change. This also lets/forces your developers to get familiar with NPM and Webpack which can be a biggie.

We use Github Actions for CI/CD. Previously I've used CircleCI, but Github lured me in with the promise of 10 000 free minutes per month. Had I know that would be changed to a much lower number I would have gone with CircleCi. I found the developer experience of Github Actions to be significantly worse than CircleCI. `</rant>`

The build step is very simple. It's not pretty but it works. I've warned the team that they are on their own if they try to push to the remote repository from their development machines.

```
npm i
npm run build
git remote add target git@$REMOTE_HOST:$REMOTE_PATH
git add -f dist
git commit -m "Release build"
git push -f test HEAD:develop
```

If you are writing single file components you should also spend time on setting up a test step so that all PRs can be linted. If your team isn't used to writing modern Javascript you really should have linters in place when you start the migration. And even if everyone is experienced in writing ES 6 you should still have a linter from the first day. If you skip the linter you are setting yourself up for a gargantuan task they day you decide you do need a linter.

### Don't spend time removing old code

It is tempting to remove old code and dependencies as you go. It love the high I get from deleting old code! However, since the code you are working with probably is a mess of dependencies and global variables actually figuring out which parts of the legacy code that you can safely delete can be very time consuming and error prone. We spent way to much time reverting my over-zealous cleanups. If you think the migration will be completely finished in a couple of months you can just leave the code as it is. Sure, it will slow down loads and make your eyes bleed, but would you rather have slightly faster loads for a couple of months or complete the migration faster?

### Start with single file components immediately

This advice conflicts with my previous advice to start out with writing Vue directly in PHP template. You will have to pick the approach that suits your situation. Do you need to crawl before you run, or are you ready to sprint? Since you will eventually be writing only single file components you may as well start doing that immediately. Also, if the file ends with `.vue` you can be 100% sure that it contains no PHP code. Ergo, when your whole app is in `.vue` files you know you can safely delete all `.php` files. Kinda. Either way the end goal should always be to write only single file components.

One of the pitfalls of writing Vue apps directly in the PHP template is that it's easy for you to adopt a sloppy approach to component isolation. PHP + jQuery encourages a fundamentally different approach than Vue, so by just adding Vue 1:1 to your PHP templates you may accidentally adopt a structure that you'd be better off leaving in the dust. Especially component boundaries risk getting very blurred if you don't use single file components.

### UI Framework

At the same time that we migrated from PHP to Vue we also migrated from Materialize and Kendo to Vuetify. We initially tried to use Materialize and Kendo with Vue but quickly abandoned that approach. I believe both libraries to be technically subpar and the ergonomics of using those libraries with Vue is terrible. They mix **very** badly with Vues reactive model. Migrating the UI framework at the same time of course increased the amount of work we had to do but in hindsight it was absolutely worth the effort. Using Materialize with Vue would be like outfitting your Ferrari with worn out tires. Or something. I'm not a car man.

### Testing

The existing application will probably not have any existing tests, and almost certainely no E2E tests. I would have loved to have a suite of E2E tests to catch any regression. But the question is, should you be writing tests before or in parallell with the migration? My highly subjective answer is no. Your application will be going through a lot of changes over the coming months and all E2E tests will break. We are on our way to writing a full suite of E2E tests now, but we only started that work when the migration was complete. Having to do the migration at the same time as writing and maintaing a E2E test suite would have been too much work. This has required an increased testing effort from stakeholders, but I believe this effort to be smaller than the one we would have put into maintaining a test suite.

Now that we are writing an E2E test suite we have had great success with BDD-style test written in [Cucumber/Gherkin](https://github.com/TheBrainFamily/cypress-cucumber-preprocessor) and [Cypress](https://cypress.io).

### Webpack

### Mistakes made

### The actual setup

### Summary

<!-- # DevOps

- Only deploy stable and tested branches.
- Always do demos from stable and tested branches.
- Follow procedure. Especially if you put the procedure. Procedure is previous you's way of prevent current you from making a mistake. -->
