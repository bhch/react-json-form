import React from 'react';
import {getBlankData, findMatchingSubschemaIndex, dataObjectMatchesSchema,
    dataArrayMatchesSchema} from './data';
import {Button, FormInput, FormCheckInput, FormRadioInput, FormSelectInput,
    FormFileInput, FormRow, FormGroup, GroupTitle, FormRowControls, FormTextareaInput,
    FormDateTimeInput, FormMultiSelectInput, FileUploader, AutoCompleteInput} from './components';
import {getVerboseName, convertType, getCoordsFromName, getKeyword, normalizeKeyword,
    joinCoords, splitCoords, actualType, getSchemaType, isEqualset, isSubset} from './util';


function handleChange(e, fieldType, callback) {
    let type = e.target.type
    let value;

    if (type === 'checkbox') {
        value = e.target.checked;
    } else {
        value = e.target.value;
    }

    if (Array.isArray(value)) { /* multiselect widget values are arrays */
        value = value.map((item) => convertType(item, fieldType));
    } else {
        value = convertType(value, fieldType);
    }

    callback(e.target.name, value);
}


function FormField(props) {
    let inputProps = {
        name: props.name,
        value: props.data,
        readOnly: getKeyword(props.schema, 'readOnly', 'readonly'),
        help_text: getKeyword(props.schema, 'help_text', 'helpText'),
        error: props.errorMap[getCoordsFromName(props.name)],
        required: props.schema.required || false,
    };

    if (typeof inputProps.error === 'string')
        inputProps.error = [inputProps.error];

    if (props.schema.placeholder)
        inputProps.placeholder = props.schema.placeholder;

    if (props.schema.handler)
        inputProps.handler = props.schema.handler;

    let type = props.schema.type;
    let choices = getKeyword(props.schema, 'choices', 'enum');

    if (choices) {
        inputProps.options = choices;
        type = 'select';
    }

    if (props.schema.widget) {
         if (props.schema.widget === 'multiselect' && props.parentType !== 'array') {
            // pass
         } else if (props.schema.widget === 'hidden') {
            type = 'string';
         } else {
            type = props.schema.widget;
         }
    }


    let InputField;

    switch (type) {
        case 'string':
            InputField = FormInput;

            if (props.schema.format) {
                if (props.schema.format === 'data-url') {
                    InputField = FormFileInput;
                } else if (props.schema.format === 'file-url') {
                    InputField = FileUploader;
                } else if (normalizeKeyword(props.schema.format) === 'date-time') {
                    InputField = FormDateTimeInput;
                }
                inputProps.type = props.schema.format;
            } else if (props.schema.widget === 'hidden') {
                inputProps.type = 'hidden';
            } else {
                inputProps.type = 'text';
            }

            if (props.schema.minLength || props.schema.minLength === 0)
                inputProps.minLength = props.schema.minLength;

            if (props.schema.maxLength || props.schema.maxLength === 0)
                inputProps.maxLength = props.schema.maxLength;

            break;
        case 'fileinput':
            InputField = FormFileInput;
            if (props.schema.format)
                inputProps.type = props.schema.format;
            break;
        case 'range':
        case 'integer':
            inputProps.step = '1';
            // fall through
        case 'number':
            if (type === 'range')
                inputProps.type = 'range';
            else
                inputProps.type = 'number';

            InputField = FormInput;

            if (props.schema.minimum || props.schema.minimum === 0)
                inputProps.min = props.schema.minimum;

            if (props.schema.maximum || props.schema.maximum === 0)
                inputProps.max = props.schema.maximum;

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
            inputProps.valueType = props.schema.type;
            InputField = FormMultiSelectInput;
            break;
        case 'autocomplete':
            InputField = AutoCompleteInput;
            break;
        case 'textarea':
            InputField = FormTextareaInput;

            if (props.schema.minLength || props.schema.minLength === 0)
                inputProps.minLength = props.schema.minLength;

            if (props.schema.maxLength || props.schema.maxLength === 0)
                inputProps.maxLength = props.schema.maxLength;

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
        data, schema, name, onChange, onRemove, removable, onEdit, onKeyEdit, editable, 
        onMoveUp, onMoveDown, parentType, errorMap, ...fieldProps
    } = args;

    return (
        <FormRow 
            key={name}
            onRemove={removable ? (e) => onRemove(name) : null}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            hidden={schema.widget === 'hidden'}
        >
            <FormField 
                data={data}
                schema={schema}
                name={name}
                onChange={onChange}
                onEdit={onKeyEdit}
                editable={editable}
                parentType={parentType}
                errorMap={errorMap}
                {...fieldProps}
            />
        </FormRow>
    );
}

export function getArrayFormRow(args) {
    let {data, schema, name, onChange, onAdd, onRemove, onMove, onEdit, level} = args;

    let rows = [];
    let groups = [];

    let removable = true;
    let min_items = getKeyword(schema, 'min_items', 'minItems') || 0;
    if (data.length <= min_items)
        removable = false;

    let addable = true;
    let max_items = getKeyword(schema, 'max_items', 'maxItems') || 100;
    if (data.length >= max_items)
        addable = false;

    let isRef = schema.items.hasOwnProperty('$ref');

    if (isRef)
        schema.items = args.getRef(schema.items['$ref']);

    let type = normalizeKeyword(schema.items.type);

    let nextArgs = {
        schema: schema.items,
        onChange: onChange,
        onAdd: onAdd,
        onRemove: onRemove,
        level: level + 1,
        removable: removable,
        onMove: onMove,
        onEdit: onEdit,
        onKeyEdit: args.onKeyEdit,
        parentType: 'array',
        getRef: args.getRef,
        errorMap: args.errorMap,
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
            nextArgs.name = joinCoords(name, i);

            if (i === 0)
                nextArgs.onMoveUp = null;
            else
                nextArgs.onMoveUp = (e) => onMove(joinCoords(name, i), joinCoords(name, i - 1));

            if (i === data.length - 1)
                nextArgs.onMoveDown = null;
            else
                nextArgs.onMoveDown = (e) => onMove(joinCoords(name, i), joinCoords(name, i + 1));

            if (type === 'array') {
                groups.push(getArrayFormRow(nextArgs));
            } else if (type === 'object') {
                groups.push(getObjectFormRow(nextArgs));
            } else {
                // oneOf/anyOf
                if (schema.items.hasOwnProperty('oneOf')) {
                    groups.push(<OneOf parentArgs={args} nextArgs={{...nextArgs}} key={"oneOf_" + name + '_' + i} />);
                } else if (schema.items.hasOwnProperty('anyOf')) {
                    groups.push(<AnyOf parentArgs={args} nextArgs={{...nextArgs}} key={"anyOf_" + name + '_' + i} />);
                } else {
                    rows.push(getStringFormRow(nextArgs));
                }
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
                onAdd={() => onAdd(getBlankData(schema.items, args.getRef), coords)}
                editable={args.editable}
                onEdit={args.onKeyEdit}
                key={'row_group_' + name}
            >
                {rows}
            </FormGroup>
        );

        if (args.parentType === 'object' && args.removable) {
            rows = (
                <div className="rjf-form-group-wrapper" key={'row_group_wrapper_' + name}>
                    <FormRowControls
                        onRemove={(e) => onRemove(name)}
                    />
                    {rows}
                </div>
            );
        }
    }

    let groupError = args.errorMap[getCoordsFromName(coords)];
    if (typeof groupError === 'string')
        groupError = [groupError];

    if (groups.length) {
        let groupTitle = schema.title ? <GroupTitle editable={args.editable} onEdit={args.onKeyEdit}>{schema.title}</GroupTitle> : null;

        groups = (
            <div key={'group_' + name} className="rjf-form-group-wrapper">
                {args.parentType === 'object' && args.removable &&
                    <FormRowControls
                        onRemove={(e) => onRemove(name)}
                    />
                }
                <div className="rjf-form-group">
                    <div className={level > 0 ? "rjf-form-group-inner" : ""}>
                        {groupTitle}
                        {groupError && groupError.map((error, i) => <div className="rjf-error-text" key={i}>{error}</div>)}
                        {groups.map((i, index) => (
                            <div className="rjf-form-group-wrapper" key={'group_wrapper_' + name + '_' + index}>
                                <FormRowControls
                                    onRemove={removable ? (e) => onRemove(joinCoords(name, index)) : null}
                                    onMoveUp={index > 0 ? (e) => onMove(joinCoords(name, index), joinCoords(name, index - 1)) : null}
                                    onMoveDown={index < groups.length - 1 ? (e) => onMove(joinCoords(name, index), joinCoords(name, index + 1)) : null}
                                />
                                {i}
                            </div>
                            )
                        )}
                        {addable && 
                            <Button
                                className="add"
                                onClick={(e) => onAdd(getBlankData(schema.items, args.getRef), coords)}
                                title="Add new item"
                            >
                                Add item
                            </Button>
                        }
                    </div>
                </div>
            </div>
        )
    }

    return [...rows, ...groups];
}


export function getObjectFormRow(args) {
    let {data, schema, name, onChange, onAdd, onRemove, onMove, onEdit, level} = args;

    let rows = [];

    let schema_keys = getKeyword(schema, 'keys', 'properties', {});

    if (schema.hasOwnProperty('allOf')) {
        for (let i = 0; i < schema.allOf.length; i++) {
            schema_keys = {...schema_keys, ...getKeyword(schema.allOf[i], 'keys', 'properties', {})};
        }
    }

    let keys = [...Object.keys(schema_keys)];


    if (schema.additionalProperties)
        keys = [...keys, ...Object.keys(data).filter((k) => keys.indexOf(k) === -1)];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = data[key];
        let childName = joinCoords(name, key);
        let schemaValue = schema_keys.hasOwnProperty(key) ? {...schema_keys[key]} : undefined;

        if (typeof schemaValue === 'undefined') {
            // for keys added through additionalProperties
            if (typeof schema.additionalProperties === 'boolean')
                schemaValue = {type: 'string'};
            else
                schemaValue = {...schema.additionalProperties};
        }

        let isRef = schemaValue.hasOwnProperty('$ref');

        if (isRef)
            schemaValue = args.getRef(schemaValue['$ref']);

        let type = normalizeKeyword(schemaValue.type);

        if (!schemaValue.title || (isRef && schema.additionalProperties)) // for additionalProperty refs, use the key as the title
            schemaValue.title = getVerboseName(key);

        let removable = false;
        if (schema_keys[key] === undefined)
            removable = true;

        if (schema.hasOwnProperty('required') && Array.isArray(schema.required)) {
            if (schema.required.indexOf(key) > -1)
                schemaValue['required'] = true;
        }

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
            onEdit: onEdit,
            parentType: 'object',
            getRef: args.getRef,
            errorMap: args.errorMap,
        };

        nextArgs.onKeyEdit = () => handleKeyEdit(data, key, value, childName, onEdit);
        nextArgs.editable = removable;

         if (type === 'array') {
            rows.push(getArrayFormRow(nextArgs));
        } else if (type === 'object') {
            rows.push(getObjectFormRow(nextArgs));
        } else {
            // oneOf/anyOf
            if (nextArgs.schema.hasOwnProperty('oneOf')) {
                rows.push(<OneOf parentArgs={args} nextArgs={{...nextArgs}} key={"oneOf_" + name + '_' + i} />);
            } else if (nextArgs.schema.hasOwnProperty('anyOf')) {
                rows.push(<AnyOf parentArgs={args} nextArgs={{...nextArgs}} key={"anyOf_" + name + '_' + i} />);
            } else {
                rows.push(getStringFormRow(nextArgs));
            }
        }
    }

    // oneOf
    if (schema.hasOwnProperty('oneOf')) {
        rows.push(<OneOf parentArgs={args} key={"oneOf_" + name} />);
    }

    // anyOf
    if (schema.hasOwnProperty('anyOf')) {
        rows.push(<AnyOf parentArgs={args} key={"anyOf_" + name} />);
    }

    if (rows.length || schema.additionalProperties) {
        let coords = name;
        let groupError = args.errorMap[getCoordsFromName(coords)];
        if (typeof groupError === 'string')
            groupError = [groupError];

        rows = (
            <FormGroup
                level={level}
                schema={schema}
                addable={schema.additionalProperties}
                onAdd={() => handleKeyValueAdd(data, coords, onAdd, schema.additionalProperties, args.getRef)}
                editable={args.editable}
                onEdit={args.onKeyEdit}
                key={'row_group_' + name}
            >
                {groupError && groupError.map((error, i) => <div className="rjf-error-text" key={i}>{error}</div>)}
                {rows}
            </FormGroup>
        );
        if (args.parentType === 'object' && args.removable) {
            rows = (
                <div className="rjf-form-group-wrapper" key={'row_group_wrapper_' + name}>
                    <FormRowControls
                        onRemove={(e) => onRemove(name)}
                    />
                    {rows}
                </div>
            );
        }

    }

    return rows;
}


export function getOneOfFormRow(args) {
    /* For top-level oneOf when type is not provided.

    This will try to find appropriate option for the given data.
    */
    return <OneOfTopLevel args={args} />;
}


export function getAnyOfFormRow(args) {
    /* For top-level oneOf when type is not provided */
    return <OneOfTopLevel args={args} schemaName="anyOf" />;
}


export function getAllOfFormRow(args) {
    /* For top-level oneOf when type is not provided */

    // currently we only suuport allOf inside an object.
    // so we'll render it as an object

    return getObjectFormRow(args);
}


class OneOfTopLevel extends React.Component {
    constructor(props) {
        super(props);

        this.schemaName = this.props.schemaName || 'oneOf';

        // Uncomment when caching is implemented
        //
        // this.state = {
        //     option: this.findSelectedOption(),
        // };
    }

    findSelectedOption = () => {
        /* Returns index of currently selected option.
         * It's a hard problem to reliably find the selected option for
         * the given data.
        */
        let dataType = actualType(this.props.args.data);
        let subschemas = this.props.args.schema[this.schemaName];

        return findMatchingSubschemaIndex(
            this.props.args.data,
            this.props.args.schema,
            this.props.args.getRef,
            this.schemaName
        );
    }

    getOptions = () => {
        return this.props.args.schema[this.schemaName].map((option, index) => {
            return {label: option.title || 'Option ' + (index + 1), value: index};
        });
    }

    getSchema = (index) => {
        if (index === undefined)
            index = this.state.option;

        let schema = this.props.args.schema[this.schemaName][index];

        let isRef = schema.hasOwnProperty('$ref');

        if (isRef)
            schema = this.props.args.getRef(schema['$ref']);

        return schema;
    }

    handleOptionChange = (e) => {
        this.updateData(this.getSchema(e.target.value));

        // Uncomment when caching is reimplemented
        //
        // this.setState({
        //     option: e.target.value
        // });
    }

    updateData(newSchema) {
        this.props.args.onChange(
            this.props.args.name,
            getBlankData(newSchema, this.props.args.getRef)
        );
    }

    render() {
        /* Perfomance note:
         *
         * In order to resolve https://github.com/bhch/react-json-form/issues/67,
         * we will not cache the selected option. Instead, we'll recalculate the
         * selected option on every render.
         *
         * If there're serious performance issues, we'll reconsider caching.
        */
        let selectedOption = this.findSelectedOption();

        let schema = this.getSchema(selectedOption);
        let type = getSchemaType(schema);
        let args = this.props.args;
        let rowFunc;

        if (type === 'object') {
            rowFunc = getObjectFormRow;
        } else if (type === 'array') {
            rowFunc = getArrayFormRow;
        } else {
            rowFunc = getStringFormRow;
            args.removable = false;
            args.onMoveUp = null;
            args.onMoveDown = null;

            if (Array.isArray(args.data) || typeof args.data === 'object')
                args.data = null;
        }

        let rows = rowFunc({...args, schema: schema});

        let selectorLabel = this.props.args.schema.title || null;

        return (
            <div className="rjf-form-group rjf-oneof-group rjf-oneof-group-top-level">
                <div className="rjf-oneof-selector">
                    <FormSelectInput
                        value={selectedOption}
                        options={this.getOptions()}
                        onChange={this.handleOptionChange}
                        className="rjf-oneof-selector-input"
                        label={selectorLabel}
                    />
                </div>
                {rows}
            </div>
        );
    }
}


class OneOf extends React.Component {
    constructor(props) {
        super(props);

        this.schemaName = this.props.schemaName || 'oneOf';

        // Uncomment when caching is implemented
        //
        // this.state = {
        //     option: this.findSelectedOption(),
        // };
    }

    /* Uncomment when caching is implemente

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.nextArgs || this.props.nextArgs) {
            let prevDataType = 'string';
            let newDataType = 'string';
            if (prevProps.nextArgs)
                prevDataType = actualType(prevProps.nextArgs.data);
            if (this.props.nextArgs)
                newDataType = actualType(this.props.nextArgs.data);

            if (prevDataType !== newDataType)
                this.setState({option: this.findSelectedOption()});
        }
    }
    */

    findSelectedOption = () => {
        /* Returns index of currently selected option.
         * It's a hard problem to reliably find the selected option for
         * the given data.
        */
        let index = 0;

        if (this.props.nextArgs) {
            let dataType = actualType(this.props.nextArgs.data);
            let subschemas = this.props.nextArgs.schema[this.schemaName];

            for (let i = 0; i < subschemas.length; i++) {
                let subschema = subschemas[i];
                let isRef = subschema.hasOwnProperty('$ref');

                if (isRef)
                    subschema = this.props.parentArgs.getRef(subschema['$ref']);

                let subType = getSchemaType(subschema);

                if (dataType === 'number') {
                    if (subType === 'number' || subType === 'integer') {
                        index = i;
                        break;
                    }
                } else if (dataType === 'null' && ['boolean', 'integer', 'number'].indexOf(subType) > -1) {
                    index = i;
                    break;
                } else if (dataType === 'object') {
                    // check if all keys match
                    if (dataObjectMatchesSchema(this.props.nextArgs.data, subschema)) {
                        index = i;
                        break;
                    }
                } else if (dataType === 'array') {
                    // check if item types match
                    if (dataArrayMatchesSchema(this.props.nextArgs.data, subschema)) {
                        index = i;
                        break;
                    }
                } else if (dataType === subType) {
                    index = i;
                    break;
                }
            }
        } else {
            let data = this.props.parentArgs.data;
            let dataType = actualType(data);

            let subschemas = this.props.parentArgs.schema[this.schemaName];

            if (subschemas === undefined)
                return index;

            for (let i = 0; i < subschemas.length; i++) {
                let subschema = subschemas[i];
                let subType = getSchemaType(subschema);

                if (subType !== dataType)
                    continue;

                if (dataType === 'object') {
                    if (dataObjectMatchesSchema(data, subschema)) {
                        index = i;
                        break;
                    }

                } else if (dataType === 'array') {
                    // check if all items in data match the items type
                    // strangely enough, haven't found a schema case
                    // which triggers this condition.
                    // for the time being, let's just throw an error if
                    // this runs and ask the user to report the error
                    throw new Error(
                        "Unexpected block (#1) tirggered. " +
                        "If you see this error, you've found a rare schema. " +
                        "Please report this issue on our Github."
                    );
                }
            }
        }

        return index;
    }

    getOptions = () => {
        let parentType = this.getParentType();

        if (parentType === 'object') {
            let schema;
            if (this.props.nextArgs) {
                // this is an object key which has oneOf keyword
                schema = this.props.nextArgs.schema;
            } else {
                schema = this.props.parentArgs.schema;
            }

            return schema[this.schemaName].map((option, index) => {
                return {label: option.title || 'Option ' + (index + 1), value: index};
            });
        } else if (parentType === 'array') {
            return this.props.parentArgs.schema.items[this.schemaName].map((option, index) => {
                return {label: option.title || 'Option ' + (index + 1), value: index};
            });
        }

        return [];
    }

    getSchema = (index) => {
        if (index === undefined)
            index = this.state.option;

        let parentType = this.getParentType();

        let schema;

        if (parentType === 'object') {
            if (this.props.nextArgs) {
                // this is an object key which has oneOf keyword
                schema = {...this.props.nextArgs.schema[this.schemaName][index]};
                if (!schema.title)
                    schema.title = this.props.nextArgs.schema.title;
            } else {
                schema = this.props.parentArgs.schema[this.schemaName][index];
            }
        } else if (parentType === 'array') {
            schema = this.props.parentArgs.schema.items[this.schemaName][index];
        } else {
            schema = {'type': 'string'};
        }

        let isRef = schema.hasOwnProperty('$ref');

        if (isRef)
            schema = this.props.parentArgs.getRef(schema['$ref']);

        return schema;
    }

    getParentType = () => {
        return getSchemaType(this.props.parentArgs.schema);
    }

    handleOptionChange = (e, selectedOption) => {
        this.updateData(this.getSchema(selectedOption), this.getSchema(e.target.value));
        // Uncomment when caching is implemented
        //
        // this.setState({
        //     option: e.target.value
        // });
    }

    updateData(oldSchema, newSchema) {
        let parentType = this.getParentType();
        /*
            If parent is an object,
                then all subschemas in oneOf must be objects containing properties
                of the parent object
                otherwise, it's an error

            If parent is an array,
                then the subschemas in oneOf can be anything.
        */

        if (parentType === 'object' && !this.props.nextArgs) {
            let name = this.props.parentArgs.name;
            let schema = newSchema;
            let data = this.props.parentArgs.data;
            let schemaProperties = getKeyword(schema, 'properties', 'keys', {});

            // keys to remove
            let remove = [...Object.keys(getKeyword(oldSchema, 'properties', 'keys'))];

            // keys to add
            let add = [...Object.keys(getKeyword(schema, 'properties', 'keys'))];

            let newData = {};

            for (let key in data) {
                if (!data.hasOwnProperty(key))
                    continue;

                if (remove.indexOf(key) > -1)
                    continue;

                newData[key] = data[key];
            }


            add.forEach((key, index) => {
                newData[key] = getBlankData(schemaProperties[key], this.props.parentArgs.getRef);
            });

            this.props.parentArgs.onChange(name, newData);
        } else if (parentType === 'array' || this.props.nextArgs) {
            let name = this.props.nextArgs.name;
            let schema = newSchema;
            let data = this.props.nextArgs.data;

            this.props.parentArgs.onChange(name, getBlankData(schema, this.props.parentArgs.getRef));
        }
    }

    render() {
        /* Perfomance note:
         *
         * In order to resolve https://github.com/bhch/react-json-form/issues/67,
         * we will not cache the selected option. Instead, we'll recalculate the
         * selected option on every render.
         *
         * If there're serious performance issues, we'll reconsider caching.
        */
        let selectedOption = this.findSelectedOption();

        let schema = this.getSchema(selectedOption);
        let type = getSchemaType(schema);
        let args = this.props.nextArgs ? this.props.nextArgs : this.props.parentArgs;
        let rowFunc;

        if (type === 'object') {
            rowFunc = getObjectFormRow;
            if (typeof args.data != 'object' || args.data === null)
                args.data = {};

        } else if (type === 'array') {
            rowFunc = getArrayFormRow;
            if (!Array.isArray(args.data))
                args.data = [];
        } else {
            rowFunc = getStringFormRow;
            args.removable = false;
            args.onMoveUp = null;
            args.onMoveDown = null;

            if (Array.isArray(args.data) || typeof args.data === 'object')
                args.data = null;
        }

        let rows = rowFunc({...args, schema: schema});

        let selectorLabel = null;
        if (this.props.nextArgs)
            selectorLabel = this.props.nextArgs.schema.title || null;

        return (
            <div className="rjf-form-group rjf-oneof-group">
                <div className="rjf-oneof-selector">
                    <FormSelectInput
                        value={selectedOption}
                        options={this.getOptions()}
                        onChange={(e) => this.handleOptionChange(e, selectedOption)}
                        className="rjf-oneof-selector-input"
                        label={selectorLabel}
                    />
                </div>

                {rows}
            </div>
        );
    }
}


function AnyOf(props) {
    return <OneOf {...props} schemaName="anyOf" />;
};


function handleKeyValueAdd(data, coords, onAdd, newSchema, getRef) {
    let key = prompt("Add new key");
    if (key === null) // clicked cancel
        return;

    if (newSchema === true)
        newSchema = {type: 'string'};

    key = key.trim();
    if (!key)
        alert("(!) Can't add empty key.\r\n\r\n‎");
    else if (data.hasOwnProperty(key))
        alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");
    else
        onAdd(getBlankData(newSchema, getRef), joinCoords(coords, key));
}


function handleKeyEdit(data, key, value, coords, onEdit) {
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

    let newCoords = splitCoords(coords);
    newCoords.pop();
    newCoords.push(newKey);
    newCoords = joinCoords.apply(null, newCoords);


    onEdit(value, newCoords, coords);
}
