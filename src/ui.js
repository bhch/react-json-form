import {getBlankData} from './data';
import {Button, FormInput, FormCheckInput, FormRadioInput, FormSelectInput,
    FormFileInput, FormRow, FormGroup, FormRowControls, FormTextareaInput,
    FormDateTimeInput, FormMultiSelectInput} from './components';
import {getVerboseName} from './util';


function handleChange(e, fieldType, callback) {
    let type = e.target.type
    let value;

    if (type === 'checkbox') {
        value = e.target.checked;
    } else {
        value = e.target.value;
    }

    if (fieldType === 'number' || fieldType === 'integer') {
        value = value.trim();
        if (value === '')
            value = null;
        else if (!isNaN(Number(value)))
            value = Number(value);
    } else if (fieldType === 'boolean') {
        if (value === 'false' || value === false)
            value = false;
        else
            value = true;
    }

    callback(e.target.name, value);
}


function FormField(props) {
    let inputProps = {
        name: props.name,
        value: props.data,
        readOnly: props.schema.readOnly || props.schema.readonly,
        help_text: props.schema.help_text || props.schema.helpText,
    };

    let type = props.schema.type;
    if (props.schema.choices) {
        inputProps.options = props.schema.choices;
        type = 'select';
    }
    if (props.schema.widget) {
         if (props.schema.widget === 'multiselect' && props.parentType !== 'array') {
            // pass
         } else {
            type = props.schema.widget;
         }
    }


    let InputField;

    switch (type) {
        case 'string':
            InputField = FormInput;

            if (props.schema.format) {
                if (props.schema.format === 'data-url' || props.schema.format === 'file-url') {
                    InputField = FormFileInput;
                } else if (props.schema.format === 'datetime') {
                    InputField = FormDateTimeInput;
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
            inputProps.step = '1';
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
        case 'multiselect':
            InputField = FormMultiSelectInput;
            break;
        case 'textarea':
            InputField = FormTextareaInput;
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


export function getStringFormRow(args) {
    let {
        data, schema, name, onChange, onRemove, removable, onEdit, editable, 
        onMoveUp, onMoveDown, parentType, ...fieldProps
    } = args;

    return (
        <FormRow 
            key={name}
            onRemove={removable ? (e) => onRemove(name) : null}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
        >
            <FormField 
                data={data}
                schema={schema}
                name={name}
                onChange={onChange}
                onEdit={onEdit}
                editable={editable}
                parentType={parentType}
                {...fieldProps}
            />
        </FormRow>
    );
}

export function getArrayFormRow(args) {
    let {data, schema, name, onChange, onAdd, onRemove, onMove, level} = args;

    let rows = [];
    let groups = [];

    let removable = true;
    let min_items = schema.min_items || schema.minItems || 0;
    if (data.length <= min_items)
        removable = false;

    let addable = true;
    let max_items = schema.max_items || schema.maxItems || 100;
    if (data.length >= max_items)
        addable = false;

    let type = schema.items.type;
    
    if (type === 'list')
        type = 'array';
    else if (type === 'dict')
        type = 'object';

    let nextArgs = {
        schema: schema.items,
        onChange: onChange,
        onAdd: onAdd,
        onRemove: onRemove,
        level: level + 1,
        removable: removable,
        onMove: onMove,
        parentType: 'array',
    };

    if (nextArgs.schema.widget === 'multiselect') {
        nextArgs.data = data;
        nextArgs.name = name;
        nextArgs.removable = false;
        nextArgs.onMoveUp = null;
        nextArgs.onMoveDown = null;
        addable = false;
        rows.push(getStringFormRow(nextArgs));
    } else {

        for (let i = 0; i < data.length; i++) {
            nextArgs.data = data[i];
            nextArgs.name = name + '-' + i;

            if (i === 0)
                nextArgs.onMoveUp = null;
            else
                nextArgs.onMoveUp = (e) => onMove(name + '-' + i, name + '-' + (i - 1));

            if (i === data.length - 1)
                nextArgs.onMoveDown = null;
            else
                nextArgs.onMoveDown = (e) => onMove(name + '-' + i, name + '-' + (i + 1));

            if (type === 'array') {
                groups.push(getArrayFormRow(nextArgs));
            } else if (type === 'object') {
                groups.push(getObjectFormRow(nextArgs));
            } else {
                rows.push(getStringFormRow(nextArgs));
            } 
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
                        <FormRowControls
                            onRemove={removable ? (e) => onRemove(name + '-' + index) : null}
                            onMoveUp={index > 0 ? (e) => onMove(name + '-' + index, name + '-' + (index - 1)) : null}
                            onMoveDown={index < groups.length - 1 ? (e) => onMove(name + '-' + index, name + '-' + (index + 1)) : null}
                        />
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
                        Add item
                    </Button>
                }
            </div>
        )
    }

    return [...rows, ...groups];
}


export function getObjectFormRow(args) {
    let {data, schema, name, onChange, onAdd, onRemove, level, onMove} = args;

    let rows = [];

    let schema_keys = schema.keys || schema.properties;

    let keys = [...Object.keys(schema_keys)];

    if (schema.additionalProperties)
        keys = [...keys, ...Object.keys(data).filter((k) => keys.indexOf(k) === -1)];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = data[key];
        let childName = name + '-' + key;
        let schemaValue = schema_keys[key] || {type: 'string'};

        let type = schemaValue.type;
    
        if (type === 'list')
            type = 'array';
        else if (type === 'dict')
            type = 'object';

        if (!schemaValue.title)
            schemaValue.title = getVerboseName(key);

        let removable = false;
        if (schema_keys[key] === undefined)
            removable = true;

        let nextArgs = {
            data: value,
            schema: schemaValue,
            name: childName,
            onChange: onChange,
            onAdd: onAdd,
            onRemove: onRemove,
            level: level + 1,
            removable: removable,
            onMove: onMove,
            parentType: 'object',
        };

         if (type === 'array') {
            rows.push(getArrayFormRow(nextArgs));
        } else if (type === 'object') {
            rows.push(getObjectFormRow(nextArgs));
        } else {
            nextArgs.onEdit = () => handleKeyEdit(data, key, value, childName, onAdd, onRemove);
            nextArgs.editable = removable;
            rows.push(getStringFormRow(nextArgs));
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

    let newCoords = coords.split('-');
    newCoords.pop();
    newCoords.push(newKey);
    newCoords = newCoords.join('-');

    onAdd(value, newCoords);
    onRemove(coords);
}
