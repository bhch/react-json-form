import {normalizeKeyword, getSchemaType} from './util';


export function validateSchema(schema) {
    if (!(schema instanceof Object))
        return {isValid: false, msg: "Schema must be an object"};

    let type = getSchemaType(schema);

    let validation = {isValid: true, msg: ""};
    if (type === 'object')
        validation = validateObject(schema);
    else if (type === 'array')
        validation = validateArray(schema);
    else {
        if (schema.hasOwnProperty('allOf')) {
            validation = validateAllOf(schema);
        } else if (schema.hasOwnProperty('oneOf')) {
            validation = validateOneOf(schema);
        } else if (schema.hasOwnProperty('anyOf')) {
            validation = validateAnyOf(schema);
        } else {
            validation = {
                isValid: false,
                msg: "Outermost schema can only be of type array, list, object or dict"
            };
        }
    }

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
    if (
        !schema.hasOwnProperty('keys') &&
        !schema.hasOwnProperty('properties') &&
        !schema.hasOwnProperty('oneOf') &&
        !schema.hasOwnProperty('anyOf') &&
        !schema.hasOwnProperty('allOf')
    )
        return {
            isValid: false,
            msg: "Schema of type '" + schema.type + "' must have at least one of these keys: " + 
            "['properties' or 'keys' or 'oneOf' or 'anyOf' or 'allOf']"
        };

    let validation;

    let keys = schema.properties || schema.keys;
    if (keys) {
        validation = validateKeys(keys);
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

    if (schema.hasOwnProperty('oneOf')) {
        validation = validateOneOf(schema);
        if (!validation.isValid)
            return validation;
    }

    if (schema.hasOwnProperty('anyOf')) {
        validation = validateAnyOf(schema);
        if (!validation.isValid)
            return validation;
    }

    if (schema.hasOwnProperty('allOf')) {
        validation = validateAllOf(schema);
        if (!validation.isValid)
            return validation;
    }

    return {isValid: true, msg: ""};
}


function validateKeys(keys) {
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
        } else if (value.hasOwnProperty('oneOf')) {
            validation = validateOneOf(value);
        } else if (value.hasOwnProperty('anyOf')) {
            validation = validateAnyOf(value);
        } else if (value.hasOwnProperty('allOf')) {
            validation = validateAllOf(value);
        } else {
            validation = {isValid: false, msg: "Key '" + key + "' must have a 'type' or a '$ref"};
        }

        if (!validation.isValid)
            return validation;
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
        if (!schema.items.hasOwnProperty('oneOf') &&
            !schema.items.hasOwnProperty('anyOf') &&
            !schema.items.hasOwnProperty('allOf')
        )
            return {isValid: false, msg: "Array 'items' must have a 'type' or '$ref' or 'oneOf' or 'anyOf'"};
    }

    if (schema.items.hasOwnProperty('oneOf')) {
        validation = validateOneOf(schema.items);
        if (!validation.isValid)
            return validation;
    }

    if (schema.items.hasOwnProperty('anyOf')) {
        validation = validateAnyOf(schema.items);
        if (!validation.isValid)
            return validation;
    }

    if (schema.items.hasOwnProperty('allOf')) {
        // we don't support allOf inside array yet
        return {
            isValid: false,
            msg: "Currently, 'allOf' inside array items is not supported"
        }
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
        };

    if (schema['$ref'].lenght > 1 && !schema['$ref'].startsWith('#/'))
        return {
            isValid: false,
            msg: "Invalid '$ref' path"
        };

    return {isValid: true, msg: ""};
}


export function validateOneOf(schema) {
    return validateSubschemas(schema, 'oneOf');
}


export function validateAnyOf(schema) {
    return validateSubschemas(schema, 'anyOf');
}


export function validateAllOf(schema) {
    let validation = validateSubschemas(schema, 'allOf');
    if (!validation.isValid)
        return validation;

    // currently, we only support anyOf inside an object
    // so, we'll check if all subschemas are objects or not

    let subschemas = schema['allOf'];

    for (let i = 0; i < subschemas.length; i++) {
        let subschema = subschemas[i];
        let subType = getSchemaType(subschema);

        if (subType !== 'object') {
            return {
                isValid: false,
                msg: "Possible conflict in 'allOf' subschemas. Currently, we only support subschemas listed in 'allOf' to be of type 'object'."
            }
        }
    }

    return validation
}


function validateSubschemas(schema, keyword) {
    /*
      Common validator for oneOf/anyOf/allOf

      Params:
        schema: the schema containing the oneOf/anyOf/allOf subschema
        keyword: one of 'oneOf' or 'anyOf' or 'allOf'

      Validation:
      1. Must be an array
      2. Must have at least one subschema
      3. If directly inside an object, each subschema in array must have 'properties' or 'keys keyword
    */
    let subschemas = schema[keyword];

    if (!Array.isArray(subschemas))
        return {
            isValid: false,
            msg: "'" + keyword + "' property must be an array"
        };

    if (!subschemas.length)
        return {
            isValid: false,
            msg: "'" + keyword + "' must contain at least one subschema"
        };

    for (let i = 0; i < subschemas.length; i++) {
        let subschema = subschemas[i];
        let subType = getSchemaType(subschema);

        if (subType === 'object') {
            let validation = validateObject(subschema);
            if (!validation.isValid)
                return validation;
        } else if (subType === 'array') {
            let validation = validateArray(subschema);
            if (!validation.isValid)
                return validation;
        }
    }

    return {isValid: true, msg: ""};
}
