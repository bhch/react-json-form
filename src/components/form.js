import Button from './buttons';
import Loader from './loaders';
import {TimePicker} from './widgets';
import {EditorContext, getCsrfCookie, capitalize} from '../util';


export function FormInput({label, help_text, error, inputRef, ...props}) {

    if (props.type === 'string')
        props.type = 'text'

    if (inputRef)
        props.ref = inputRef;

    if (props.value === null)
        props.value = '';

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

    if (props.checked === '' || props.checked === null || props.checked === undefined)
        props.checked = false

    if (props.readOnly)
        props.disabled = true;

    return (
        <div>
            <label><input {...props} /> {label}</label>
        </div>
    );
}


export function FormRadioInput({label, help_text, error, value, options, ...props}) {
    if (props.readOnly)
        props.disabled = true;

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
                    if (typeof label === 'boolean')
                        label = capitalize(label.toString());
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
    if (props.readOnly)
        props.disabled = true;

    return (
        <div>
            {label && <label>{label}</label>}
            <select value={value || ''} {...props}>
                <option disabled value="" key={'__placehlder'}>Select...</option>
                {options.map((option, i) => {
                    let label, inputValue;
                    if (typeof option === 'object') {
                        label = option.label;
                        inputValue = option.value;
                    } else {
                        label = option;
                        if (typeof label === 'boolean')
                            label = capitalize(label.toString());
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
    static contextType = EditorContext;

    constructor(props) {
        super(props);

        this.state = {
            value: props.value,
            fileName: this.getFileName(),
            loading: false
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
        } else if (this.props.type === 'file-url') {
            let endpoint = this.context.fileUploadEndpoint;
            if (!endpoint) {
                console.error(
                    "Error: fileUploadEndpoint option need to be passed "
                    + "while initializing editor for enabling file uploads.");
                alert("Files can't be uploaded.");
                return;
            }

            this.setState({loading: true});

            let formData = new FormData();
            formData.append('field_name', this.context.fieldName);
            formData.append('model_name', this.context.modelName);
            formData.append('coordinates', JSON.stringify(this.props.name.split('-').slice(1)));
            formData.append('file', e.target.files[0]);

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfCookie(),
                },
                body: formData
            })
            .then((response) => response.json())
            .then((result) => {
                // we create a fake event object
                let event = {
                    target: {
                        type: 'text',
                        value: result.file_path,
                        name: this.props.name
                    }
                };

                this.props.onChange(event);
                this.setState({loading: false});
            })
            .catch((error) => {
                alert('Something went wrong while uploading file');
                console.error('Error:', error);
                this.setState({loading: false});
            });

        }

    }

    showFileBrowser = () => {
        this.inputRef.current.click();
    }

    clearFile = () => {
        let event = {
            target: {
                type: 'text',
                value: '',
                name: this.props.name
            }
        };

        this.props.onChange(event);
    }

    render() {
        let {label, value, ...props} = {value, ...this.props};
        props.type = 'file';
        props.onChange = this.handleChange;

        if (props.readOnly)
            props.disabled = true;

        return (
            <div> 
                {label && <label>{label}</label>}
                <div className="rjf-file-field">
                    {this.state.value && 
                        <div className="rjf-current-file-name">
                            Current file: <span>{this.state.fileName}</span> {' '}
                            <Button className="remove-file" onClick={this.clearFile}>Clear</Button>
                        </div>
                    }
                    {this.state.value && !this.state.loading && 'Change:'}
                    {this.state.loading ?
                        <div className="rjf-file-field-loading"><Loader/> Uploading...</div>
                    : 
                    <div className="rjf-file-field-input">
                        <FormInput {...props} inputRef={this.inputRef} />
                    </div>
                    }
                    </div>
            </div>
        );
    }
}


export class FormTextareaInput extends React.Component {
    constructor(props) {
        super(props);

        if (!props.inputRef)
            this.inputRef = React.createRef();
    }

    handleChange = (e) => {
        this.updateHeight(e.target);

        if (this.props.onChange)
            this.props.onChange(e);
    }

    updateHeight = (el) => {
        let offset = el.offsetHeight - el.clientHeight;
        el.style.height = 'auto';
        el.style.height = (el.scrollHeight + offset) + 'px';
    }

    componentDidMount() {
        if (this.props.inputRef)
            this.updateHeight(this.props.inputRef.current);
        else 
            this.updateHeight(this.inputRef.current);
    }

    render() {
        let {label, help_text, error, inputRef, ...props} = this.props;

        delete props.type;

        props.ref = inputRef || this.inputRef;
        props.onChange = this.handleChange;

        return (
            <div>
                {label && <label>{label}</label>}
                <textarea {...props} />
            </div>
        );
    }
}


export class FormDateTimeInput extends React.Component {
    constructor(props) {
        super(props);
        // we maintain this input's state in itself
        // so that we can only pass valid values
        // otherwise keep the value empty if invalid

        let date = '';
        let hh = '12';
        let mm = '00';
        let ss = '00';
        let ms = '000';
        let ampm = 'am';

        if (props.value) {
            let d = new Date(props.value);
            let year = d.getFullYear().toString().padStart(2, '0');
            let month = (d.getMonth() + 1).toString().padStart(2, '0');
            let day = d.getDate().toString().padStart(2, '0');
            date = year + '-' + month + '-' + day;

            hh = d.getHours();
            if (hh === 0) {
                hh = 12;
            } else if (hh === 12) {
                ampm = 'pm';
            } else if (hh > 12) {
                hh = hh - 12;
                ampm = 'pm';
            }

            mm = d.getMinutes();
            ss = d.getSeconds();
            ms = d.getMilliseconds();

            hh = hh.toString().padStart(2, '0');
            mm = mm.toString().padStart(2, '0');
            ss = ss.toString().padStart(2, '0');
        }

        this.state = {
            date: date,
            hh: hh,
            mm: mm,
            ss: ss,
            ms: ms,
            ampm: ampm,
            showTimePicker: false,
        };

        this.timeInput = React.createRef();
        this.timePickerContainer = React.createRef();
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
      document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside = (e) => {
        if (this.state.showTimePicker) {
            if (this.timePickerContainer.current &&
                !this.timePickerContainer.current.contains(e.target) &&
                !this.timeInput.current.contains(e.target)
            )
                this.setState({showTimePicker: false});
        }
    };

    sendValue = () => {
        // we create a fake event object
        // to send a combined value from two inputs
        let event = {
            target: {
                type: 'text',
                value: '',
                name: this.props.name
            }
        };

        if (this.state.date === '' || this.state.date === null)
            return this.props.onChange(event);

        let hh = parseInt(this.state.hh);
        
        if (this.state.ampm === 'am') {
            if (hh === 12)
                hh = 0;
        } else if (this.state.ampm === 'pm') {
            if (hh !== 12)
                hh = hh + 12;
        }

        hh = hh.toString().padStart(2, '0');
        let mm = this.state.mm.padStart(2, '0');
        let ss = this.state.ss.padStart(2, '0');

        let date = new Date(this.state.date + 'T' + hh + ':' + mm + ':' + ss + '.' + this.state.ms);
        let value = date.toISOString().replace('Z', '+00:00') // make compatible to python

        event['target']['value'] = value;

        this.props.onChange(event);
    }

    handleDateChange = (e) => {
        this.setState({date: e.target.value}, this.sendValue);
    }

    handleTimeChange = (value) => {
        this.setState({
            hh: value.hh,
            mm: value.mm,
            ss: value.ss,
            ampm: value.ampm,
        }, this.sendValue);
    }

    showTimePicker = () => {
        this.setState({showTimePicker: true});
    }

    render() {
        return (
            <div className="rjf-datetime-field">
                {this.props.label && <label>{this.props.label}</label>}
                <FormInput
                    label='Date'
                    type='date'
                    value={this.state.date}
                    onChange={this.handleDateChange}
                />
                <FormInput
                    label='Time'
                    type='text'
                    value={this.state.hh + ':' + this.state.mm + ':' + this.state.ss + ' ' + this.state.ampm}
                    onFocus={this.showTimePicker}
                    readOnly={true}
                    inputRef={this.timeInput}
                />
                <div ref={this.timePickerContainer}>
                    {this.state.showTimePicker &&
                        <TimePicker
                            onChange={this.handleTimeChange}
                            hh={this.state.hh}
                            mm={this.state.mm}
                            ss={this.state.ss}
                            ampm={this.state.ampm}
                        />
                    }
                </div>
            </div>
        );
    }
}
