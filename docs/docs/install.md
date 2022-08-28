---
layout: page.html
title: Install
---

**React JSON Form** can be used either in your Node project or directly in the browser.

## Node

Install it using this command:

```shell
$ npm install @bhch/react-json-form --save
```

## Browser

Before loading the library, you're also required to include the dependencies.

### Loading via CDN

This library is available via Unpkg CDN.

```html
<!-- dependencies -->
<script src="https://unpkg.com/react@17.0.2/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/react-modal@3.15.1/dist/react-modal.min.js"></script>

<!-- library -->
<script src="https://unpkg.com/@bhch/react-json-form@2.0.0/dist/react-json-form.js"></script>
```

### Self hosting

We also provide compiled dist files for every release. This allows you to self host and serve
this library.

[Download the latest release][1] from Github.

Next, extract `react-json-form.js` file from the package. This is the browser suitable build.
It's already minified.

[1]: https://github.com/bhch/react-json-form/releases/download/v{{ project.version }}/react-json-form-{{ project.version }}-dist.zip