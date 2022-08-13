import React from 'react';
import {getArrayFormRow, getObjectFormRow} from './ui';
import {EditorContext} from './util';
import EditorState from './editorState';


export default class ReactJSONForm extends React.Component {
    handleChange = (coords, value) => {
        /*
            e.target.name is a chain of indices and keys:
            xxx-0-key-1-key2 and so on.
            These can be used as coordinates to locate 
            a particular deeply nested item.

            This first coordinate is not important and should be removed.
        */
        coords = coords.split('-');

        coords.shift(); // remove first coord

        // :TODO: use immutable JS instead of JSON-ising the data
        let data = setDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())), value);

        this.props.onChange(EditorState.update(this.props.editorState, data));
    }

    getRef = (ref) => {
        /* Returns schema reference. Nothing to do with React's refs.*/

        return EditorState.getRef(ref, this.props.editorState.getSchema());
    }

    getFields = () => {
        let data = this.props.editorState.getData();
        let schema = this.props.editorState.getSchema();
        let formGroups = [];

        try {
            let type = schema.type;
    
            if (type === 'list')
                type = 'array';
            else if (type === 'dict')
                type = 'object';

            let args = {
                data: data,
                schema: schema,
                name: 'rjf',
                onChange: this.handleChange,
                onAdd: this.addFieldset,
                onRemove: this.removeFieldset,
                onEdit: this.editFieldset,
                onMove: this.moveFieldset,
                level: 0,
                getRef: this.getRef,
            };

            if (type === 'array') {
                return getArrayFormRow(args);
            } else if (type === 'object') {
                return getObjectFormRow(args);
            }
        } catch (error) {
            console.log(error);

            formGroups = (
                <p style={{color: '#f00'}}>
                    <strong>(!) Error:</strong> Schema and data structure do not match.
                </p>
            );
        }

        return formGroups;
    }

    addFieldset = (blankData, coords) => {
        coords = coords.split('-');
        coords.shift();

        // :TODO: use immutable JS instead of JSON-ising the data
        let data = addDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())), blankData);

        this.props.onChange(EditorState.update(this.props.editorState, data));
    }

    removeFieldset = (coords) => {
        coords = coords.split('-');
        coords.shift();
 
        // :TODO: use immutable JS instead of JSON-ising the data
        let data = removeDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())));

        this.props.onChange(EditorState.update(this.props.editorState, data));
    }

    editFieldset = (value, newCoords, oldCoords) => {
        /* Add and remove in a single state update

            newCoords will be added
            oldCoords willbe removed
        */

        newCoords = newCoords.split('-');
        newCoords.shift();

        oldCoords = oldCoords.split('-');
        oldCoords.shift();

        let data = addDataUsingCoords(newCoords, JSON.parse(JSON.stringify(this.props.editorState.getData())), value);

        data = removeDataUsingCoords(oldCoords, data);

        this.props.onChange(EditorState.update(this.props.editorState, data));
    }

    moveFieldset = (oldCoords, newCoords) => {
        oldCoords = oldCoords.split("-");
        oldCoords.shift();

        newCoords = newCoords.split("-");
        newCoords.shift();

        // :TODO: use immutable JS instead of JSON-ising the data
        let data = moveDataUsingCoords(oldCoords, newCoords, JSON.parse(JSON.stringify(this.props.editorState.getData())));

        this.props.onChange(EditorState.update(this.props.editorState, data));
    }

    render() {
        return (
            <div className="rjf-form-wrapper">
                <fieldset className="module aligned">
                    <EditorContext.Provider 
                        value={{
                            fileHandler: this.props.fileHandler,
                            fieldName: this.props.fieldName,
                            modelName: this.props.modelName,
                        }}
                    >
                    {this.getFields()}
                    </EditorContext.Provider>
                </fieldset>
            </div>
        );
    }
}

function setDataUsingCoords(coords, data, value) {
    let coord = coords.shift();

    if (!isNaN(Number(coord)))
        coord = Number(coord);

    if (coords.length) {
        data[coord] = setDataUsingCoords(coords, data[coord], value);
    } else {
        if (coord === undefined) // top level array with multiselect widget
            data = value;
        else
            data[coord] = value;
    }

    return data;
}

function addDataUsingCoords(coords, data, value) {
    let coord = coords.shift();
    if (!isNaN(Number(coord)))
        coord = Number(coord);

    if (coords.length) {
        data[coord] = addDataUsingCoords(coords, data[coord], value);
    } else {
        if (Array.isArray(data[coord])) {
            data[coord].push(value);
        } else {
            if (Array.isArray(data)) {
                data.push(value);
            } else {
                data[coord] = value;
            }
        }
    }

    return data;
}

function removeDataUsingCoords(coords, data) {
    let coord = coords.shift();
    if (!isNaN(Number(coord)))
        coord = Number(coord);

    if (coords.length) {
        removeDataUsingCoords(coords, data[coord]);
    } else {
        if (Array.isArray(data))
            data.splice(coord, 1); // in-place mutation
        else
            delete data[coord];
    }

    return data;
}


function moveDataUsingCoords(oldCoords, newCoords, data) {
    let oldCoord = oldCoords.shift();

    if (!isNaN(Number(oldCoord)))
        oldCoord = Number(oldCoord);

    if (oldCoords.length) {
        moveDataUsingCoords(oldCoords, newCoords, data[oldCoord]);
    } else {
        if (Array.isArray(data)) {
            /* Using newCoords allows us to move items from 
            one array to another. 
            However, for now, we're only moving items in a 
            single array.
            */
            let newCoord = newCoords[newCoords.length - 1];
            
            let item = data[oldCoord];

            data.splice(oldCoord, 1);
            data.splice(newCoord, 0, item);
        }
    }

    return data;
}
