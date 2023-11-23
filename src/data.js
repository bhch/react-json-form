import {normalizeKeyword, getKeyword, getSchemaType, actualType,
    isEqualset, isSubset, valueInChoices} from './util';
import {FILLER} from './constants';


export function getBlankObject(schema, getRef) {
    let keys = {};

    let schema_keys = getKeyword(schema, 'keys', 'properties', {});

    for (let key in schema_keys) {
        let value = schema_keys[key];

        let isRef = value.hasOwnProperty('$ref');
        let isConst = value.hasOwnProperty('const');
        
        if (isRef) {
            value = {...getRef(value['$ref']), ...value};
            delete value['$ref'];
        }

        let type = normalizeKeyword(value.type);

        if (!type) {
            // check for oneOf/anyOf
            if (value.hasOwnProperty('oneOf'))
                value =  value.oneOf[0];
            else if (value.hasOwnProperty('anyOf'))
                value =  value.anyOf[0];

            type = normalizeKeyword(value.type);
        }

        let default_ = value.default;

        if (isConst) {
            type = actualType(value.const);
            default_ = value.const;
        }

        if (type === 'array')
            keys[key] = isRef ? [] : getBlankArray(value, getRef);
        else if (type === 'object')
            keys[key] = getBlankObject(value, getRef);
        else if (type === 'boolean')
            keys[key] = default_ === false ? false : (default_ || null);
        else if (type === 'integer' || type === 'number')
            keys[key] = default_ === 0 ? 0 : (default_ || null);
        else
            keys[key] = default_ || '';
    }

    if (schema.hasOwnProperty('oneOf'))
        keys = {...keys, ...getBlankObject(schema.oneOf[0])};
    
    if (schema.hasOwnProperty('anyOf'))
        keys = {...keys, ...getBlankObject(schema.anyOf[0])};

    if (schema.hasOwnProperty('allOf')) {
        for (let i = 0; i < schema.allOf.length; i++) {
            keys = {...keys, ...getBlankObject(schema.allOf[i])};
        }
    }

    return keys;
}


export function getBlankArray(schema, getRef) {
    let minItems = getKeyword(schema, 'minItems', 'min_items') || 0;

    if (schema.default && schema.default.length >= minItems)
        return schema.default;

    let items = [];

    if (schema.default)
        items = [...schema.default];

    if (minItems === 0)
        return items;

    if (schema.items.hasOwnProperty('$ref')) {
        // :TODO: this mutates the original schema
        // but i'll fix it later
        schema.items = {...getRef(schema.items['$ref']), ...schema.items};
        delete schema.items['$ref'];
    }

    let type = normalizeKeyword(schema.items.type);

    if (!type) {
        if (Array.isArray(schema.items['oneOf']))
            type = getSchemaType(schema.items.oneOf[0]);
        else if (Array.isArray(schema.items['anyOf']))
            type = getSchemaType(schema.items.anyOf[0]);
        else if (Array.isArray(schema.items['allOf']))
            type = getSchemaType(schema.items.allOf[0]);
        else if (schema.items.hasOwnProperty('const'))
            type = actualType(schema.items.const);
    }

    if (type === 'array') {
        while (items.length < minItems)
            items.push(getBlankArray(schema.items, getRef));
        return items;
    } else if (type === 'object') {
        while (items.length < minItems)
            items.push(getBlankObject(schema.items, getRef));
        return items;
    } else if (type === 'oneOf') {
        while (items.length < minItems)
            items.push(getBlankOneOf(schema.items, getRef));
        return items;
    } else if (type === 'anyOf') {
        while (items.length < minItems)
            items.push(getBlankOneOf(schema.items, getRef));
        return items;
    }

    if (schema.items.widget === 'multiselect')
        return items;

    let default_ = schema.items.default;

    if (schema.items.hasOwnProperty('const'))
        default_ = schema.items.const;

    if (type === 'boolean') {
        while (items.length < minItems)
            items.push(default_ === false ? false : (default_ || null));
    } else if (type === 'integer' || type === 'number') {
        while (items.length < minItems)
            items.push(default_ === 0 ? 0 : (default_ || null));
    } else {
        // string, etc.
        while (items.length < minItems)
            items.push(default_ || '');
    }

    return items;
}


export function getBlankAllOf(schema, getRef) {
    // currently, we support allOf only inside an object
    return getBlankObject(schema, getRef);
}


export function getBlankOneOf(schema, getRef) {
    // for blank data, we always return the first option
    let nextSchema = schema.oneOf[0];

    let type = getSchemaType(nextSchema);

    return getBlankData(nextSchema, getRef);
}


export function getBlankAnyOf(schema, getRef) {
    // for blank data, we always return the first option
    let nextSchema = schema.anyOf[0];

    let type = getSchemaType(nextSchema);

    return getBlankData(nextSchema, getRef);
}


export function getBlankData(schema, getRef) {
    if (schema.hasOwnProperty('$ref')) {
        schema = {...getRef(schema['$ref']), ...schema};
        delete schema['$ref'];
    }

    let type = getSchemaType(schema);

    let default_ = schema.default;

    if (schema.hasOwnProperty('const')) {
        type = actualType(schema.const);
        default_ = schema.const;
    }

    if (type === 'array')
        return getBlankArray(schema, getRef);
    else if (type === 'object')
        return getBlankObject(schema, getRef);
    else if (type === 'allOf')
        return getBlankAllOf(schema, getRef);
    else if (type === 'oneOf')
        return getBlankOneOf(schema, getRef);
    else if (type === 'anyOf')
        return getBlankAnyOf(schema, getRef);
    else if (type === 'boolean')
        return default_ === false ? false : (default_ || null);
    else if (type === 'integer' || type === 'number')
        return default_ === 0 ? 0 : (default_ || null);
    else // string, etc.
        return default_ || '';
}


function getSyncedArray(data, schema, getRef) {
    if (data === null)
        data = [];

    if (actualType(data) !== 'array')
        throw new Error("Schema expected an 'array' but the data type was '" + actualType(data) + "'");

    let newData = JSON.parse(JSON.stringify(data));

    if (schema.items.hasOwnProperty('$ref')) {
        // :TODO: this will most probably mutate the original schema
        // but i'll fix it later
        schema.items = {...getRef(schema.items['$ref']), ...schema.items};
        delete schema.items['$ref'];
    }

    let type;
    let default_;

    if (schema.items.hasOwnProperty('const')) {
        type = actualType(schema.items.const);
        default_ = schema.items.const;
    } else {
        type = normalizeKeyword(schema.items.type);
        default_ = schema.items.defualt;
    }

    let minItems = schema.minItems || schema.min_items || 0;

    while (data.length < minItems)
        data.push(FILLER);

    for (let i = 0; i < data.length; i++) {
        let item = data[i];

        if (type === 'array') {
            if (item === FILLER)
                item = [];
            newData[i] = getSyncedArray(item, schema.items, getRef);
        } else if (type === 'object') {
            if (item === FILLER)
                item = {};
            newData[i] = getSyncedObject(item, schema.items, getRef);
        } else {
            // if the current value is not in choices, we reset to blank
            if (!valueInChoices(schema.items, newData[i]))
                item = FILLER;

            if (item === FILLER) {
                if (type === 'integer' || type === 'number')
                    newData[i] = default_ === 0 ? 0 : (default_ || null);
                else if (type === 'boolean')
                    newData[i] = default_ === false ? false : (default_ || null);
                else
                    newData[i] = default_ || '';
            }
        }

        if (schema.items.hasOwnProperty('const'))
            newData[i] = schema.items.const;
    }

    return newData;
}


function getSyncedObject(data, schema, getRef) {
    if (data === null)
        data = {};

    if (actualType(data) !== 'object')
        throw new Error("Schema expected an 'object' but the data type was '" + actualType(data) + "'");

    let newData = JSON.parse(JSON.stringify(data));

    let schema_keys = getKeyword(schema, 'keys', 'properties', {});

    if (schema.hasOwnProperty('allOf')) {
        for (let i = 0; i < schema.allOf.length; i++) {
            // ignore items in allOf which are not object
            if (getSchemaType(schema.allOf[i]) !== 'object')
                continue;

            schema_keys = {...schema_keys, ...getKeyword(schema.allOf[i], 'properties', 'keys', {})};
        }
    }

    let keys = [...Object.keys(schema_keys)];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let schemaValue = schema_keys[key];
        
        let isRef = schemaValue.hasOwnProperty('$ref');
        
        if (isRef) {
            schemaValue = {...getRef(schemaValue['$ref']), ...schemaValue};
            delete schemaValue['$ref'];
        }

        let type;
        let default_;

        if (schemaValue.hasOwnProperty('const')) {
            type = actualType(schemaValue.const);
            default_ = schemaValue.const;
        } else {
            type = getSchemaType(schemaValue);
            default_ = schemaValue.default;
        }
      
        if (!data.hasOwnProperty(key)) {
            if (type === 'array')
                newData[key] = getSyncedArray([], schemaValue, getRef);
            else if (type === 'object')
                newData[key] = getSyncedObject({}, schemaValue, getRef);
            else if (type === 'boolean')
                newData[key] = default_ === false ? false : (default_ || null);
            else if (type === 'integer' || type === 'number')
                newData[key] = default_ === 0 ? 0 : (default_ || null);
            else
                newData[key] = default_ || '';
        } else {
            if (type === 'array')
                newData[key] = getSyncedArray(data[key], schemaValue, getRef);
            else if (type === 'object')
                newData[key] = getSyncedObject(data[key], schemaValue, getRef);
            else {
                // if the current value is not in choices, we reset to blank
                if (!valueInChoices(schemaValue, data[key]))
                    data[key] = '';

                if (data[key] === '') {
                    if (type === 'integer' || type === 'number')
                        newData[key] = default_ === 0 ? 0 : (default_ || null);
                    else if (type === 'boolean')
                        newData[key] = default_ === false ? false : (default_ || null);
                    else
                        newData[key] = default_ || '';
                } else {
                    newData[key] = data[key];
                }
            }
        }

        if (schemaValue.hasOwnProperty('const'))
            newData[key] = schemaValue.const;
        
    }

    return newData;
}


export function getSyncedAllOf(data, schema, getRef) {
    // currently we only support allOf inside an object
    // so, we'll treat the curent schema and data to be an object

    return getSyncedObject(data, schema, getRef);
}


export function getSyncedOneOf(data, schema, getRef) {
    let index = findMatchingSubschemaIndex(data, schema, getRef, 'oneOf');
    let subschema = schema['oneOf'][index];

    let syncFunc = getSyncFunc(getSchemaType(subschema));

    if (syncFunc)
        return syncFunc(data, subschema, getRef);

    return data;
}


export function getSyncedAnyOf(data, schema, getRef) {
    let index = findMatchingSubschemaIndex(data, schema, getRef, 'anyOf');
    let subschema = schema['anyOf'][index];

    let syncFunc = getSyncFunc(getSchemaType(subschema));

    if (syncFunc)
        return syncFunc(data, subschema, getRef);

    return data;
}


export function getSyncedData(data, schema, getRef) {
    // adds those keys to data which are in schema but not in data
    if (schema.hasOwnProperty('$ref')) {
        schema = {...getRef(schema['$ref']), ...schema};
        delete schema['$ref'];
    }


    let type = getSchemaType(schema);

    let syncFunc = getSyncFunc(type);

    if (syncFunc)
        return syncFunc(data, schema, getRef);

    return data;
}


function getSyncFunc(type) {
    if (type === 'array')
        return getSyncedArray;
    else if (type === 'object')
        return getSyncedObject;
    else if (type === 'allOf')
        return getSyncedAllOf;
    else if (type === 'oneOf')
        return getSyncedOneOf;
    else if (type === 'anyOf')
        return getSyncedAnyOf;

    return null;
}


export function findMatchingSubschemaIndex(data, schema, getRef, schemaName) {
    let dataType = actualType(data);
    let subschemas = schema[schemaName];

    let index = null;

    for (let i = 0; i < subschemas.length; i++) {
        let subschema = subschemas[i];
    
        if (subschema.hasOwnProperty('$ref')) {
            subschema = {...getRef(subschema['$ref']), ...subschema};
            delete subschema['$ref'];
        }

        let subType = getSchemaType(subschema);

        if (dataType === 'object') {
            // check if all keys match
            if (dataObjectMatchesSchema(data, subschema)) {
                index = i;
                break;
            }
        } else if (dataType === 'array') {
            // check if item types match
            if (dataArrayMatchesSchema(data, subschema)) {
                index = i;
                break;
            }
        } else if (dataType === subType) {
            index = i;
            break;
        }
    }

    if (index === null) {
        // no exact match found
        // so we'll just return the first schema that matches the data type
        for (let i = 0; i < subschemas.length; i++) {
            let subschema = subschemas[i];
        
            if (subschema.hasOwnProperty('$ref')) {
                subschema = {...getRef(subschema['$ref']), ...subschema};
                delete subschema['$ref'];
            }

            let subType = getSchemaType(subschema);

            if (dataType === subType) {
                index = i;
                break;
            }
        }
    }

    return index;
}

export function dataObjectMatchesSchema(data, subschema) {
    let dataType = actualType(data);
    let subType = getSchemaType(subschema);

    if (subType !== dataType)
        return false;

    let subSchemaKeys = getKeyword(subschema, 'properties', 'keys', {});

    // check if all keys in the schema are present in the data
    keyset1 = new Set(Object.keys(data));
    keyset2 = new Set(Object.keys(subSchemaKeys));

    if (subschema.hasOwnProperty('additionalProperties')) {
        // subSchemaKeys must be a subset of data
        if (!isSubset(keyset2, keyset1))
            return false;
    } else {
        // subSchemaKeys must be equal to data
        if (!isEqualset(keyset2, keyset1))
            return false;
    }

    for (let key in subSchemaKeys) {
        if (!subSchemaKeys.hasOwnProperty(key))
            continue;

        if (!data.hasOwnProperty(key))
            return false;

        if (subSchemaKeys[key].hasOwnProperty('const')) {
            if (subSchemaKeys[key].const !== data[key])
                return false;
        }

        let keyType = normalizeKeyword(subSchemaKeys[key].type);
        let dataValueType = actualType(data[key]);

        if (keyType === 'number' && ['number', 'integer', 'null'].indexOf(dataValueType) === -1) {
            return false;
        } else if (keyType === 'integer' && ['number', 'integer', 'null'].indexOf(dataValueType) === -1) {
            return false;
        } else if (keyType === 'boolean' && ['boolean', 'null'].indexOf(dataValueType) === -1) {
            return false;
        } else if (keyType === 'string' && dataValueType !== 'string') {
            return false;
        }

        // TODO: also check minimum, maximum, etc. keywords
    }

    // if here, all checks have passed
    return true;
}


export function dataArrayMatchesSchema(data, subschema) {
    let dataType = actualType(data);
    let subType = getSchemaType(subschema);

    if (subType !== dataType)
        return false;

    let itemsType = subschema.items.type; // Temporary. Nested subschemas inside array.items won't work.

    // check each item in data conforms to array items.type
    for (let i = 0; i < data.length; i++) {
        dataValueType = actualType(data[i]);

        if (subschema.items.hasOwnProperty('const')) {
            if (subschema.items.const !== data[i])
                return false;
        }

        if (itemsType === 'number' && ['number', 'integer', 'null'].indexOf(dataValueType) === -1) {
            return false;
        } else if (itemsType === 'integer' && ['number', 'integer', 'null'].indexOf(dataValueType) === -1) {
            return false;
        } else if (itemsType === 'boolean' && ['boolean', 'null'].indexOf(dataValueType) === -1) {
            return false;
        } else if (itemsType === 'string' && dataValueType !== 'string') {
            return false;
        }
    }

    // if here, all checks have passed
    return true;
}