export default function Button({className, alterClassName, ...props}) {
    if (!className)
        className = '';

    let classes = className.split(' ');

    if (alterClassName !== false) {
        className = '';
        for (let i = 0; i < classes.length; i++) {
            className = className + 'rjf-' + classes[i] + '-button ';
        }
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