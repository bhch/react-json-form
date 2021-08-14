import Form from './form';


export default function JSONForm(config) {
    this.containerId = config.containerId;
    this.dataInputId = config.dataInputId;
    this.schema = config.schema;
    this.data = config.data;

    this.render = function() {
        ReactDOM.render(
            <Form
                schema={this.schema}
                dataInputId={this.dataInputId}
                data={this.data}
            />,
            document.getElementById(this.containerId)
        );
    }
}