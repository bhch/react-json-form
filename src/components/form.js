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


export function CheckInput({label, help_text, error, value, ...props}) {

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


export function FileInput(props) {
    return <FormInput {...props} />
}
