import DataValidator from '../src/dataValidation';


test('addError mehtod', () => {
    /* DataValidator.addError method must create a list for
       the given key. All the error messages for thay key must be appended
       to that list.
    */

    let validator = new DataValidator();
  
    validator.addError('key', 'error message');
  
    expect(validator.errorMap).toEqual(
        expect.objectContaining({
        'key': ['error message']
        })
    );
});

test('validate array type', () => {
    /* Data must be array if schema type is array */

    // 1. top level array
    let schema = {
        'type': 'array', 
        'items': {'type': 'string'}
    };
    let wrong_data = {};
    let data = [];
    let validator = new DataValidator(schema);

    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 2. nested array
    schema = {
        'type': 'array',
        'items': {
            'type': 'array',
            'items': {'type': 'string'}
        }
    };
    wrong_data = [{}];
    data = [[]];
    validator = new DataValidator(schema);

    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('validate array minItems', () => {
    let schema = {
        'type': 'array',
        'items': {'type': 'string'},
        'minItems': 1
    };
    let wrong_data = [];
    let data = ['val'];
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('validate array maxItems', () => {
    let schema = {
        'type': 'array',
        'items': {'type': 'string'},
        'maxItems': 1
    };
    let wrong_data = ['val', 'val'];
    let data = ['val'];
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('validate array uniqueItems', () => {
    // 1. string items
    let schema = {
        'type': 'array',
        'items': {'type': 'string'},
        'uniqueItems': true
    };
    let wrong_data = ['a', 'b', 'a'];
    let data = ['a', 'b'];
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 2. object items
    schema = {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'a': {'type': 'string'}
            }
        },
        'uniqueItems': true
    };
    wrong_data = [{'a': '1'}, {'a': '1'}];
    data = [{'a': '1'}, {'a': '2'}];
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 3. array items
    schema = {
        'type': 'array',
        'items': {
            'type': 'array',
            'items': {'type': 'string'}
        },
        'uniqueItems': true
    };
    wrong_data = [['a', 'b'], ['a', 'b']];
    let data_1 = [['a', 'b'], ['a', 'c']];
    let data_2 = [['a', 'b'], ['b', 'a']];
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
});

test('validate array choices', () => {
    let schema = {
        'type': 'array',
        'items': {'type': 'string', 'choices': ['1', '2', '3']}
    };
    let wrong_data = ['x'];
    let data = ['1'];
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('validate object type', () => {
    /* Data must be object if schema type is object */

    // 1. top level object
    let schema = {
        'type': 'object', 
        'properties': {}
    };
    let wrong_data = [];
    let data = {};
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 2. nested object
    schema = {
        'type': 'object',
        'properties': {
            'x': {
                'type': 'object',
                'properties': {}
            }
        }
    };
    wrong_data = {'x': []};
    data = {'x': {}};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('object has all the keys that are in schema', () => {
    let schema = {
        'type': 'object',
        'properties': {
            'a': {'type': 'string'},
            'b': {'type': 'string'}
        }
    };
    let wrong_data = {'a': ''}; // some keys missing
    let data_1 = {'a': '', 'b': ''}; // exact keys
    let data_2 = {'a': '', 'b': '', 'c': ''}; // extra keys
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
});

test('object required properties', () => {
    let schema = {
        'type': 'object',
        'properties': {'a': {'type': 'string'}},
        'required': ['a'],
    };
    let wrong_data = {'a': ''}; // empty data
    let data = {'a': 'hello'};
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('additionalProperties type', () => {
    // 1.
    let schema = {
        'type': 'object',
        'properties': {'a': {'type': 'string'}},
        'additionalProperties': {'type': 'integer'}
    };
    let wrong_data = {'a': '', 'b': '1'};
    let data = {'a': '', 'b': 1};
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 2. if additionalProperties is "true",
    // it must be interpreted as string type
    schema = {
        'type': 'object',
        'properties': {'a': {'type': 'string'}},
        'additionalProperties': true
    };
    wrong_data = {'a': '', 'b': 1};
    data = {'a': '', 'b': '1'};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('array items ref', () => {
    let schema = {
        'type': 'array', 
        'items': {'$ref': '#/$defs/itemsRef'},
        '$defs': {
            'itemsRef': {
                'type': 'integer'
            }
        }
    };
    let wrong_data = ['1'];
    let data = [1];
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('object properties ref', () => {
    let schema = {
        'type': 'object',
        'properties': {
            'a': {'type': 'string'},
            'b': {'$ref': '#/properties/a'},
        }
    };
    let wrong_data_1 = {'a': '1'};
    let wrong_data_2 = {'a': '1', 'b': 2};
    let data = {'a': '1', 'b': '2'};
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('additionalProperties ref', () => {
    let schema = {
        'type': 'object',
        'properties': {'a': {'type': 'string'}},
        'additionalProperties': {'$ref': '#/properties/a'}
    };
    let wrong_data = {'a': '1', 'b': 2};
    let data = {'a': '1', 'b': '2'};
    let validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('validateString method', () => {
    let schema = {
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string',
                'required': true,
                'minLength': 3,
                'maxLength': 5
            }
        }
    };
    let wrong_data;
    let data;
    let validator = new DataValidator(schema);

    // 1. test required
    wrong_data = {'a': ''};
    expect(validator.validate(wrong_data).isValid).toBe(false);

    // 2. test type
    wrong_data = {'a': 123};
    expect(validator.validate(wrong_data).isValid).toBe(false);

    // 3. test minLength
    wrong_data = {'a': '12'};
    expect(validator.validate(wrong_data).isValid).toBe(false);

    // 4. test maxLength
    wrong_data = {'a': '123456'};
    expect(validator.validate(wrong_data).isValid).toBe(false);

    // 5. correct data
    data = {'a': '123'}
    expect(validator.validate(data).isValid).toBe(true);

    // 6. test maxLength when zero
    schema['properties']['a']['maxLength'] = 0
    wrong_data = {'a': '123456'}
    expect(validator.validate(wrong_data).isValid).toBe(false);

    // 7. minLength should be ignore if field is not required and is empty
    delete schema['properties']['a']['maxLength'];
    schema['properties']['a']['minLength'] = 3;
    schema['properties']['a']['required'] = false;
    data = {'a': ''}
    expect(validator.validate(data).isValid).toBe(true);
});

/* :TODO: Enable these tests later after writing format validations.

test('validate string formats', () => {
    let schema, wrong_data, data, validator;

    // 1. email
    schema = {
        'type': 'object',
        'properties': {
            'a': {
                'type': 'string',
                'format': 'email'
            }
        }
    };
    wrong_data = {'a': '1'};
    data = {'a': 'test@example.com'};
    data_2 = {'a': ''}; // not required, can be empty
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 2. date
    schema['properties']['a']['format'] = 'date';
    wrong_data = {'a': '2022-100-100'};
    data = {'a': '2022-09-01'};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 3. time
    schema['properties']['a']['format'] = 'time';
    wrong_data = {'a': '12 pm'};
    let data_1 = {'a': '12:10'};
    let data_2 = {'a': '12:10:08'};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 4. date-time
    schema['properties']['a']['format'] = 'date-time';
    wrong_data = {'a': '5 Sept, 2022'};
    data_1 = {'a': '2022-09-05'};
    data_2 = {'a': '2022-09-05T06:53:19.119527'};
    let data_3 = {'a': '2022-09-05T06:53:19.119527+00:00'};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
    expect(validator.validate(data_3).isValid).toBe(true);
});

*/

test('validateBoolean method', () => {
    let schema, wrong_data, data_1, data_2, data_3, validator;
    
    // 1. type (either bool or None)
    schema = {
        'type': 'object',
        'properties': {'a': {'type': 'boolean'}}
    };
    wrong_data = {'a': 1};
    data_1 = {'a': true};
    data_2 = {'a': false};
    data_3 = {'a': null};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
    expect(validator.validate(data_3).isValid).toBe(true);

    // 2. required (only bool)
    schema['properties']['a']['required'] = true;
    wrong_data = {'a': null};
    data_1 = {'a': true};
    data_2 = {'a': false};
});

test('validateInteger method', () => {
    let schema,
        wrong_data, wrong_data_1, wrong_data_2, wrong_data_3, wrong_data_4,
        data, data_1, data_2, data_3, data_4,
        validator;
    
    // 1. type (either int or null)
    schema = {
        'type': 'object',
        'properties': {'a': {'type': 'integer'}}
    };
    wrong_data_1 = {'a': '1'};
    wrong_data_2 = {'a': 1.1};
    data_1 = {'a': 1};
    data_2 = {'a': 0};
    data_3 = {'a': -1};
    data_4 = {'a': null};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
    expect(validator.validate(data_3).isValid).toBe(true);
    expect(validator.validate(data_4).isValid).toBe(true);

    // 2. required (only int)
    schema['properties']['a']['required'] = true;
    wrong_data = {'a': null};
    data = {'a': 1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 3. 1.0 must be treated as 1
    data = {'a': 1.0};
    validator = new DataValidator(schema);
    expect(validator.validate(data).isValid).toBe(true);

    // 4. minimum & maximum
    schema['properties']['a']['minimum'] = 2;
    schema['properties']['a']['maximum'] = 5;
    wrong_data_1 = {'a': 1};
    wrong_data_2 = {'a': 6};
    data_1 = {'a': 2};
    data_2 = {'a': 3};
    data_3 = {'a': 5};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
    expect(validator.validate(data_3).isValid).toBe(true);

    // 5. minimum when zero
    delete schema['properties']['a']['maximum'];
    schema['properties']['a']['minimum'] = 0;
    wrong_data = {'a': -1};
    data_1 = {'a': 0};
    data_2 = {'a': 1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 6. maximum when zero
    schema['properties']['a']['maximum'] = 0;
    delete schema['properties']['a']['minimum'];
    wrong_data = {'a': 1};
    data_1 = {'a': 0};
    data_2 = {'a': -1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 7. exclusiveMinimum & exclusiveMaximum
    delete schema['properties']['a']['maximum'];
    schema['properties']['a']['exclusiveMinimum'] = 2;
    schema['properties']['a']['exclusiveMaximum'] = 5;
    wrong_data_1 = {'a': 1};
    wrong_data_2 = {'a': 6};
    wrong_data_3 = {'a': 2};
    wrong_data_4 = {'a': 5};
    data_1 = {'a': 3};
    data_2 = {'a': 4};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(wrong_data_3).isValid).toBe(false);
    expect(validator.validate(wrong_data_4).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 8. exclusiveMinimum when zero
    schema['properties']['a']['exclusiveMinimum'] = 0;
    delete schema['properties']['a']['exclusiveMaximum'];
    wrong_data_1 = {'a': -1};
    wrong_data_2 = {'a': 0};
    data = {'a': 1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 9. exclusiveMaximum when zero
    delete schema['properties']['a']['exclusiveMinimum'];
    schema['properties']['a']['exclusiveMaximum'] = 0;
    wrong_data_1 = {'a': 1};
    wrong_data_2 = {'a': 0};
    data = {'a': -1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 10. multpleOf
    delete schema['properties']['a']['exclusiveMaximum'];
    schema['properties']['a']['multipleOf'] = 2
    wrong_data = {'a': 1};
    data = {'a': 4};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});

test('validateNumber method', () => {
    let schema,
        wrong_data, wrong_data_1, wrong_data_2, wrong_data_3, wrong_data_4,
        data, data_1, data_2, data_3, data_4,
        validator;
    
    // 1. type (either float or int or null)
    schema = {
        'type': 'object',
        'properties': {'a': {'type': 'number'}}
    };
    wrong_data = {'a': '1'};
    data_1 = {'a': 1.0};
    data_2 = {'a': 0};
    data_3 = {'a': -1.5};
    data_4 = {'a': null};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
    expect(validator.validate(data_3).isValid).toBe(true);
    expect(validator.validate(data_4).isValid).toBe(true);

    // 2. required (only float or int)
    schema['properties']['a']['required'] = true;
    wrong_data = {'a': null};
    data_1 = {'a': 1.1};
    data_2 = {'a': 1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 3. minimum & maximum
    schema['properties']['a']['minimum'] = 2.5;
    schema['properties']['a']['maximum'] = 5.2;
    wrong_data_1 = {'a': 2.4};
    wrong_data_2 = {'a': 5.25};
    data_1 = {'a': 2.5};
    data_2 = {'a': 3.0};
    data_3 = {'a': 5.2};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);
    expect(validator.validate(data_3).isValid).toBe(true);

    // 4. minimum when zero
    delete schema['properties']['a']['maximum'];
    schema['properties']['a']['minimum'] = 0.0;
    wrong_data = {'a': -0.1};
    data_1 = {'a': 0.0};
    data_2 = {'a': 1.0};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 5. maximum when zero
    schema['properties']['a']['maximum'] = 0.0;
    delete schema['properties']['a']['minimum'];
    wrong_data = {'a': 0.1};
    data_1 = {'a': 0.0};
    data_2 = {'a': -0.1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 6. exclusiveMinimum & exclusiveMaximum
    delete schema['properties']['a']['maximum'];
    schema['properties']['a']['exclusiveMinimum'] = 2.5;
    schema['properties']['a']['exclusiveMaximum'] = 5.2;
    wrong_data_1 = {'a': 1.0};
    wrong_data_2 = {'a': 6.0};
    wrong_data_3 = {'a': 2.5};
    wrong_data_4 = {'a': 5.2};
    data_1 = {'a': 2.6};
    data_2 = {'a': 5.1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(wrong_data_3).isValid).toBe(false);
    expect(validator.validate(wrong_data_4).isValid).toBe(false);
    expect(validator.validate(data_1).isValid).toBe(true);
    expect(validator.validate(data_2).isValid).toBe(true);

    // 7. exclusiveMinimum when zero
    schema['properties']['a']['exclusiveMinimum'] = 0.0;
    delete schema['properties']['a']['exclusiveMaximum'];
    wrong_data_1 = {'a': -0.1};
    wrong_data_2 = {'a': 0.0};
    data = {'a': 0.1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 8. exclusiveMaximum when zero
    delete schema['properties']['a']['exclusiveMinimum'];
    schema['properties']['a']['exclusiveMaximum'] = 0.0;
    wrong_data_1 = {'a': 0.1};
    wrong_data_2 = {'a': 0};
    data = {'a': -0.1};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data_1).isValid).toBe(false);
    expect(validator.validate(wrong_data_2).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);

    // 9. multpleOf
    delete schema['properties']['a']['exclusiveMaximum'];
    schema['properties']['a']['multipleOf'] = 0.2
    wrong_data = {'a': 4.15};
    data = {'a': 4.0};
    validator = new DataValidator(schema);
    expect(validator.validate(wrong_data).isValid).toBe(false);
    expect(validator.validate(data).isValid).toBe(true);
});
