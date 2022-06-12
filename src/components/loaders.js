export default function Loader (props) {
    let className = 'rjf-loader';
    if (props.className)
        className = className + ' ' + props.className;

    return <div className={className}></div>;
}
