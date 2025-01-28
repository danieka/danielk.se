---
title: "Balancing production and production capacity"
description: ""
date: "2025-01-28"
categories:
  - "Professional"
tags: ["practices"]
summary: Balancing production and investing in production capability requires judgments calls, but it's probably safer to err towards investing in production capability.
---

# Balancing production and production capacity

This weekend I played board games with some friends, and more specifically we played a game called Hansa. It's a strategy game, and like most strategy games you have resources that you need to manage. In this game there was a clear division between production and production capacity. Production capacity allowed you to do more actions each turn and more powerful actions. With these actions you were able to buy resources that provided points.

Some players focused on building their production capacity while some rushed to buy points. So at the end of the game some players hade a huge production capacity, but the game had ended before they had a chance to use that capacity to buy points. Others had few points because their capacity to buy points during the game had been too low. The winner had balanced building production capacity with using that capacity to buy points.

The need to balance between production capacity and actual production is ever present when building software. Devoting time to a CI pipeline increases the teams production capacity, but doesn't actually produce anything. Cutting corners when delivering a new feature prioritises production at the cost of future production capacity.

Reality, just like games, have limits to have long you can play and software projects have deadlines that are more or less arbitrary. Deadlines can be imposed by a product manager. The project may have a limited budget. The startup may run out of cash. A competitor may launch a similar product or feature before you. Having a perfect development environment doesn't really help a startup that doesn't have any cash left for payroll.

The balancing act requires judgement calls that are made in the moment but I've assembled a few heuristics.

- According to [Accelerate](https://www.amazon.se/-/en/Gene-Kim/dp/1942788339) developer burnout is causally affected by low production capacity. Complicated release flows, lack of automated testing and other best practices tend to increase rates of burnout. Investing in production capacity is a way to care for the people on your team.

- Code, once merged, stays around a lot longer than you originally thought. Even if your team continually dedicates time to refactor and improve old code there are a lot of things that you will, realistically, never get around to fixing. So you should probably be diligent when writing code.

- If development is exploratory, for example at a startup, it's difficult to know ahead of time if the feature you're working on right now is useful. The code you write might be removed in a couple of months since you misunderstood customer requirements or misjudged the market. So occasionally your diligence when writing code will be wasted.

- Coordination between individuals and teams slows down velocity. That is, the more you must coordinate in order to complete work, the more you will be waiting for others to respond. If you're blocked by some other team your productivity will suffer. If you can test, merge and deploy your changes without coordination you will be more productive. Investing in automating testing and deployment pipelines can remove the need to coordinate.

All in all I probably lean too much towards investing in production capacity. But I think that software development is a marathon, not a sprint, so what you invest in production capacity today will pay dividends for years to come.
