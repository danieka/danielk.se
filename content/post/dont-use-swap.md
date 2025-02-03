---
title: "TIL: I probably don't want to use swap"
description: ""
date: "2025-02-03"
categories:
  - "Professional"
tags: ["practices"]
summary: Using swap can degrade performance so badly that the server might as well be down. Better to let it crash with OOM.
---

# TIL: I probably don't want to use swap

For the last 15 years or so I've been adding swap to my servers. It's more a habit than a active choice at this point. I think I started doing it after having some processes crash when they ran out of memory. My reasoning was that it was better to have performance degrade rather than let the server crash. This was also when I wrote mostly Django/Python, and before Docker existed. I did not know what monitoring was. So I don't think I had setup any kind of automatic restart and the only way I would find out that my server was down was when my users contacted me to complain. Thus I started adding swap to my servers.

I have a weird fixation with finding the cheapest possible server/instance typ to run servers on. It's a point of pride to run servers as cheaply as possible and to utilise resources as best as possible. So I still add swap to my servers. By now I code in Elixir instead of Python and the backend that I'm currently working on has both a REST API for clients and does some batch processing, which is super easy to combine thanks to the OTP. However, the batch jobs can consume a lot of memory when they run.

And last friday one batch job ran and consumed so much memory that the process consumed all available memory and started expanding into swap. And on a t4 AWS instance with EBS storage swap is _really_ slow. So while the process did not crash, in practice it responded so slowly to API requests that it might as well have been down since clients started timing out. It was impossible to SSH into the server and the only way to fix the issue was to force a restart through the AWS console, and that takes a couple of minutes.

I retrospect it would have been better to not have any swap at all and let the server crash and recover. That way I would have been able to rerun the batch at a better time and API would only have been down for a couple of seconds, instead of minutes. So from now on I'm not using any swap on production API servers. And I'm also implementing backpressure on the GenServers used for batch jobs to prevent memory usage from exploding.
