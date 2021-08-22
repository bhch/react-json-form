export function getBlankObject(schema) {
    let keys = {};

    for (let key in schema.keys) {
        let value = schema.keys[key];
        let type = value.type;

        if (type === 'string')
            keys[key] = ''; 
        else if (type === 'array')
            keys[key] = getBlankArray(value);
        else if (type === 'object')
            keys[key] = getBlankObject(value);
    }

    return keys;
}


export function getBlankArray(schema) {
    let items = [];
    let type = schema.items.type;

    if (type === 'string')
        items.push('');
    else if (type === 'array')
        items.push(getBlankArray(schema.items))
    else if (type === 'object')
        items.push(getBlankObject(schema.items));

    return items;
}


export function getBlankData(schema) {
    if (schema.type === 'array') {
        return getBlankArray(schema);
    }
    else if (schema.type === 'object') {
        return getBlankObject(schema);
    } else if (schema.type === 'string') {
        return '';
    }
}



function getSyncedArray(data, schema) {
    let newData = JSON.parse(JSON.stringify(data));

    for (let i = 0; i < data.length; i++) {
        let item = data[i];

        if (schema.items.type === 'array') {
            newData[i] = syncArray(item, schema.items);
        } else if (schema.items.type === 'object') {
            newData[i] = syncObject(item, schema.items);
        }
    }

    return newData;
}


function getSyncedObject(data, schema) {
    let newData = JSON.parse(JSON.stringify(data));

    let keys = [...Object.keys(schema.keys)];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let schemaValue = schema.keys[key];
      
        if (!data.hasOwnProperty(key)) {
            if (schemaValue.type === 'string')
                newData[key] = '';
            else if (schemaValue.type === 'array')
                newData[key] = syncArray([], schemaValue);
            else if (schemaValue.type === 'object')
                newData[key] = syncObject({}, schemaValue);
        } else {
        if (schemaValue.type === 'string')
                newData[key] = data[key];
            else if (schemaValue.type === 'array')
                newData[key] = syncArray(data[key], schemaValue);
            else if (schemaValue.type === 'object')
                newData[key] = syncObject(data[key], schemaValue);
        }
        
    }

    return newData;
}


export function getSyncedData(data, schema) {
    // adds those keys to data which are in schema but not in data

    if (schema.type === 'array') {
        return getSyncedArray(data, schema);
    } else if (schema.type === 'object') {
        return getSyncedObject(data, schema);
    }

    return data;
}
