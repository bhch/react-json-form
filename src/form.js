import {capitalize} from './util';


function getBlankItem(schema) {
    let dataObject = {};

    for (let key in schema.fields) {
        if (!schema.fields.hasOwnProperty(key))
            continue;

        let item = schema.fields[key];

        dataObject[key] = '';
    }

    return dataObject;
}


function getBlankObject(schema) {
    let keys = {};

    for (let key in schema.keys) {
        let value = schema.keys[key];
        let type = value.type;

        if (type === 'string')
            keys[key] = ''; 
        else if (type === 'array')
            keys[key] = getBlankArray(value);
        else if (type === 'object')
            keys[key] = getBlankObject(value);
    }

    return keys;
}


function getBlankArray(schema) {
    let items = [];
    let type = schema.items.type;

    if (type === 'string')
        items.push('');
    else if (type === 'array')
        items.push(getBlankArray(schema.items))
    else if (type === 'object')
        items.push(getBlankObject(schema.items));

    return items;
}


function getBlankData(schema) {
    if (schema.type === 'array') {
        return getBlankArray(schema);
    }
    else if (schema.type === 'object') {
        return getBlankObject(schema);
    } else if (schema.type === 'string') {
        return '';
    }
}

function getSyncedData(data, schema) {
    // adds those keys to data which are in schema but not in data

    let blankItem = getBlankItem(schema);

    if (schema.type === 'object') {
        return {...blankItem, ...data};
    } else if (schema.type === 'array') {
        for (let i = 0; i < data.length; i++) {
            data[i] = {...blankItem, ...data[i]};
        }
    }

    return data;
}

function getStringFormRow(data, schema, name, onChange, onRemove, removable) {
    return (
        <div className="rjf-form-row" key={name}>
            {removable && 
                <button 
                    type="button"
                    className="rjf-remove-button"
                    onClick={(e) => onRemove(name)}
                >
                    &times;
                </button>
            }
            <div className="rjf-form-row-inner">
                <FormInput 
                    name={name}
                    label={schema.title}
                    value={data}
                    onChange={onChange}
                    type="text"
                />
            </div>
        </div>
    );
}

function getArrayFormRow(data, schema, name, onChange, onAdd, onRemove, level) {
    let rows = [];
    let groups = [];

    let groupTitle = schema.title ? <div className="rjf-form-group-title">{schema.title}</div> : null;


    /*
    if (!data) {
        if (level === 0) {
            return (
                <div className="rjf-form-group" key={'row_' + name}>
                    {groupTitle}
                <button type="button" className="rjf-add-button">+ Add item</button>
                </div>
            );
        } else {
            return (
                <div className="rjf-form-group" key={'row_' + name}>
                    <div className="rjf-form-group-inner">
                    {groupTitle}
                <button type="button" className="rjf-add-button">+ Add item</button>
                </div>
                </div>
            );
        }
    }
    */

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

        if (schema.items.type === 'string') {
            rows.push(getStringFormRow(item, schema.items, childName, onChange, onRemove, removable));
        } else if (schema.items.type === 'array') {
            groups.push(getArrayFormRow(item, schema.items, childName, onChange, onAdd, onRemove, level + 1));
        } else if (schema.items.type === 'object') {
            groups.push(getObjectFormRow(item, schema.items, childName, onChange, onAdd, onRemove, level + 1));
        }
    }

    let coords = name; // coordinates for insertion and deletion

    if (!rows.length && !groups.length) {
        let className = "rjf-form-group-inner";
        if (level === 0)
            className = "";
        return (
            <div className="rjf-form-group" key={'row_' + name}>
                {level === 0 && groupTitle}
                <div className={className}>
                    {level > 0 && groupTitle}
                    <button 
                        type="button"
                        className="rjf-add-button"
                        onClick={(e) => onAdd(getBlankData(schema.items), coords)}
                    >
                        + Add item
                    </button>
                </div>
            </div>
        );
    }

    if (rows.length) {
        rows = (
            <div className="rjf-form-group" key={'row_' + name}>
                {level === 0 && groupTitle}
                <div className="rjf-form-group-inner">
                    {level > 0 && groupTitle}
                    {rows}
                    {addable && 
                        <button 
                            type="button"
                            className="rjf-add-button"
                            onClick={(e) => onAdd(getBlankData(schema.items), coords)}
                        >
                            + Add item
                        </button>
                    }
                </div>
            </div>
        );
    }

    if (groups.length) {
        groups = (
            <div key={'group_' + name}>
                {groupTitle}
                {groups.map((i, index) => (
                    <div className="rjf-form-group-wrapper">
                        {removable && 
                            <button 
                                type="button"
                                className="rjf-remove-button"
                                onClick={(e) => onRemove(name + '-' + index)}
                            >
                                &times;
                            </button>
                        }
                        {i}
                    </div>
                    )
                )}
                {addable && 
                    <button 
                        type="button"
                        className="rjf-add-button"
                        onClick={(e) => onAdd(getBlankData(schema.items), coords)}
                    >
                        + Add Group Array
                    </button>
                }
            </div>
        )
    }

    return [...rows, ...groups];
}


function getObjectFormRow(data, schema, name, onChange, onAdd, onRemove, level) {
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

         if (schemaValue.type === 'string') {
            rows.push(getStringFormRow(value, schemaValue, childName, onChange, onRemove, removable));
        } else if (schemaValue.type === 'array') {
            rows.push(getArrayFormRow(value, schemaValue, childName, onChange, onAdd, onRemove, level + 1));
        } else if (schemaValue.type === 'object') {
            rows.push(getObjectFormRow(value, schemaValue, childName, onChange, onAdd, onRemove, level + 1));
        }
    }

    let groupTitle = schema.title ? <div className="rjf-form-group-title">{schema.title}</div> : null;

    let coords = name;

    if (rows.length) {
        rows = (
            <div className="rjf-form-group" key={name}>
                {level === 0 && groupTitle}
                <div className="rjf-form-group-inner">
                    {level > 0 && groupTitle}
                    {rows}
                    {schema.additionalProperties && 
                    <button 
                        type="button"
                        className="rjf-add-button"
                        onClick={(e) => onAdd("", coords)}
                    >
                        + Add key value
                    </button>
                    }
                </div>

            </div>
        );
    }

    return rows;
}

function getDefaultSchema(schema) {
    let defaults = {
        min_items: 1,
        max_items: schema.type === 'array' ? 1000 : 1,
    };

    return {...defaults, ...schema};
}

function getVerboseName(name) {
    if (name === undefined || name === null)
        return '';

    name = name.replace(/_/g, ' ');
    return capitalize(name);
}

export default class Form extends React.Component {
    constructor(props) {
        super(props);

        this.dataInput = document.getElementById(this.props.dataInputId);
        this.schema = props.schema; //getDefaultSchema(props.schema);

        let data = props.data;

        if (!data) {
            // create empty data from schema
            data = getBlankData(this.schema);
        } else {
            // if data is stale and schema has new keys,
            // add them to data\
            //data = getSyncedData(data, this.schema);
        }

        this.state = {
            value: '',
            data: data
        };
        
        // update data in the input
        this.populateDataInput();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.data !== prevState.data) {
            this.populateDataInput();
        }
    }

    populateDataInput = () => {
        this.dataInput.value = JSON.stringify(this.state.data);
    }

    handleChange = (e) => {
        /*
            e.target.name is a chain of indices and keys:
            xxx-0-key-1-key2 and so on.
            These can be used as coordinates to locate 
            a particular deeply nested item.

            This first coordinate is not important and should be removed.
        */
        let coords = e.target.name.split('-');

        coords.shift(); // remove first coord

        function setDataUsingCoords(coords, data, value) {
            let coord = coords.shift();
            if (!isNaN(Number(coord)))
                coord = Number(coord);

            if (coords.length) {
                setDataUsingCoords(coords, data[coord], value);
            } else {
                data[coord] = value;
            }
        }

        let _data = JSON.parse(JSON.stringify(this.state.data));

        setDataUsingCoords(coords, _data, e.target.value);

        this.setState({data: _data});
    }

    getFields = () => {
        let data = this.state.data;
        let formGroups = [];

        if (this.schema.type === 'array') {
            return getArrayFormRow(
                data, this.schema, 'rjf',
                this.handleChange, this.addFieldset, this.removeFieldset,
                0
            );
        } else if (this.schema.type === 'object') {
            return getObjectFormRow(
                data, this.schema, 'rjf',
                this.handleChange, this.addFieldset, this.removeFieldset,
                0
            );
        }

        return formGroups;
    }

    addFieldset = (blankData, coords) => {
        coords = coords.split('-');
        coords.shift();

        function addDataUsingCoords(coords, data, value) {
            let coord = coords.shift();
            if (!isNaN(Number(coord)))
                coord = Number(coord);

            if (coords.length) {
                addDataUsingCoords(coords, data[coord], value);
            } else {
                if (Array.isArray(data)) {
                    data.push(value);
                }
                else {
                    if (Array.isArray(data[coord])) {
                        data[coord].push(value);
                    } else {
                        if (coord) {
                            data = data[coord];
                        }
                        let newLen = Object.keys(data).length + 1;
                        data['key_' + newLen] = value;
                    }
                }
            }
        }

        let _data = JSON.parse(JSON.stringify(this.state.data));

        addDataUsingCoords(coords, _data, blankData);

        this.setState({data: _data});
    }

    removeFieldset = (coords) => {
        coords = coords.split('-');
        coords.shift();

        function removeDataUsingCoords(coords, data) {
            let coord = coords.shift();
            if (!isNaN(Number(coord)))
                coord = Number(coord);

            if (coords.length) {
                removeDataUsingCoords(coords, data[coord]);
            } else {
                console.log(coord);
                if (Array.isArray(data))
                    data = data.splice(coord, 1); // in-place mutation
                else
                    delete data[coord];
            }
        }

        let _data = JSON.parse(JSON.stringify(this.state.data));

        removeDataUsingCoords(coords, _data);

        this.setState({data: _data});
    }

    canAdd = () => {
        return true; // temporary

        if (this.schema.type === 'object')
            return false;

        if (this.state.data.length >= this.schema.max_items) {
            return false;
        }

        return true;
    }

    canRemove = () => {
        if (this.schema.type === 'object')
            return false;

        if (this.state.data.length <= this.schema.min_items)
            return false;

        return true;
    }

    getAddButtonText = () => {
        let name = this.schema.verbose_name || getVerboseName(this.schema.name);
        return this.state.data.length > 0 ? 'Add more' : 'Add ' + name;
    }

    render() {
        return (
            <div className="rjf-form-wrapper">
                <fieldset className="module aligned">
                    {this.getFields()}
                    {this.canAdd() && false && 
                        <button type="button" onClick={this.addFieldset} className="rjf-add-button">
                            {this.getAddButtonText()}
                        </button>
                    }
                </fieldset>
            </div>
        );
    }
}



function FormInput({label, help_text, error, ...props}) {

    if (props.type === 'string')
        props.type = 'text'

    return (
        <div>
            {label && <label>{label}</label>}
            <input {...props} />
        </div>
    );
}


function CheckInput({label, help_text, error, value, ...props}) {

    if (!label)
        label = props.name.toUpperCase();

    if (props.type === 'bool')
        props.type = 'checkbox';

    if (props.checked === undefined)
        props.checked = value;

    if (props.checked === '')
        props.checked = false

    return (
        <div>
            <label><input {...props} /> {label}</label>
        </div>
    );
}


function FileInput(props) {
    return <FormInput {...props} />
}


const FIELD_MAP = {
    string: FormInput,
    number: FormInput,
    email: FormInput,
    file: FileInput,
    bool: CheckInput
};