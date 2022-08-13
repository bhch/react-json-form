import React from 'react';
import ReactDOM from 'react-dom';
import EditorState from './editorState';
import ReactJSONForm from './form';


export function FormInstance(config) {
    this.containerId = config.containerId;
    this.dataInputId = config.dataInputId;

    this.schema = config.schema;
    this.data = config.data;
    this.fileHandler = config.fileHandler;
    this.fieldName = config.fieldName;
    this.modelName = config.modelName;

    this.eventListeners = null;

    this.addEventListener = function(event, listener) {
        if (this.eventListeners === null)
            this.eventListeners = {};

        if (!this.eventListeners.hasOwnProperty(event))
            this.eventListeners[event] = new Set();

        this.eventListeners[event].add(listener);
    };

    this.onChange = function(e) {
        if (!this.eventListeners)
            return;

        if (!this.eventListeners.hasOwnProperty('change') || !this.eventListeners.change.size)
            return;

        this.eventListeners.change.forEach((cb) => cb(e));
    };
    this.onChange = this.onChange.bind(this);

    this.render = function() {
        try {
            ReactDOM.render(
                <FormContainer
                    schema={this.schema}
                    dataInputId={this.dataInputId}
                    data={this.data}
                    fileHandler={this.fileHandler}
                    fieldName={this.fieldName}
                    modelName={this.modelName}
                    onChange={this.onChange}
                />,
                document.getElementById(this.containerId)
            );
        } catch (error) {
            ReactDOM.render(
                <ErrorReporter error={error} />,
                document.getElementById(this.containerId)
            );
        }
    };

    this.update = function(config) {
        this.schema = config.schema || this.schema;
        this.data = config.data || this.data;

        this.render();
    };
}


const FORM_INSTANCES = {};

export function createForm(config) {
    let instance = new FormInstance(config);

    // save a reference to the instance
    FORM_INSTANCES[config.containerId] = instance;

    return instance;
}


export function getFormInstance(id) {
    return FORM_INSTANCES[id];
}


export class FormContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            editorState: EditorState.create(props.schema, props.data)
        };

        this.prevEditorState = this.state.editorState;

        this.dataInput = document.getElementById(props.dataInputId);
    }

    componentDidMount() {
        this.populateDataInput(this.state.editorState.getData());
    }

    componentDidUpdate(prevProps, prevState) {

        if (this.props.schema !== prevProps.schema) {
            let newSchema = this.props.schema;
            let newData = this.props.data !== prevProps.data ? this.props.data : this.state.editorState.getData();
            this.setState({
                editorState: EditorState.create(newSchema, newData)
            });

            return;
        }

        if (this.props.data !== prevProps.data) {
            this.setState({
                editorState: EditorState.update(this.state.editorState, this.props.data)
            });

            return;
        }

        if (this.state.editorState !== prevState.editorState)
            this.populateDataInput(this.state.editorState.getData());

        if (this.props.onChange && this.state.editorState !== prevState.editorState)
            this.props.onChange({
                schema: this.state.editorState.getSchema(),
                data: this.state.editorState.getData(),
                prevSchema: prevState.editorState.getSchema(),
                prevData: prevState.editorState.getData()
            });
    }

    populateDataInput = (data) => {
        this.dataInput.value = JSON.stringify(data);
    }

    handleChange = (editorState) => {
        this.setState({editorState: editorState});
    }

    render() {
        return (
             <ReactJSONForm
                editorState={this.state.editorState}
                onChange={this.handleChange}
                fileHandler={this.props.fileHandler}
                fieldName={this.props.fieldName}
                modelName={this.props.modelName}
            />
        );
    }
}


function ErrorReporter(props) {
    /* Component for displaying errors to the user related for schema */

    return (
        <div style={{color: '#f00'}}>
            <p>(!) {props.error.toString()}</p>
            <p>Check browser console for more details about the error.</p>
        </div>
    );
}
