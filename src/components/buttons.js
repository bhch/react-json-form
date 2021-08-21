export default function Button({className, ...props}) {
    if (!className)
        className = '';

    className = 'rjf-' + className + '-button';
    return (
        <button 
            className={className}
            type="button"
            {...props}
        >
            {props.children}
        </button>
    );
}