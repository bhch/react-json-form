import Button from './buttons';


export function GroupTitle(props) {
    if (!props.children)
        return null;

    return (
        <div className="rjf-form-group-title">{props.children}</div>
    );
}


export function FormRowControls(props) {
    return (
        <div className="rjf-form-row-controls">
            {props.onMoveUp &&
                <Button 
                    className="move-up"
                    onClick={props.onMoveUp}
                    title="Move up"
                >
                    <span>&uarr;</span>
                </Button>
            }
            {props.onMoveDown &&
                <Button 
                    className="move-down"
                    onClick={props.onMoveDown}
                    title="Move down"
                >
                    <span>&darr;</span>
                </Button>
            }
            {props.onRemove &&
                <Button 
                    className="remove"
                    onClick={props.onRemove}
                    title="Remove"
                >
                    <span>&times;</span>
                </Button>
            }
        </div>
    );
}

export function FormRow(props) {
    return (
        <div className="rjf-form-row">
            <FormRowControls {...props} />
            <div className="rjf-form-row-inner">
                {props.children}
            </div>
        </div>
    );
}


export function FormGroup(props) {
    let hasChildren = React.Children.count(props.children);

    let innerClassName = props.level === 0 && !hasChildren
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
                    {hasChildren ? 'Add more' : 'Add'}
                </Button>
                }
            </div>
        </div>
    );
}
