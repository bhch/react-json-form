import Button from './buttons';


export function FormInput({label, help_text, error, inputRef, ...props}) {

    if (props.type === 'string')
        props.type = 'text'

    if (inputRef)
        props.ref = inputRef;

    return (
        <div>
            {label && <label>{label}</label>}
            <input {...props} />
        </div>
    );
}


export function FormCheckInput({label, help_text, error, value, ...props}) {

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


export function FormRadioInput({label, help_text, error, value, options, ...props}) {
    return (
        <div>
            <label>{label}</label>
            {options.map((option, i) => {
                let label, inputValue;
                if (typeof option === 'object') {
                    label = option.label;
                    inputValue = option.value;
                } else {
                    label = option;
                    inputValue = option;
                }

                return (
                    <label key={label + '_' + inputValue + '_' + i}>
                        <input {...props} value={inputValue} checked={inputValue === value} /> {label}
                    </label>
                );
            })}
        </div>
    );
}


export function FormSelectInput({label, help_text, error, value, options, ...props}) {
    return (
        <div>
            {label && <label>{label}</label>}
            <select defaultValue="" {...props}>
                <option disabled value="" key={'__placehlder'}>Select...</option>
                {options.map((option, i) => {
                    let label, inputValue;
                    if (typeof option === 'object') {
                        label = option.label;
                        inputValue = option.value;
                    } else {
                        label = option;
                        inputValue = option;
                    }

                    return (
                        <option value={inputValue} key={label + '_' + inputValue + '_' + i}>
                            {label}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}

export function dataURItoBlob(dataURI) {
      // Split metadata from data
      const splitted = dataURI.split(",");
      // Split params
      const params = splitted[0].split(";");
      // Get mime-type from params
      const type = params[0].replace("data:", "");
      // Filter the name property from params
      const properties = params.filter(param => {
            return param.split("=")[0] === "name";
      });
      // Look for the name and use unknown if no name property.
      let name;
      if (properties.length !== 1) {
            name = "unknown";
      } else {
            // Because we filtered out the other property,
            // we only have the name case here.
            name = properties[0].split("=")[1];
      }

      // Built the Uint8Array Blob parameter from the base64 string.
      const binary = atob(splitted[1]);
      const array = [];
      for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
      }
      // Create the blob object
      const blob = new window.Blob([new Uint8Array(array)], { type });

      return {blob, name};
}



export class FormFileInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            value: props.value,
            fileName: this.getFileName()
        };

        this.inputRef = React.createRef();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.value !== prevProps.value) {
            this.setState({
                value: this.props.value, 
                fileName: this.getFileName()
            });
        }
    }

    getFileName = () => {
        if (!this.props.value)
            return '';

        if (this.props.type === 'data-url') {
            return this.extractFileInfo(this.props.value).name;
        } else if (this.props.type === 'file-url') {
            return this.props.value;
        } else {
            return 'Unknown file';
        }
    }

    extractFileInfo = (dataURL) => {
        const {blob, name} = dataURItoBlob(dataURL);
        return {
            name: name,
            size: blob.size,
            type: blob.type
        }
    }

    addNameToDataURL = (dataURL, name) => {
        return dataURL.replace(';base64', ';name=' + encodeURIComponent(name) + ';base64');
    }

    handleChange = (e) => {
        if (this.props.type === 'data-url') {

        }

        let file = e.target.files[0];
        let fileName = file.name

        let reader = new FileReader();

        reader.onload = () => {

            // this.setState({src: reader.result});

            // we create a fake event object
            let event = {
                target: {
                    type: 'text',
                    value: this.addNameToDataURL(reader.result, fileName),
                    name: this.props.name
                }
            };

            this.props.onChange(event);

        }
        reader.readAsDataURL(file);

    }

    showFileBrowser = () => {
        this.inputRef.current.click();
    }

    render() {
        let {label, value, ...props} = {value, ...this.props};
        props.type = 'file';
        props.onChange = this.handleChange;

        return (
            <div>
                {label && <label>{label}</label>}
                <div className="rjf-file-field">
                    {this.state.value && 
                        <div className="rjf-current-file-name">Current file: <span>{this.state.fileName}</span></div>
                    }
                    {this.state.value && 'Change:'}
                    <div className="rjf-file-field-input">
                        <FormInput {...props} inputRef={this.inputRef} />
                    </div>
                    </div>
            </div>
        );
    }
}
