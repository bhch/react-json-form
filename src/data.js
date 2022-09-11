import {normalizeKeyword, getKeyword} from './util';


export function getBlankObject(schema, getRef) {
    let keys = {};

    let schema_keys = schema.keys || schema.properties;

    for (let key in schema_keys) {
        let value = schema_keys[key];
        
        let isRef = value.hasOwnProperty('$ref');
        
        if (isRef)
            value = getRef(value['$ref']);

        let type = normalizeKeyword(value.type);

        if (type === 'array')
            keys[key] = isRef ? [] : getBlankArray(value, getRef);
        else if (type === 'object')
            keys[key] = getBlankObject(value, getRef);
        else if (type === 'boolean')
            keys[key] = value.default === false ? false : (value.default || null);
        else if (type === 'integer' || type === 'number')
            keys[key] = value.default === 0 ? 0 : (value.default || null);
        else // string etc.
            keys[key] = value.default || '';
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
        // :TODO: this will most probably mutate the original schema
        // but i'll fix it later
        schema.items = getRef(schema.items['$ref']);
    }

    let type = normalizeKeyword(schema.items.type);

    if (type === 'array') {
        while (items.length < minItems)
            items.push(getBlankArray(schema.items, getRef));
        return items;
    } else if (type === 'object') {
        while (items.length < minItems)
            items.push(getBlankObject(schema.items, getRef));
        return items;
    }

    if (schema.items.widget === 'multiselect')
        return items;

    if (type === 'boolean') {
        while (items.length < minItems)
            items.push(schema.items.default === false ? false : (schema.items.default || null));
    } else if (type === 'integer' || type === 'number') {
        while (items.length < minItems)
            items.push(schema.items.default === 0 ? 0 : (schema.items.default || null));
    } else {
        // string, etc.
        while (items.length < minItems)
            items.push(schema.items.default || '');
    }

    return items;
}


export function getBlankData(schema, getRef) {
    if (schema.hasOwnProperty('$ref'))
        schema = getRef(schema['$ref']);

    let type = normalizeKeyword(schema.type);

    if (type === 'array')
        return getBlankArray(schema, getRef);
    else if (type === 'object')
        return getBlankObject(schema, getRef);
    else if (type === 'boolean')
        return schema.default === false ? false : (schema.default || null);
    else if (type === 'integer' || type === 'number')
        return schema.default === 0 ? 0 : (schema.default || null);
    else // string, etc.
        return schema.default || '';
}



function getSyncedArray(data, schema, getRef) {
    let newData = JSON.parse(JSON.stringify(data));

    if (schema.items.hasOwnProperty('$ref')) {
        // :TODO: this will most probably mutate the original schema
        // but i'll fix it later
        schema.items = getRef(schema.items['$ref'])
    }

    let type = normalizeKeyword(schema.items.type);
    let minItems = schema.minItems || schema.min_items || 0;

    const filler = '__JSONRORM_FILLER__'; // filler for minItems

    while (data.length < minItems)
        data.push(filler);

    for (let i = 0; i < data.length; i++) {
        let item = data[i];

        if (type === 'array') {
            if (item === filler)
                item = [];
            newData[i] = getSyncedArray(item, schema.items, getRef);
        } else if (type === 'object') {
            if (item === filler)
                item = {};
            newData[i] = getSyncedObject(item, schema.items, getRef);
        } else {
            if (item === filler) {
                if (type === 'integer' || type === 'number')
                    newData[i] = schema.items.default === 0 ? 0 : (schema.items.default || null);
                else if (type === 'boolean')
                    newData[i] = schema.items.default === false ? false : (schema.items.default || null);
                else
                    newData[i] = schema.items.default || '';
            }
        }
    }

    return newData;
}


function getSyncedObject(data, schema, getRef) {
    let newData = JSON.parse(JSON.stringify(data));

    let schema_keys = schema.keys || schema.properties;

    let keys = [...Object.keys(schema_keys)];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let schemaValue = schema_keys[key];
        
        let isRef = schemaValue.hasOwnProperty('$ref');
        
        if (isRef)
            schemaValue = getRef(schemaValue['$ref']);

        let type = normalizeKeyword(schemaValue.type);
      
        if (!data.hasOwnProperty(key)) {
            if (type === 'array')
                newData[key] = getSyncedArray([], schemaValue, getRef);
            else if (type === 'object')
                newData[key] = getSyncedObject({}, schemaValue, getRef);
            else if (type === 'boolean')
                newData[key] = schemaValue.default === false ? false : (schemaValue.default || null);
            else if (type === 'integer' || type === 'number')
                newData[key] = schemaValue.default === 0 ? 0 : (schemaValue.default || null);
            else
                newData[key] = schemaValue.default || '';
        } else {
            if (type === 'array')
                newData[key] = getSyncedArray(data[key], schemaValue, getRef);
            else if (type === 'object')
                newData[key] = getSyncedObject(data[key], schemaValue, getRef);
            else {
                if (data[key] === '') {
                    if (type === 'integer' || type === 'number')
                        newData[key] = schemaValue.default === 0 ? 0 : (schemaValue.default || null);
                    else if (type === 'boolean')
                        newData[key] = schemaValue.default === false ? false : (schemaValue.default || null);
                } else {
                    newData[key] = data[key];
                }
            }
        }
        
    }

    return newData;
}


export function getSyncedData(data, schema, getRef) {
    // adds those keys to data which are in schema but not in data

    if (schema.hasOwnProperty('$ref'))
        schema = getRef(schema['$ref']);

    let type = normalizeKeyword(schema.type);

    if (type === 'array') {
        return getSyncedArray(data, schema, getRef);
    } else if (type === 'object') {
        return getSyncedObject(data, schema, getRef);
    }

    return data;
}
