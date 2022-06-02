export function getBlankObject(schema, getRef) {
    let keys = {};

    let schema_keys = schema.keys || schema.properties;

    for (let key in schema_keys) {
        let value = schema_keys[key];
        
        let isRef = value.hasOwnProperty('$ref');
        
        if (isRef)
            value = getRef(value['$ref']);

        let type = value.type;

        if (type === 'list')
            type = 'array';
        else if (type === 'dict')
            type = 'object';

        if (type === 'array')
            keys[key] = isRef ? [] : getBlankArray(value, getRef);
        else if (type === 'object')
            keys[key] = getBlankObject(value, getRef);
        else if (type === 'boolean')
            keys[key] = value.default || false;
        else if (type === 'integer' || type === 'number')
            keys[key] = value.default || null;
        else // string etc.
            keys[key] = value.default || '';
    }

    return keys;
}


export function getBlankArray(schema, getRef) {
    if (schema.default)
        return schema.default;

    let items = [];

    let minItems = schema.minItems || schema.min_items || 0;

    if (minItems === 0)
        return items;

    if (schema.items.hasOwnProperty('$ref')) {
        // :TODO: this will most probably mutate the original schema
        // but i'll fix it later
        schema.items = getRef(schema.items['$ref']);
    }

    let type = schema.items.type;

    if (type === 'list')
        type = 'array';
    else if (type === 'dict')
        type = 'object';

    if (type === 'array') {
        items.push(getBlankArray(schema.items, getRef))
        return items;
    }
    else if (type === 'object') {
        items.push(getBlankObject(schema.items, getRef));
        return items;
    }

    if (schema.items.widget === 'multiselect')
        return items;

    if (type === 'boolean')
        items.push(schema.items.default || false);
    else if (type === 'integer' || type === 'number')
        items.push(schema.items.default || null);
    else // string, etc.
        items.push(schema.items.default || '');

    return items;
}


export function getBlankData(schema, getRef) {
    if (schema.hasOwnProperty('$ref'))
        schema = getRef(schema['$ref']);

    let type = schema.type;

    if (type === 'list')
        type = 'array';
    else if (type === 'dict')
        type = 'object';

    if (type === 'array')
        return getBlankArray(schema, getRef);
    else if (type === 'object')
        return getBlankObject(schema, getRef);
    else if (type === 'boolean')
        return schema.default || false;
    else if (type === 'integer' || type === 'number')
        return schema.default || null;
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

    let type = schema.items.type;
    
    if (type === 'list')
        type = 'array';
    else if (type === 'dict')
        type = 'object';

    for (let i = 0; i < data.length; i++) {
        let item = data[i];

        if (type === 'array') {
            newData[i] = getSyncedArray(item, schema.items, getRef);
        } else if (type === 'object') {
            newData[i] = getSyncedObject(item, schema.items, getRef);
        }
        else {
            if ((type === 'integer' || type === 'number') && item === '')
                newData[i] = null;
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

        let type = schemaValue.type;
    
        if (type === 'list')
            type = 'array';
        else if (type === 'dict')
            type = 'object';
      
        if (!data.hasOwnProperty(key)) {
            if (type === 'array')
                newData[key] = getSyncedArray([], schemaValue, getRef);
            else if (type === 'object')
                newData[key] = getSyncedObject({}, schemaValue, getRef);
            else if (type === 'boolean')
                newData[key] = false;
            else if (type === 'integer' || type === 'number')
                newData[key] = null;
            else
                newData[key] = '';
        } else {
            if (type === 'array')
                newData[key] = getSyncedArray(data[key], schemaValue, getRef);
            else if (type === 'object')
                newData[key] = getSyncedObject(data[key], schemaValue, getRef);
            else {
                if ((type === 'integer' || type === 'number') && data[key] === '')
                    newData[key] = null;
                else
                    newData[key] = data[key];
            }
        }
        
    }

    return newData;
}


export function getSyncedData(data, schema, getRef) {
    // adds those keys to data which are in schema but not in data

    if (schema.hasOwnProperty('$ref'))
        schema = getRef(schema['$ref']);

    let type = schema.type;
    
    if (type === 'list')
        type = 'array';
    else if (type === 'dict')
        type = 'object';

    if (type === 'array') {
        return getSyncedArray(data, schema, getRef);
    } else if (type === 'object') {
        return getSyncedObject(data, schema, getRef);
    }

    return data;
}
