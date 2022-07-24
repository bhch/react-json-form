import Form from './form';


export default function JSONForm(config) {
    this.containerId = config.containerId;
    this.dataInputId = config.dataInputId;
    this.schema = config.schema;
    this.data = config.data;
    this.fileHandler = config.fileHandler;
    this.fieldName = config.fieldName;
    this.modelName = config.modelName;

    this.render = function() {
        ReactDOM.render(
            <Form
                schema={this.schema}
                dataInputId={this.dataInputId}
                data={this.data}
                fileHandler={this.fileHandler}
                fieldName={this.fieldName}
                modelName={this.modelName}
            />,
            document.getElementById(this.containerId)
        );
    }
}