---
title: "AI: The Browser Has It All (Well, Almost)"
summary: Most AI features travel from the browser to your server, to an AI API, and back again. For simple tasks, the browser can do it on its own.
date: 2026-10-21
draft: false
---

I work on train booking. Searching for a train means reaching out to a large number of providers, and that comes with latency, failed attempts, retries... which all add up to long waits and, sometimes, failures. There's a limit to how fast you can make providers answer, but that's no reason to punish your users for it.

When we talk about making our users' lives easier, AI-based features often look like a good way to help. You could help them narrow their search with price prediction, or guide them through the combinatorial explosion of seat options. You could offer a summarised version of the legal conditions, alongside the mandatory ones, so they feel more comfortable with what they agree to. Or a non-binding translation for people whose language your website doesn't support.

Some of these, like price prediction, rely on your own data and clearly belong on the server. But the last two are simpler tasks, and that's where it gets interesting. Because the usual way of building them goes like this:

1. Wait for a trigger (a certain waiting time, a user action, etc.).
2. Send the content from the browser to your server.
3. Wait for the server to call an AI API (OpenAI, Anthropic, Mistral, etc.).
4. Get the answer and check it makes sense for your user.
5. Send it from the server back to the browser.
6. Display it.

Sound familiar? That's the same full-stack flow we use for every feature. On a search page, it's also the flow that's already busy polling providers and assembling results that arrive in no particular order. Adding AI to it means one more round trip, one more asynchronous source to reconcile in an already chaotic state, more load on the backend that serves your critical funnel, and a bill at the end of the month.

## The client to the rescue

It doesn't have to be this way. That summariser you wanted for legal terms? [It already exists in the browser](https://developer.mozilla.org/en-US/docs/Web/API/Summarizer_API). Same for the [Translator and Language Detector](https://developer.mozilla.org/en-US/docs/Web/API/Translator_and_Language_Detector_APIs). For now, they mostly live in desktop Chrome: this is still very much the experimenting phase, and I don't expect it to stay that way.

You might think: "Then let's just use a Prompt API." This one is tougher: [it exists in Chrome](https://developer.mozilla.org/en-US/docs/Web/API/Prompt_API), but both Mozilla and Apple have taken a negative position on it, so it won't be widely implemented any time soon, at least not in its current form.

The ones that are on track are a good foundation for more efficient AI features. They skip the client-server-API-server-client trip, which declutters your app. Once the model is on the device, they depend neither on your user's connection nor on your AI budget. And the data never leaves your user's machine, which is nice to be able to say about legal terms or travel details. It's cheaper and, though that's a personal bet, possibly lighter in terms of ecological footprint.

It's not magic, though. Inference still takes a moment, and the model may still be downloading when your user needs it. You still have state to handle, but it lives in the browser instead of making a round trip through your backend.

## Ask for a task, not a model

There's another thing I like about these APIs. With a server-side setup, you either send everything to one big general-purpose model, or you pick the right model, size and effort level for each feature. That's a technical call most product teams aren't comfortable making.

Here, you don't pick a model. You ask for a summary or a translation, and the browser brings a model sized for that job. The decision moves from "which model?" to "which task?", and that's a decision any product engineer can make. You don't need a large language model to summarise a page, and with these APIs you don't even have to think about it.

## Progressive enhancement, for AI

The role of engineers here is bigger than forwarding requests between users and GPTs. Instead of turning parts of your app into a proxy between a need and a third-party answer, you get to design the whole thing.

One idea: a cousin of progressive enhancement for AI features. Each of these APIs has an `availability()` method that tells you whether the model is unavailable, downloadable, downloading or ready. That's four states you can design for, just like loading and error states.

Model unavailable? The page works without the feature, the way it would without JavaScript. Model downloadable? Offer the feature, and start the download when your user asks for it: browsers require a user action for that, which is a good thing, since it's their bandwidth and their disk. Model downloading? Show the progress. Model ready? The feature works, and it keeps working when the connection drops in the next tunnel.

Not every AI feature belongs in the browser. But for simple tasks like summarising or translating, it's worth asking whether your server needs to be involved at all.
