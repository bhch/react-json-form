import Button from './buttons';


export function GroupTitle(props) {
    if (!props.children)
        return null;

    return (
        <div className="rjf-form-group-title">{props.children}</div>
    );
}


export function FormRow(props) {
    return (
        <div className="rjf-form-row">
            {props.onRemove &&
                <Button 
                    className="remove"
                    onClick={(e) => props.onRemove(name)}
                    title="Remove"
                >
                    &times;
                </Button>
            }
            <div className="rjf-form-row-inner">
                {props.children}
            </div>
        </div>
    );
}


export function FormGroup(props) {
    let innerClassName = props.level === 0 && !React.Children.count(props.children) 
        ? "" 
        : "rjf-form-group-inner";

    return (
        <div className="rjf-form-group">
            {props.level === 0 && <GroupTitle>{props.schema.title}</GroupTitle>}
            <div className={innerClassName}>
                {props.level > 0 && <GroupTitle>{props.schema.title}</GroupTitle>}
                {props.children}
                {props.addable && 
                <Button
                    className="add"
                    onClick={(e) => props.onAdd()}
                    title="Add new"
                >
                    Add more
                </Button>
                }
            </div>
        </div>
    );
}
