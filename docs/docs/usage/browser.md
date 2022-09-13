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
    dataInputId: 'formData',
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


## Data validation

*New in version 2.1*

The form component provides basic data validation.

Usage example:

```js
var validation = form.validate();

var isValid = validation.isValid; // it will be false if data is not valid

var errorMap = validation.errorMap; // object containing error messages

if (!isValid) {
     // notify user
    alert('Please correct the errors');

    // update the form component
    // it will display error messages below each input
    form.update({errorMap: errorMap});
}

```

You can adopt the above code example to validate the data before a form is submitted.

You can also implement custom validation instead of calling `.validate()`. In that
case, you'll have to manually create an [`errorMap` object]({{ '/docs/usage/node/#data-validation' | url }})
for displaying error messages.

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
 - `errorMap` *(Optional)*: An object containing error messages for fields.

*Changed in version 2.1*: `errorMap` option was added.


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

##### `formInstance.render()`

Function to render the form.

##### `formInstance.update(config)`

Re-render the form with the given `config`.


##### `formInstance.validate()`

*New in version 2.1*

Validates the current data against the instance's schema.

Returns a *validation* object with following keys:

 - `isValid`: It will be `true` if data is valid, else `false`.
 - `errorMap`: An object containing field names and validation errors.

##### `formInstance.getData()`

*New in version 2.1*

Returns the current data of the form instance.

##### `formInstance.getSchema()`

*New in version 2.1*

Returns the current schema of the form instance.


#### Events

Following is the list of currently available events:

##### `change`

This event is fired for every change in the form's data.

The callback for this event will be passed an `Object` with the following keys:

 - `data`: Current data of the form.
 - `prevData`: Previous data of the form (before the event).
 - `schema`: Current schema of the form.
 - `prevSchema`: Previous schema of the form (before the event).

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

<div class="alert alert-info">
    <p><strong>Attention!</strong></p>
    <p>
        If you want to call the <a href="#forminstance.update(config)"><code>update()</code></a>
        method from the <code>change</code> event listener, <strong>you must call it conditionally</strong>
        or else it might cause an infite loop.
    </p>
    <p>
        For example, only call the <code>update()</code> after checking that the
        current <code>data</code> and <code>prevData</code> are not same.
    </p>
</div>
