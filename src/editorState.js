import {getBlankData, getSyncedData} from './data';
import {validateSchema} from './schemaValidation';


export default class EditorState {
    /* Not for public consumption */
    constructor(state) {
        this.state = state;
    }

    static create(schema, data) {
        /*
          schema and data can be either a JSON string or a JS object.
          data is optional.
        */

        if (typeof schema === 'string')
            schema = JSON.parse(schema);

        let validation = validateSchema(schema);

        if (!validation.isValid)
            throw new Error('Error while creating EditorState: Invalid schema: ' + validation.msg);

        if (typeof data === 'string' && data !== '')
            data = JSON.parse(data);

        if (!data) {
            // create empty data from schema
            data = getBlankData(schema, (ref) => EditorState.getRef(ref, schema));
        } else {
            // data might be stale if schema has new keys, so add them to data
            try {
                data = getSyncedData(data, schema, (ref) => EditorState.getRef(ref, schema));
            } catch (error) {
                console.error("Error while creating EditorState: Schema and data structure don't match");
                throw error;
            }
        }

        return new EditorState({schema: schema, data: data});
    }

    static getRef(ref, schema) {
        /* Returns schema reference. Nothing to do with React's refs.

           This will not normalize keywords, i.e. it won't convert 'keys'
           to 'properties', etc. Because what if there's an actual key called
           'keys'? Substituting the keywords will lead to unexpected lookup.

        */

        let refSchema;
        let tokens = ref.split('/');

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];

            if (token === '#')
                refSchema = schema;
            else
                refSchema = refSchema[token];
        }

        return {...refSchema};
    }

    static update(editorState, data) {
        /* Only for updating data.
           For updating schema, create new state.
        */
        return new EditorState({...editorState._getState(), data: data});
    }

    _getState() {
        return this.state;
    }

    getData() {
        let state = this._getState();
        return state.data;
    }

    getSchema() {
        let state = this._getState();
        return state.schema;
    }
}
