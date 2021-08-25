export function FormInput({label, help_text, error, ...props}) {

    if (props.type === 'string')
        props.type = 'text'

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


export function FileInput(props) {
    return <FormInput {...props} />
}
