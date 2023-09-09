---
layout: page.html
title: Using in Node
---

## Basic usage

**React JSON Form** delegates the state management to you. Your component is
responsible for saving the state.

### Example using hooks

```jsx
import {ReactJSONForm, EditorState} from '@bhch/react-json-form';


const MyForm = () => {
    const [editorState, setEditorState] = useState(() =>
        EditorState.create(schema, data)
    );

    return (
        <ReactJSONForm
            editorState={editorState}
            onChange={setEditorState}
        />
    );
};
```

### Example using class component

```jsx
import {ReactJSONForm, EditorState} from '@bhch/react-json-form';


class MyComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editorState: EditorState.create(schema, data);
        }
    }

    handleFormChange = (editorState) => {
        this.setState({editorState: editorState});
    }

    render() {
        return (
            <div>
                <ReactJSONForm
                    editorState={this.state.editorState}
                    onChange={handleFormChange}
                />
            </div>
        );
    }
}
```

## `ReactJSONForm` API reference

### Props

 - `editorState`: Instance of [`EditorState`](#editorstate-api-reference) containing the schema and data.
 - `onChange`: Callback function for handling changes. This function will receive a new instance of 
 `EditorState` (because `EditorState` is immutable, instead of modifying the previous instance, we
 replace it with a new one).
 - `fileHandler`: A URL to a common file handler endpoint for all file input fields.
 - `fileHandlerArgs` (*Optional*): Key-value pairs which will be sent via querystring to the `fileHandler` URL.
 - `errorMap`: An object containing error messages for input fields. [See data validation section](#data-validation)
 for more.
 - `readonly`: A boolean. If `true`, the whole form will be read-only.

*Changed in version 2.1*: `errorMap` prop was added.  
*Changed in version 2.10*: `readonly` prop was added.

## `EditorState` API reference

`EditorState` must be treated as an immutable object. If you want to make any 
changes to the state, such as updating the schema, or changing the data, you 
must do it by calling the methods provided by `EditorState`.

Always avoid directly mutating the `EditorState` object.

### Static methods

##### `EditorState.create(schema, data)`

**Returns**: New `EditorState` instance.

**Arguments**:

 - `schema`: Schema for the form. It can either be a JS `Object` or a JSON string.
 - `data` *(Optional)*: Initial data for the form. It can either be a JS `Object`,
 `Array`, or a JSON string.

This method also tries to validate the schema and data and it will raise an exception
if in case the schema is invalid or the data structure doesn't match the given schema.


##### `EditorState.update(editorState, data)`

**Returns**: New `EditorState` instance.

**Arguments**:

 - `editorState`: Instance of `editorState`.
 - `data`: Must be either a JS `Object` or `Array`. It can not be a JSON string.

Use this method to update an existing `EditorState` with the given data.

Since, the `EditorState` object is considered immutable, it doesn't actually
modify the given `editorState`. Instead, it creates and return a new `EditorState`
instance.

This method is only for updating data. It doesn't do any validations to keep 
updates as fast as possible.

If you want to validate the schema, you must create a new state using
`EditorState.create()` method as that will also validate the schema and the data.


### Instance methods

The following methods are available on an instance of `EditorState`.


##### `EditorState.getData()`

Use this method to get the current data of the form.

It will either return an `Array` or an `Object` depending upon the outermost `type`
declared in the schema.


##### `EditorState.getSchema()`

This method returns the schema.


#### Data validation

*New in version 2.1*

**React JSON Form** comes with a basic data validator called [`DataValidator`](#datavalidator-api-reference).
But you are free to validate the data however you want.

After the validation, you may also want to display error messages below the
input fields. For this purpose, the `ReactJSONForm` component accepts an `errorMap`
prop which is basically a mapping of field names in the data and error messages.

An `errorMap` looks like this:

```js
let errorMap = {
    'name': 'This field is required',

    // multiple error messages
    'age': [
        'This field is required',
        'This value must be greater than 18'
    ]

    // nested arrays and objects

    // first item in array
    '0': 'This is required',

    // first item > object > property: name
    // (see note below about the section sign "§")
    '0§name': 'This is required'
}
```

<div class="alert alert-info">
    <p><strong>The section sign (§)</strong></p>
    <p>
        The section sign (<code>§</code>) is used as the separator symbol for
        doing nested items lookup.
    </p>
    <p>
        Earlier, the hyphen (<code>-</code>) was used but that complicated things
        when the the schema object properties (i.e. field names) also had a hyphen
        in them. Then it became impossible to determine whether the hyphen was the
        separator or part of the key.
    </p>
</div>


##### `DataValidator` API reference

##### Constructor

##### `new DataValidator(schema)`

**Returns**: An instance of `DataValidator`

**Arguments**:

 - `schema`: Schema object (not JSON string).

##### Instance methods

Following methods must be called form the instance of `DataValidator`.

##### `validatorInstance.validate(data)`

**Returns**: A *validation* object containing these keys:

 - `isValid`: A boolean denoting whether the data is valid or not.
 - `errorMap`: An object containing error messages for invalid data fields.

**Arguments**:

 - `data`: The data to validate against the `schema` provided to the constructor.

Example:

```jsx
import {DataValidator} from '@bhch/react-json-form';

const validator = new DataValidator(schema);
const validation = validator.validate(data);

const isValid = validation.isValid;
const errorMap = validation.errorMap;

if (isValid)
    alert('Success');
else
    alert('Invalid');

// pass the errorMap object to ReactJSONForm
// and error messages will be displayed under
// input fields
<ReactJSONForm
    editorState={...}
    errorMap={errorMap}
/>
```
