export default function Button({className, ...props}) {
    if (!className)
        className = '';

    let classes = className.split(' ');

    className = '';
    for (let i = 0; i < classes.length; i++) {
        className = className + 'rjf-' + classes[i] + '-button ';
    }

    return (
        <button 
            className={className.trim()}
            type="button"
            {...props}
        >
            {props.children}
        </button>
    );
}