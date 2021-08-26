import {getBlankData} from './data';
import {Button, FormInput, FormCheckInput, FormRadioInput, FormSelectInput,
    FormFileInput, FormRow, FormGroup} from './components';
import {getVerboseName} from './util';


function handleChange(e, valueType, callback) {
    let type = e.target.type
    let value;

    if (type === 'checkbox') {
        value = e.target.checked;
    } else {
        value = e.target.value;
    }

    if (valueType === 'number') {
        value = value.trim();
        if (value !== '' && !isNaN(Number(value)))
            value = Number(value);
    }

    callback(e.target.name, value);
}


function FormField(props) {
    let inputProps = {
        name: props.name,
        value: props.data,
    };

    let type = props.schema.type;
    if (props.schema.choices) {
        inputProps.options = props.schema.choices;
        type = 'select';
    }
    if (props.schema.widget)
        type = props.schema.widget;

    let InputField;

    switch (type) {
        case 'string':
            InputField = FormInput;

            if (props.schema.format) {
                if (props.schema.format === 'data-url' || props.schema.format === 'file-url') {
                    InputField = FormFileInput;
                }
                inputProps.type = props.schema.format;
            }
            else {
                inputProps.type = 'text';
            }
            break;
        case 'number':
            inputProps.type = 'number';
            InputField = FormInput;
            break;
        case 'integer':
            inputProps.type = 'number';
            InputField = FormInput;
            break;
        case 'boolean':
            inputProps.type = 'checkbox';
            InputField = FormCheckInput;
            break;
        case 'checkbox':
            inputProps.type = 'checkbox';
            InputField = FormCheckInput;
            break;
        case 'radio':
            inputProps.type = 'radio';
            InputField = FormRadioInput;
            break;
        case 'select':
            InputField = FormSelectInput;
            break;
        default:
            inputProps.type = 'text';
            InputField = FormInput;
    }

   return (
        <InputField 
            {...inputProps}
            label={
                props.editable ? <span>{props.schema.title} <Button className="edit" onClick={props.onEdit} title="Edit">Edit</Button></span>
                :
                props.schema.title
            }
            onChange={(e) => handleChange(e, props.schema.type, props.onChange)}
        />
    );
}


export function getStringFormRow(data, schema, name, onChange, onRemove, removable, onEdit, editable) {

    return (
        <FormRow 
            key={name}
            onRemove={removable ? (e) => onRemove(name) : null}
        >
            <FormField 
                data={data}
                schema={schema}
                name={name}
                onChange={onChange}
                onEdit={onEdit}
                editable={editable}
            />
        </FormRow>
    );
}

export function getArrayFormRow(data, schema, name, onChange, onAdd, onRemove, level) {
    let rows = [];
    let groups = [];

    let removable = true;
    let min_items = schema.min_items || 0;
    if (data.length <= min_items)
        removable = false;

    let addable = true;
    let max_items = schema.max_items || 100;
    if (data.length >= max_items)
        addable = false;

    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        let childName = name + '-' + i;

        if (schema.items.type === 'array') {
            groups.push(getArrayFormRow(item, schema.items, childName, onChange, onAdd, onRemove, level + 1));
        } else if (schema.items.type === 'object') {
            groups.push(getObjectFormRow(item, schema.items, childName, onChange, onAdd, onRemove, level + 1));
        } else {
            rows.push(getStringFormRow(item, schema.items, childName, onChange, onRemove, removable));
        } 
    }

    let coords = name; // coordinates for insertion and deletion

    if (rows.length || (!rows.length && !groups.length)) {
        rows = (
            <FormGroup
                level={level}
                schema={schema}
                addable={addable}
                onAdd={() => onAdd(getBlankData(schema.items), coords)}
                key={'row_group_' + name}
            >
                {rows}
            </FormGroup>
        );
    }

    if (groups.length) {
        let groupTitle = schema.title ? <div className="rjf-form-group-title">{schema.title}</div> : null;

        groups = (
            <div key={'group_' + name}>
                {groupTitle}
                {groups.map((i, index) => (
                    <div className="rjf-form-group-wrapper" key={'group_wrapper_' + name + '_' + index}>
                        {removable && 
                            <Button
                                className="remove"
                                onClick={(e) => onRemove(name + '-' + index)}
                                title="Remove"
                            >
                                &times;
                            </Button>
                        }
                        {i}
                    </div>
                    )
                )}
                {addable && 
                    <Button
                        className="add"
                        onClick={(e) => onAdd(getBlankData(schema.items), coords)}
                        title="Add new"
                    >
                        + Add Group Array
                    </Button>
                }
            </div>
        )
    }

    return [...rows, ...groups];
}


export function getObjectFormRow(data, schema, name, onChange, onAdd, onRemove, level) {
    let rows = [];

    let keys = [...Object.keys(schema.keys)];

    if (schema.additionalProperties)
        keys = [...keys, ...Object.keys(data).filter((k) => keys.indexOf(k) === -1)];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = data[key];
        let childName = name + '-' + key;
        let schemaValue = schema.keys[key] || {type: 'string'};

        if (!schemaValue.title)
            schemaValue.title = getVerboseName(key);

        let removable = false;
        if (schema.keys[key] === undefined)
            removable = true;

         if (schemaValue.type === 'array') {
            rows.push(getArrayFormRow(value, schemaValue, childName, onChange, onAdd, onRemove, level + 1));
        } else if (schemaValue.type === 'object') {
            rows.push(getObjectFormRow(value, schemaValue, childName, onChange, onAdd, onRemove, level + 1));
        } else {
            rows.push(getStringFormRow(
                value, schemaValue, childName, onChange, onRemove, removable, 
                () => handleKeyEdit(data, key, value, childName, onAdd, onRemove),
                removable
            ));
        }
    }

    if (rows.length || schema.additionalProperties) {
        let className = "rjf-form-group-inner";
        if (level === 0 && !rows.length)
            className = "";
        
        let coords = name;

        rows = (
            <FormGroup
                level={level}
                schema={schema}
                addable={schema.additionalProperties}
                onAdd={() => handleKeyValueAdd(data, coords, onAdd)}
                key={'row_group_' + name}
            >
                {rows}
            </FormGroup>
        );
    }

    return rows;
}


function handleKeyValueAdd(data, coords, onAdd) {
    let key = prompt("Add new key");
    if (key === null) // clicked cancel
        return;

    key = key.trim();
    if (!key)
        alert("(!) Can't add empty key.\r\n\r\n‎");
    else if (data.hasOwnProperty(key))
        alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");
    else
        onAdd("", coords + '-' + key);   
}


function handleKeyEdit(data, key, value, coords, onAdd, onRemove) {
    let newKey = prompt("Rename key", key);
    if (newKey === null) // clicked cancel
        return;

    newKey = newKey.trim();

    if (newKey === key) // same keys
        return;

    if (!newKey)
        return alert("(!) Key name can't be empty.\r\n\r\n‎");
    else if (data.hasOwnProperty(newKey))
        return alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");

    onAdd(value, name + '-' + newKey);
    onRemove(coords);
}
