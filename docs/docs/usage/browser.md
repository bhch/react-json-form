---
layout: page.html
title: Using in Browser
---

In the browser, the library will be available under `reactJsonForm` variable.

## Creating the form

Use the [`reactJsonForm.createForm()`](#reactjsonform.createform(config)) function to
create the from from your schema.

You'll also need to have a `textarea` where the form will save the data.

```html
<div id="formContainer">
    <!-- The form will be displayed here -->
</div>

<textarea id="formData">
    <!-- The form data will be kept in this textarea -->
</textarea>


<script type="text/javascript">
var form = reactJsonForm.createForm({
    containerId: 'formContainer',
    containerId: 'formData',
    schema: {
        type: 'object',
        keys: {
            name: {type: 'string'},
            age: {type: 'integer'},
        }
    }
});

form.render();
</script>
```


## Handling events

```js
form.addEventListener('change', function(e) {
    // ... 
});
```

See [`addEventListener()`](#forminstance.addeventlistener(event%2C-callback)) section for 
further details about handling events.

## API reference

### Library functions

##### `reactJsonForm.createForm(config)`

Function used for creating the form UI. The `config` parameter is an object
which may contain these keys:

 - `containerId`: The HTML ID of the element in which the form should be rendered.
 - `dataInputId`: The HTML ID of the textarea element in which the form data should be kept.
 - `schema`: The schema of the form.
 - `data` *(Optional)*: The initial data of the form.
 - `fileHandler` *(Optional)*: URL for the common file handler endpoint for all file fields.


##### `reactJsonForm.getFormInstance(containerId)`

Call this function to get a previously created form instance.

If you've earlier created an instance in a scoped function, then to get 
the form instance in another scope, this function can be helpful.

This helps you avoid keeping track of the form instances yourself.

```js
var form = reactJsonForm.getFormInstance('formContainer');
```

### Form instance

The following methods, attributes & events are available on a form instance.

#### Methods

##### `formInstance.addEventListener(event, callback)`

Register a callback for a given event ([see available events](#events)).

The callback function will be passed an `Object` with the following keys:

 - `data`: Current data of the form.
 - `prevData`: Previous data of the form (before the event).
 - `schema`: Current schema of the form.
 - `prevSchema`: Previous schema of the form (before the event).

<div class="alert alert-info">
    <p><strong>Attention!</strong></p>
    <p>
        If you want to call the <a href="#forminstance.update(config)"><code>update()</code></a>
        method from within an event listener, <strong>you must call it conditionally</strong>
        or else it might cause an infite loop.
    </p>
    <p>
        For example, only call the <code>update()</code> after checking that the
        current <code>data</code> and <code>prevData</code> are not same.
    </p>
</div>

Example:

```js
var form = reactjsonform.createform(...);

form.addEventListener('change', function(e) {
    var data = e.data;
    var prevData: e.prevData;
    var schema: e.schema;
    var prevSchema: e.prevSchema;

    // do something ...
});
```

##### `formInstance.render()`

Function to render the form.

##### `formInstance.update(config)`

Re-render the form with the given `config`.


#### Events

Following is the list of currently available events:

 - `change`