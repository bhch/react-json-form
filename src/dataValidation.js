import {normalizeKeyword, getKeyword, getKey, joinCoords} from './util';
import {JOIN_SYMBOL} from './constants';
import EditorState from './editorState';


export default function DataValidator(schema) {
    this.schema = schema;
    this.errorMap = {};

    this.validate = function(data) {
        // reset errorMap so that this validator object
        // can be reused for same schema
        this.errorMap = {};

        let validator = this.getValidator(schema.type);

        if (validator)
            validator(this.schema, data, '');
        else
            this.addError('', 'Invalid schema type: "' + schema.type + '"');

        let validation = {isValid: true, errorMap: this.errorMap};

        if (Object.keys(this.errorMap).length)
            validation['isValid'] = false;

        return validation;
    };

    this.getValidator = function (schema_type) {
        schema_type = normalizeKeyword(schema_type);

        let func;

        switch (schema_type) {
            case 'array':
                func = this.validateArray;
                break;
            case 'object':
                func = this.validateObject;
                break;
            case 'string':
                func = this.validateString;
                break;
            case 'boolean':
                func = this.validateBoolean;
                break;
            case 'integer':
                func = this.validateInteger;
                break;
            case 'number':
                func = this.validateNumber;
                break;
        }

        if (func)
            return func.bind(this);

        return func;
    };

    this.getRef = function(ref) {
        return EditorState.getRef(ref, this.schema);
    };

    this.addError = function(coords, msg) {
        if (!this.errorMap.hasOwnProperty(coords))
            this.errorMap[coords] = [];

        this.errorMap[coords].push(msg);
    };

    this.joinCoords = function(coords) {
        let c = joinCoords.apply(null, coords);
        
        if (c.startsWith(JOIN_SYMBOL))
            c = c.slice(1);

        return c;
    }

    this.validateArray = function(schema, data, coords) {
        if (!Array.isArray(data)) {
            this.addError(coords, "Invalid data type. Expected array.");
            return;
        }

        let next_schema = schema.items;
        if (next_schema.hasOwnProperty('$ref'))
            next_schema = this.getRef(next_schema.$ref);
        let next_type = normalizeKeyword(next_schema.type);

        let minItems = getKeyword(schema, 'minItems', 'min_items');
        let maxItems = getKeyword(schema, 'maxItems', 'max_items');
        let choices = getKeyword(schema.items, 'choices', 'enum');

        if (minItems && data.length < parseInt(minItems))
            this.addError(coords, 'Minimum ' + minItems + ' items required.');

        if (maxItems && data.length > parseInt(maxItems))
            this.addError(coords, 'Maximum ' + maxItems + ' items allowed.');

        if (getKey(schema, 'uniqueItems')) {
            let items_type = next_type;
            if (items_type === 'array' || items_type === 'object') {
                if (data.length !== new Set(data.map((i) => JSON.stringify(i))).size)
                    this.addError(coords, 'All items in this list must be unique.');
            } else {
                if (data.length !== new Set(data).size)
                    this.addError(coords, 'All items in this list must be unique.');
            }
        }

        if (choices) {
            let invalid_choice = data.find((i) => choices.indexOf(i) === -1);
            if (typeof invalid_choice !== 'undefined')
                this.addError(coords, 'Invalid choice + "' + invalid_choice + '"');
        }

        let next_validator = this.getValidator(next_type);

        if (next_validator) {
            for (let i = 0; i < data.length; i++)
                next_validator(next_schema, data[i], this.joinCoords([coords, i]));
        } else
            this.addError(coords, 'Unsupported type "' + next_type + '" for array items.');
    };

    this.validateObject = function(schema, data, coords) {
        if (typeof data !== 'object' || Array.isArray(data)) {
            this.addError(coords, "Invalid data type. Expected object.");
            return;
        }

        let fields = getKeyword(schema, 'properties', 'keys', {});

        let data_keys = Object.keys(data);
        let missing_keys = Object.keys(fields).filter((i) => data_keys.indexOf(i) === -1);

        if (missing_keys.length) {
            this.addError(coords, 'These fields are missing from the data: ' + missing_keys.join(', '));
            return;
        }

        for (let key in data) {
            if (!data.hasOwnProperty(key))
                continue;

            let next_schema;

            if (fields.hasOwnProperty(key))
                next_schema = fields[key];
            else {
                if (!schema.hasOwnProperty('additionalProperties'))
                    continue;

                next_schema = schema.additionalProperties;

                if (next_schema === true)
                    next_schema = {type: 'string'};
            }

            if (next_schema.hasOwnProperty('$ref'))
                next_schema = this.getRef(next_schema.$ref);

            if (schema.hasOwnProperty('required') && Array.isArray(schema.required)) {
                if (schema.required.indexOf(key) > -1)
                    next_schema['required'] = true;
            }

            let next_type = normalizeKeyword(next_schema.type);

            let next_validator = this.getValidator(next_type);

            if (next_validator)
                next_validator(next_schema, data[key], this.joinCoords([coords, key]));
            else {
                this.addError(coords, 'Unsupported type "' + next_type + '" for object properties (keys).');
                return;
            }
        }
    };

    this.validateString = function(schema, data, coords) {
        if (schema.required && !data) {
            this.addError(coords, 'This field is required.');
            return;
        }

        if (typeof data !== 'string') {
            this.addError(coords, 'This value is invalid. Must be a valid string.');
            return;
        }

        if (!data) // not required, can be empty
            return;

        if (schema.minLength && data.length < parseInt(schema.minLength))
            this.addError(coords, 'This value must be at least ' + schema.minLength + ' characters long.');
        
        if ((schema.maxLength || schema.maxLength == 0) && data.length > parseInt(schema.maxLength))
            this.addError(coords, 'This value may not be longer than ' + schema.maxLength + ' characters.');

        let format = normalizeKeyword(schema.format);
        let format_invalid = false;
        let format_validator;


        switch (format) {
            case 'email':
                format_validator = this.validateEmail;
                break;
            case 'date':
                format_validator = this.validateDate;
                break;
            case 'time':
                format_validator = this.validateTime;
                break;
            case 'date-time':
                format_validator = this.validateDateTime;
                break;
        }

        if (format_validator)
            format_validator.call(this, schema, data, coords);
    };

    this.validateBoolean = function(schema, data, coords) {
        if (schema.required && (data === null || data === undefined)) {
            this.addError(coords, 'This field is required.');
            return;
        }

        if (typeof data !== 'boolean' && data !== null && data !== undefined)
            this.addError(coords, 'Invalid value.');
    };

    this.validateInteger = function(schema, data, coords) {
        if (schema.required && (data === null || data === undefined)) {
            this.addError(coords, 'This field is required.');
            return;
        }

        if (data === null) // not required, integer can be null
            return;

        if (typeof data !== 'number') {
            this.addError(coords, 'Invalid value. Only integers allowed.');
            return;
        }

        // 1.0 and 1 must be treated equal
        if (data !== parseInt(data)) {
            this.addError(coords, 'Invalid value. Only integers allowed.');
            return;
        }

        this.validateNumber(schema, data, coords);
    };

    this.validateNumber = function(schema, data, coords) {
        if (schema.required && (data === null || data === undefined)) {
            this.addError(coords, 'This field is required.');
            return;
        }

        if (data === null) // not required, number can be null
            return;

        if (typeof data !== 'number') {
            this.addError(coords, 'Invalid value. Only numbers allowed.');
            return;
        }

        if ((schema.minimum || schema.minimum === 0) && data < schema.minimum)
            this.addError(coords, 'This value must not be less than ' + schema.minimum);
        
        if ((schema.maximum || schema.maximum === 0) && data > schema.maximum)
            this.addError(coords, 'This value must not be greater than ' + schema.minimum);
    
        if ((schema.exclusiveMinimum || schema.exclusiveMinimum === 0) && data <= schema.exclusiveMinimum)
            this.addError(coords, 'This value must be greater than ' + schema.exclusiveMinimum);
        
        if ((schema.exclusiveMaximum || schema.exclusiveMaximum === 0) && data >= schema.exclusiveMaximum)
            this.addError(coords, 'This value must be less than ' + schema.exclusiveMaximum);

        if ((schema.multipleOf || schema.multipleOf === 0) && ((data * 100) % (schema.multipleOf * 100)) / 100)
            this.addError(coords, 'This value must be a multiple of ' + schema.multipleOf);
    };

    this.validateEmail = function(schema, data, coords) {
        // half-arsed validation but will do for the time being
        if (data.indexOf(' ') > -1 ) {
            this.addError(coords, 'Enter a valid email address.');
            return;
        }

        if (data.length > 320) {
            this.addError(coords, 'Email may not be longer than 320 characters');
            return;
        }
    };

    this.validateDate = function(schema, data, coords) {
        // :TODO:
    };

    this.validateTime = function(schema, data, coords) {
        // :TODO:

    };

    this.validateDateTime = function(schema, data, coords) {
        // :TODO:

    };
}
