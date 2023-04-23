import React from 'react';
import Button from './buttons';


export function GroupTitle(props) {
    if (!props.children)
        return null;

    return (
        <div className="rjf-form-group-title">
            {props.editable ?
                <span>{props.children} <Button className="edit" onClick={props.onEdit} title="Edit">Edit</Button></span>
                :
                props.children
            }
        </div>
    );
}


function animate(e, animation, callback) {
    let el = e.target.parentElement.parentElement;
    let prevEl = el.previousElementSibling;
    let nextEl = el.nextElementSibling;

    el.classList.add('rjf-animate', 'rjf-' + animation);

    if (animation === 'move-up') {
        let {y, height} = prevEl.getBoundingClientRect();
        let y1 = y, h1 = height;
        
        ({y, height} = el.getBoundingClientRect());
        let y2 = y, h2 = height;
        
        prevEl.classList.add('rjf-animate');

        prevEl.style.opacity = 0;
        prevEl.style.transform = 'translateY(' + (y2 - y1)  + 'px)';

        el.style.opacity = 0;
        el.style.transform = 'translateY(-' + (y2 - y1)  + 'px)';

    } else if (animation === 'move-down') {
        let {y, height} = el.getBoundingClientRect();
        let y1 = y, h1 = height;
        
        ({y, height} = nextEl.getBoundingClientRect());
        let y2 = y, h2 = height;
        
        nextEl.classList.add('rjf-animate');

        nextEl.style.opacity = 0;
        nextEl.style.transform = 'translateY(-' + (y2 - y1)  + 'px)';

        el.style.opacity = 0;
        el.style.transform = 'translateY(' + (y2 - y1)  + 'px)';
    }

    setTimeout(function() {
        callback();
        
        el.classList.remove('rjf-animate', 'rjf-' + animation);
        el.style = null;

        if (animation === 'move-up') {
            prevEl.classList.remove('rjf-animate');
            prevEl.style = null;
        }
        else if (animation === 'move-down') {
            nextEl.classList.remove('rjf-animate');
            nextEl.style = null;
        }
    }, 200);
}

export function FormRowControls(props) {
    return (
        <div className="rjf-form-row-controls">
            {props.onMoveUp &&
                <Button 
                    className="move-up"
                    onClick={(e) => animate(e, 'move-up', props.onMoveUp)}
                    title="Move up"
                >
                    <span>&uarr;</span>
                </Button>
            }
            {props.onMoveDown &&
                <Button 
                    className="move-down"
                    onClick={(e) => animate(e, 'move-down', props.onMoveDown)}
                    title="Move down"
                >
                    <span>&darr;</span>
                </Button>
            }
            {props.onRemove &&
                <Button 
                    className="remove"
                    onClick={(e) => animate(e, 'remove', props.onRemove)}
                    title="Remove"
                >
                    <span>&times;</span>
                </Button>
            }
        </div>
    );
}

export function FormRow(props) {
    let className = 'rjf-form-row';

    if (props.hidden)
        className += ' rjf-form-row-hidden';

    return (
        <div className={className}>
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
            {props.level === 0 && <GroupTitle editable={props.editable} onEdit={props.onEdit}>{props.schema.title}</GroupTitle>}
            <div className={innerClassName}>
                {props.level > 0 && <GroupTitle editable={props.editable} onEdit={props.onEdit}>{props.schema.title}</GroupTitle>}
                {props.children}
                {props.addable && 
                <Button
                    className="add"
                    onClick={(e) => props.onAdd()}
                    title={props.schema.type === 'object' ? 'Add new key' : 'Add new item'}
                >
                    {props.schema.type === 'object' ? 'Add key' : 'Add item'}
                </Button>
                }
            </div>
        </div>
    );
}
