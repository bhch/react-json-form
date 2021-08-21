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


export function getBlankItem(schema) {
    let dataObject = {};

    for (let key in schema.fields) {
        if (!schema.fields.hasOwnProperty(key))
            continue;

        let item = schema.fields[key];

        dataObject[key] = '';
    }

    return dataObject;
}


export function getSyncedData(data, schema) {
    // adds those keys to data which are in schema but not in data

    let blankItem = getBlankItem(schema);

    if (schema.type === 'object') {
        return {...blankItem, ...data};
    } else if (schema.type === 'array') {
        for (let i = 0; i < data.length; i++) {
            data[i] = {...blankItem, ...data[i]};
        }
    }

    return data;
}
