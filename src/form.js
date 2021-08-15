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


function getBlankData(schema) {
    if (schema.data_type === 'array') {
        let data = [];
        let min_items = schema.min_items || 1; // add 1 item if min_items is 0

        while (data.length < min_items) {
            data.push(getBlankItem(schema));
        }
        return data;
    }
    else {
        return getBlankItem(schema);
    }
}

function getSyncedData(data, schema) {
    // adds those keys to data which are in schema but not in data

    let blankItem = getBlankItem(schema);

    if (schema.data_type === 'object') {
        return {...blankItem, ...data};
    } else if (schema.data_type === 'array') {
        for (let i = 0; i < data.length; i++) {
            data[i] = {...blankItem, ...data[i]};
        }
    }

    return data;
}

function getDefaultSchema(schema) {
    let defaults = {
        min_items: 1,
        max_items: schema.data_type === 'array' ? 1000 : 1,
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
            data = getSyncedData(data, this.schema);
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

    handleChange = (e, index) => {
        let data;

        if (Array.isArray(this.state.data)) {
            data = [...this.state.data];
        } else {
            data = [{...this.state.data}];
        }

        let value = '';

        if (e.target.type === 'checkbox') {
            value = e.target.checked;
        } else {
            value = e.target.value;
        }

        data[index][e.target.name] = value;

        if (this.schema.data_type === 'object')
            data = data[0];

        this.setState({
            data: data,
        });
    }

    getFields = () => {
        let data = this.state.data;
        if (this.schema.data_type === 'object')
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
        if (this.schema.data_type === 'object')
            return false;

        if (this.state.data.length >= this.schema.max_items) {
            return false;
        }

        return true;
    }

    canRemove = () => {
        if (this.schema.data_type === 'object')
            return false;

        if (this.state.data.length <= this.schema.min_items)
            return false;

        return true;
    }

    render() {
        return (
            <div className="rjf-form-wrapper">
                <fieldset className="module aligned">
                    {this.getFields()}
                    {this.canAdd() && 
                        <button type="button" onClick={this.addFieldset} className="rjf-add-button">Add more</button>
                    }
                </fieldset>
            </div>
        );
    }
}



function FormInput({label, help_text, error, ...props}) {

    if (!label)
        label = props.name.toUpperCase();

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
    text: FormInput,
    number: FormInput,
    email: FormInput,
    file: FileInput,
    bool: CheckInput
};