import {normalizeKeyword} from './util';


export function validateSchema(schema) {
    if (!(schema instanceof Object))
        return {isValid: false, msg: "Schema must be an object"};

    let type = normalizeKeyword(schema.type);

    let validation = {isValid: true, msg: ""};
    if (type === 'object')
        validation = validateObject(schema);
    else if (type === 'array')
        validation = validateArray(schema);
    else
        validation = {
            isValid: false,
            msg: "Outermost schema can only be of type array, list, object or dict"
        };

    if (!validation.isValid || !schema.hasOwnProperty('$defs'))
        return validation;

    // validate $defs
    // :TODO: validate $defs nested inside objects/arrays
    if (!(schema['$defs']) instanceof Object)
        return {
            isValid: false,
            msg: "'$defs' must be a valid JavaScript Object"
        };

    return validation;
}


export function validateObject(schema) {
    if (!schema.hasOwnProperty('keys') && !schema.hasOwnProperty('properties'))
        return {
            isValid: false,
            msg: "Schema of type '" + schema.type + "' must have a key called 'properties' or 'keys'"
        };

    let keys = schema.properties || schema.keys;

    if (!(keys instanceof Object))
        return {
            isValid: false,
            msg: "The 'keys' or 'properties' key must be a valid JavaScript Object"
        };

    for (let key in keys) {
        if (!keys.hasOwnProperty(key))
            continue;

        let value = keys[key];

        if (!(value instanceof Object))
            return {
                isValid: false,
                msg: "Key '" + key + "' must be a valid JavaScript Object"
            };

        let validation = {isValid: true};

        let value_type = normalizeKeyword(value.type);

        if (value_type) {
            if (value_type === 'object')
                validation = validateObject(value);
            else if (value_type === 'array')
                validation = validateArray(value);
        } else if (value.hasOwnProperty('$ref')) {
            validation = validateRef(value);
        } else {
            validation = {isValid: false, msg: "Key '" + key + "' must have a 'type' or a '$ref"};
        }

        if (!validation.isValid)
            return validation;
    }

    if (schema.hasOwnProperty('additionalProperties')) {
        if (!(schema.additionalProperties instanceof Object) && typeof schema.additionalProperties !== 'boolean')
            return {
                isValid: false,
                msg: "'additionalProperties' must be either a JavaScript boolean or a JavaScript object"
            };

        if (schema.additionalProperties instanceof Object) {
            if (schema.additionalProperties.hasOwnProperty('$ref')) {
                validation = validateRef(schema.additionalProperties);
                if (!validation.isValid)
                    return validation;
            } else {
                let type = normalizeKeyword(schema.additionalProperties.type);

                if (type === 'object')
                    return validateObject(schema.additionalProperties);
                else if (type === 'array')
                    return validateSchema(schema.additionalProperties);
                /* :TODO: else validate allowed types */
            }
        }

    }

    return {isValid: true, msg: ""};
}


export function validateArray(schema) {
    if (!schema.hasOwnProperty('items'))
        return {
            isValid: false,
            msg: "Schema of type '" + schema.type + "' must have a key called 'items'"
        };

    if (!(schema.items instanceof Object))
        return {
            isValid: false,
            msg: "The 'items' key must be a valid JavaScript Object'"
        };

    let items_type = normalizeKeyword(schema.items.type);

    if (items_type) {
        if (items_type === 'object')
            return validateObject(schema.items);
        else if (items_type === 'array')
            return validateArray(schema.items);
        /* :TODO: else validate allowed types */
    } else if (schema.items.hasOwnProperty('$ref')) {
        return validateRef(schema.items);
    } else {
        return {isValid: false, msg: "'items' key must have a 'type' or a '$ref'"};
    }

    return {isValid: true, msg: ""};
}


export function validateRef(schema) {
    if (typeof schema['$ref'] !== 'string')
        return {
            isValid: false,
            msg: "'$ref' keyword must be a string"
        };

    if (!schema['$ref'].startsWith('#'))
        return {
            isValid: false,
            msg: "'$ref' value must begin with a hash (#) character"
        }

    if (schema['$ref'].lenght > 1 && !schema['$ref'].startsWith('#/'))
        return {
            isValid: false,
            msg: "Invalid '$ref' path"
        }

    return {isValid: true, msg: ""};
}
