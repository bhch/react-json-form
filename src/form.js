import {capitalize} from './util';


function getBlankItem(schema) {
    let dataObject = {};

    for (let key in schema.items) {
        let item = schema.items[key];

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

        this.schema = getDefaultSchema(props.schema)

        this.state = {
            value: '',
            data: props.data
        };

        this.dataInput = document.getElementById(this.props.dataInputId);

        if (!props.data) {
            // create empty data from schema
            this.state.data = getBlankData(this.schema);
            this.populateDataInput();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.data !== prevState.data) {
            this.populateDataInput();
        }
    }

    populateDataInput = () => {
        this.dataInput.value = JSON.stringify(this.state.data, null, 2);
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

        let fieldsets = [];

        for (let i = 0; i < data.length; i++) {
            let item = data[i];

            let fieldset = [];

            for (let key in item) {
                let schemaObject = this.schema.items[key];

                let name = key;
                let value = item[key];
                let label = schemaObject.verbose_name || getVerboseName(key);

                let Field = FIELD_MAP[schemaObject.type];

                fieldset.push(
                    <Field
                        key={name} 
                        name={name}
                        label={label}
                        value={value}
                        onChange={(e) => this.handleChange(e, i)}
                        type={schemaObject.type}
                    />
                )
            }

            let fieldsetKey = 'fieldset_' + i;

            fieldsets.push(
                <div className="je-fieldset" key={fieldsetKey}>
                    {this.canRemove() && 
                        <button 
                            className="je-remove-fieldset-button" 
                            onClick={(e) => this.removeFieldset(e, i)}
                        >
                            &times;
                        </button>
                    }
                    {fieldset}
                </div>
            );
        }

        return fieldsets;
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
            <div>
                {this.getFields()}
                {this.canAdd() && 
                    <button type="button" onClick={this.addFieldset}>+ Add more</button>
                }
                <pre>{JSON.stringify(this.schema, null, 2)}</pre>
            </div>
        );
    }
}



function FormInput({label, help_text, error, ...props}) {

    if (!label)
        label = props.name.toUpperCase();

    return (
        <div className="je-form-group">
            <label>{label}</label>
            <input {...props} />
        </div>
    );
}


function CheckInput({label, help_text, error, ...props}) {

    if (!label)
        label = props.name.toUpperCase();

    if (props.type === 'bool')
        props.type = 'checkbox';

    return (
        <div className="je-form-group">
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