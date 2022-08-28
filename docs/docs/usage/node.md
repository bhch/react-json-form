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

 - `editorState`: Instance of [`EditorState`](#editorstate) containing the schema and data.
 - `onChange`: Callback function for handling changing. This function will receive a new instance of 
 `EditorState` (because `EditorState` is immutable, instead of modifying the previous instance, we
 replace it with a new one).
 - `fileHandler`: A URL to a common file handler endpoint for all file input fields.

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

If you want to update the schema, you must create a new state using
`EditorState.create()` method as that will also validate the schema and the data.


### Instance methods

The following methods are available on an instance of `EditorState`.


##### `EditorState.getData()`

Use this method to get the current data of the form.

It will either return an `Array` or an `Object` depending upon the outermost `type`
declared in the schema.


##### `EditorState.getSchema()`

This method returns the schema.
