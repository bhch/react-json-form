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
    else {
        return getBlankObject(schema);
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

function getStringFormRow(data, name, onChange) {
    return (
        <div className="rjf-form-row" key={name}>
            <FormInput 
                name={name}
                label={"label"}
                value={data}
                onChange={onChange}
                type="text"
            />
        </div>
    );
}

function getArrayFormRow(data, schema, name, onChange) {
    let rows = [];

    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        let childName = name + '-' + i;
        if (schema.items.type === 'string') {
            rows.push(getStringFormRow(item, childName, onChange));
        } else if (schema.items.type === 'array') {
            rows.push(getArrayFormRow(item, schema.items, childName, onChange));
        } else if (schema.items.type === 'object') {
            rows.push(getObjectFormRow(item, schema.items, childName, onChange));
        }
    }

    return rows;
}


function getObjectFormRow(data, schema, name, onChange) {
    let rows = [];

    for (let key in schema.keys) {
        let value = data[key];
        let schemaValue = schema.keys[key];
        let childName = name + '-' + key;

         if (schemaValue.type === 'string') {
            rows.push(getStringFormRow(value, childName, onChange));
        } else if (schemaValue.type === 'array') {
            rows.push(getArrayFormRow(value, schemaValue, childName, onChange));
        } else if (schemaValue.type === 'object') {
            rows.push(getObjectFormRow(value, schemaValue, childName, onChange));
        }
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
    name = name.replace(/_/g, ' ');
    return capitalize(name);
}

export default class Form extends React.Component {
    constructor(props) {
        super(props);

        this.dataInput = document.getElementById(this.props.dataInputId);
        this.schema = getDefaultSchema(props.schema);

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
            console.log(coords, data, value)
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
            return getArrayFormRow(data, this.schema, 'rjf', this.handleChange);
        } else if (this.schema.type === 'object') {
            return getObjectFormRow(data, this.schema, 'rjf', this.handleChange);
        }

        return formGroups;
    }

    _getFields = () => {
        let data = this.state.data;
        if (this.schema.type === 'object')
            data = [data];

        let formGroups = [];

        for (let i = 0; i < data.length; i++) {
            let item = data[i];

            let formRows = [];

            for (let key in item) {
                if (!item.hasOwnProperty(key))
                    continue;

                let schemaObject = this.schema.fields[key];

                if (!schemaObject) {
                    // this item is in data but not in schema
                    continue;
                }

                let name = key;
                let value = item[key];
                let label = schemaObject.verbose_name || getVerboseName(key);

                let Field = FIELD_MAP[schemaObject.type];

                formRows.push(
                    <div className="rjf-form-row" key={name + '_' + i}>
                        <Field 
                            name={name}
                            label={label}
                            value={value}
                            onChange={(e) => this.handleChange(e, i)}
                            type={schemaObject.type}
                        />
                    </div>
                )
            }

            let formGroupKey = 'form_group_' + i;

            formGroups.push(
                <div className="rjf-form-group" key={formGroupKey}>
                    {this.canRemove() && 
                        <button 
                            className="rjf-remove-form-group-button" 
                            type="button"
                            onClick={(e) => this.removeFieldset(e, i)}
                            title="Remove"
                        >
                            Remove
                        </button>
                    }
                    {formRows}
                </div>
            );
        }

        return formGroups;
    }

    addFieldset = (e) => {
        this.setState((state) => {
            let data = [...state.data];
            data.push(getBlankItem(this.schema));

            return {data: data};
        });
    }

    removeFieldset = (e, index) => {
        this.setState((state) => {
            return {data: state.data.filter((item, idx) => idx !== index)};
        });
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
                    {this.canAdd() && 
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

    if (!label)
        label = props.name.toUpperCase();

    if (props.type === 'string')
        props.type = 'text'

    return (
        <div>
            <label>{label}</label>
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