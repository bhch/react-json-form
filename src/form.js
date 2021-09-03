import {getBlankData, getSyncedData} from './data';
import {getArrayFormRow, getObjectFormRow} from './ui';
import {EditorContext} from './util';


export default class Form extends React.Component {
    constructor(props) {
        super(props);

        this.dataInput = document.getElementById(this.props.dataInputId);
        this.schema = props.schema;

        let data = props.data;

        if (!data) {
            // create empty data from schema
            data = getBlankData(this.schema);
        } else {
            // data might be stale if schema has new keys, so add them to data
            try {
                data = getSyncedData(data, this.schema);
            } catch (error) {
                console.log("Error: Schema and data don't match");
                console.log(error);
            }
        }

        this.state = {
            value: '',
            data: data
        };
        
        // update data in the input
        this.populateDataInput();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.data !== prevState.data) {
            this.populateDataInput();
        }
    }

    populateDataInput = () => {
        this.dataInput.value = JSON.stringify(this.state.data);
    }

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

        function setDataUsingCoords(coords, data, value) {
            let coord = coords.shift();
            if (!isNaN(Number(coord)))
                coord = Number(coord);

            if (coords.length) {
                setDataUsingCoords(coords, data[coord], value);
            } else {
                data[coord] = value;
            }
        }

        let _data = JSON.parse(JSON.stringify(this.state.data));

        setDataUsingCoords(coords, _data, value);

        this.setState({data: _data});
    }

    getFields = () => {
        let data = this.state.data;
        let formGroups = [];

        try {
            let type = this.schema.type;
    
            if (type === 'list')
                type = 'array';
            else if (type === 'dict')
                type = 'object';

            if (type === 'array') {
                return getArrayFormRow(
                    data, this.schema, 'rjf',
                    this.handleChange, this.addFieldset, this.removeFieldset,
                    0
                );
            } else if (type === 'object') {
                return getObjectFormRow(
                    data, this.schema, 'rjf',
                    this.handleChange, this.addFieldset, this.removeFieldset,
                    0
                );
            }
        } catch (error) {
            formGroups = (
                <p style={{color: '#f00'}}>
                    <strong>(!) Error:</strong> Schema and data do not match.
                </p>
            );
        }

        return formGroups;
    }

    addFieldset = (blankData, coords) => {
        coords = coords.split('-');
        coords.shift();

        this.setState((state) => {
            function addDataUsingCoords(coords, data, value) {
                let coord = coords.shift();
                if (!isNaN(Number(coord)))
                    coord = Number(coord);

                if (coords.length) {
                    addDataUsingCoords(coords, data[coord], value);
                } else {
                    if (Array.isArray(data[coord])) {
                        data[coord].push(value);
                    }
                    else {
                        if (Array.isArray(data)) {
                            data.push(value);
                        } else {
                            data[coord] = value;
                        }
                    }
                }
            }

            let _data = JSON.parse(JSON.stringify(state.data));

            addDataUsingCoords(coords, _data, blankData);

            return {data: _data};
        });
    }

    removeFieldset = (coords) => {
        coords = coords.split('-');
        coords.shift();

        this.setState((state) => {
            function removeDataUsingCoords(coords, data) {
                let coord = coords.shift();
                if (!isNaN(Number(coord)))
                    coord = Number(coord);

                if (coords.length) {
                    removeDataUsingCoords(coords, data[coord]);
                } else {
                    if (Array.isArray(data))
                        data = data.splice(coord, 1); // in-place mutation
                    else
                        delete data[coord];
                }
            }

            let _data = JSON.parse(JSON.stringify(state.data));

            removeDataUsingCoords(coords, _data);

            return {data: _data};
        });
    }

    render() {
        return (
            <div className="rjf-form-wrapper">
                <fieldset className="module aligned">
                    <EditorContext.Provider 
                        value={{
                            fileUploadEndpoint: this.props.fileUploadEndpoint,
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
