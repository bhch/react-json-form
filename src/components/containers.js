import React from 'react';
import Button from './buttons';
import {getSchemaType} from '../util.js';


export function GroupTitle(props) {
    if (!props.children)
        return null;

    return (
        <div className="rjf-form-group-title">
            {props.children}

            {props.editable &&
                <React.Fragment>
                    {' '}
                    <Button className="edit" onClick={props.onEdit} title="Edit">
                        Edit
                    </Button>
                </React.Fragment>
            }

            {props.collapsible &&
                <React.Fragment>
                    {' '}
                    <Button className="collapse" onClick={props.onCollapse} title={props.collapsed ? "Expand" : "Collapse"}>
                        {props.collapsed ? "[+]" : "[-]"}
                    </Button>
                </React.Fragment>
            }
        </div>
    );
}


export function GroupDescription(props) {
    if (!props.children)
        return null;

    return <div className="rjf-form-group-description">{props.children}</div>;
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
    const [collapsed, setCollapsed] = React.useState(false);

    let type = getSchemaType(props.schema);

    let hasChildren = React.Children.count(props.children);

    let innerClassName = props.level === 0 && props.childrenType === 'groups'
        ? ''
        : 'rjf-form-group-inner';

    let addButtonText;
    let addButtonTitle;

    if (type === 'object') {
        addButtonText = 'Add key';
        addButtonTitle = 'Add new key';
    } else {
        addButtonText = 'Add item';
        addButtonTitle = 'Add new item';
    }

    return (
        <div className="rjf-form-group">
            {props.level === 0 &&
                <GroupTitle
                    editable={props.editable}
                    onEdit={props.onEdit}
                    collapsible={props.collapsible}
                    onCollapse={() => setCollapsed(!collapsed)}
                    collapsed={collapsed}
                >
                    {props.schema.title}
                </GroupTitle>
            }

            {props.level === 0 && <GroupDescription>{props.schema.description}</GroupDescription>}

            <div className={innerClassName}>
                {props.level > 0 &&
                    <GroupTitle
                        editable={props.editable}
                        onEdit={props.onEdit}
                        collapsible={props.collapsible}
                        onCollapse={() => setCollapsed(!collapsed)}
                        collapsed={collapsed}
                    >
                        {props.schema.title}
                    </GroupTitle>
                }

                {props.level > 0 && <GroupDescription>{props.schema.description}</GroupDescription>}

                {collapsed && <div className="rjf-collapsed-indicator"><span>Collapsed</span></div>}
                <div className={collapsed ? "rjf-form-group-children rjf-collapsed" : "rjf-form-group-children"}>
                    {props.children}
                </div>

                {!collapsed && props.addable &&
                    <Button className="add" onClick={(e) => props.onAdd()} title={addButtonTitle}>
                        {addButtonText}
                    </Button>
                }
            </div>
        </div>
    );
}
