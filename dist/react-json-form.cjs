var React$1 = require('react');
var ReactModal = require('react-modal');
var ReactDOM = require('react-dom');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React$1);
var ReactModal__default = /*#__PURE__*/_interopDefaultLegacy(ReactModal);
var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM);

function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };
  return _extends.apply(this, arguments);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

/* Symbol for joining coordinates.
 * Earlier, a hyphen (-) was used. But that caused problems when
 * object keys had hyphen in them. So, we're switching to a less
 * commonly used symbol.
*/
const JOIN_SYMBOL = '§';
/* HTML field name prefix */

const FIELD_NAME_PREFIX = 'rjf';
/* Filler item for arrays to make them at least minItems long */

const FILLER = '__RJF_FILLER__';

const EditorContext = /*#__PURE__*/React__default["default"].createContext();
function capitalize$1(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
}
function convertType(value, to) {
  if (typeof value === to) return value;

  if (to === 'number' || to === 'integer') {
    if (typeof value === 'string') {
      value = value.trim();
      if (value === '') value = null;else if (!isNaN(Number(value))) value = Number(value);
    } else if (typeof value === 'boolean') {
      value = value === true ? 1 : 0;
    }
  } else if (to === 'boolean') {
    if (value === 'false' || value === false) value = false;else value = true;
  }

  return value;
}
function actualType(value) {
  /* Returns the "actual" type of the given value.
       - array -> 'array'
      - null -> 'null'
  */
  let type = typeof value;

  if (type === 'object') {
    if (Array.isArray(value)) type = 'array';else if (value === null) type = 'null';
  }

  return type;
}
function getSchemaType(schema) {
  /* Returns type of the given schema.
      If schema.type is not present, it tries to guess the type.
      If data is given, it will try to use that to guess the type.
  */
  let type;
  if (schema.hasOwnProperty('const')) type = actualType(schema.const);else type = normalizeKeyword(schema.type);

  if (!type) {
    if (schema.hasOwnProperty('properties') || schema.hasOwnProperty('keys')) type = 'object';else if (schema.hasOwnProperty('items')) type = 'array';else if (schema.hasOwnProperty('allOf')) type = 'allOf';else if (schema.hasOwnProperty('oneOf')) type = 'oneOf';else if (schema.hasOwnProperty('anyOf')) type = 'anyOf';else type = 'string';
  }

  return type;
}
function getVerboseName(name) {
  if (name === undefined || name === null) return '';
  name = name.replace(/_/g, ' ');
  return capitalize$1(name);
}
function getCsrfCookie() {
  let csrfCookies = document.cookie.split(';').filter(item => item.trim().indexOf('csrftoken=') === 0);

  if (csrfCookies.length) {
    return csrfCookies[0].split('=')[1];
  } else {
    // if no cookie found, get the value from the csrf form input
    let input = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (input) return input.value;
  }

  return null;
}
function joinCoords() {
  /* Generates coordinates from given arguments */
  return Array.from(arguments).join(JOIN_SYMBOL);
}
function splitCoords(coords) {
  /* Generates coordinates */
  return coords.split(JOIN_SYMBOL);
}
function getCoordsFromName(name) {
  /* Returns coordinates of a field in the data from
   * the given name of the input.
   * Field names have FIELD_NAME_PREFIX prepended but the coordinates don't.
   * e.g.:
   * name: rjf-0-field (where rjf- is the FIELD_NAME_PREFIX)
   * coords: 0-field
  */
  return name.slice((FIELD_NAME_PREFIX + JOIN_SYMBOL).length);
}
function debounce(func, wait) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    let args = arguments;
    let context = this;
    timeout = setTimeout(function () {
      func.apply(context, args);
    }, wait || 1);
  };
}
function normalizeKeyword(kw) {
  /* Converts custom supported keywords to standard JSON schema keywords */
  if (Array.isArray(kw)) kw = kw.find(k => k !== 'null') || 'null';

  switch (kw) {
    case 'list':
      return 'array';

    case 'dict':
      return 'object';

    case 'keys':
      return 'properties';

    case 'choices':
      return 'enum';

    case 'datetime':
      return 'date-time';

    default:
      return kw;
  }
}
function getKeyword(obj, keyword, alias, default_value) {
  /* Function useful for getting value from schema if a
   * keyword has an alias.
  */
  return getKey(obj, keyword, getKey(obj, alias, default_value));
}
function getKey(obj, key, default_value) {
  /* Approximation of Python's dict.get() function. */
  let val = obj[key];
  return typeof val !== 'undefined' ? val : default_value;
}
function valueInChoices(schema, value) {
  /* Checks whether the given value is in schema choices or not.
     If schema doesn't have choices, returns true.
  */
  let choices = getKeyword(schema, 'choices', 'enum');
  if (!choices) return true;
  let found = choices.find(choice => {
    if (typeof choice == 'object') choice = choice.value;
    return value == choice;
  });
  return found !== undefined ? true : false;
}
/* Set operations */

function isEqualset(a, b) {
  return a.size === b.size && Array.from(a).every(i => b.has(i));
}
function isSubset(set, superset) {
  for (const elem of set) {
    if (!superset.has(elem)) {
      return false;
    }
  }

  return true;
}

function getBlankObject(schema, getRef) {
  let keys = {};
  let schema_keys = getKeyword(schema, 'keys', 'properties', {});

  for (let key in schema_keys) {
    let value = schema_keys[key];
    let isRef = value.hasOwnProperty('$ref');
    let isConst = value.hasOwnProperty('const');
    if (isRef) value = getRef(value['$ref']);
    let type = normalizeKeyword(value.type);

    if (!type) {
      // check for oneOf/anyOf
      if (value.hasOwnProperty('oneOf')) value = value.oneOf[0];else if (value.hasOwnProperty('anyOf')) value = value.anyOf[0];
      type = normalizeKeyword(value.type);
    }

    let default_ = value.default;

    if (isConst) {
      type = actualType(value.const);
      default_ = value.const;
    }

    if (type === 'array') keys[key] = isRef ? [] : getBlankArray(value, getRef);else if (type === 'object') keys[key] = getBlankObject(value, getRef);else if (type === 'boolean') keys[key] = default_ === false ? false : default_ || null;else if (type === 'integer' || type === 'number') keys[key] = default_ === 0 ? 0 : default_ || null;else keys[key] = default_ || '';
  }

  if (schema.hasOwnProperty('oneOf')) keys = _extends({}, keys, getBlankObject(schema.oneOf[0]));
  if (schema.hasOwnProperty('anyOf')) keys = _extends({}, keys, getBlankObject(schema.anyOf[0]));

  if (schema.hasOwnProperty('allOf')) {
    for (let i = 0; i < schema.allOf.length; i++) {
      keys = _extends({}, keys, getBlankObject(schema.allOf[i]));
    }
  }

  return keys;
}
function getBlankArray(schema, getRef) {
  let minItems = getKeyword(schema, 'minItems', 'min_items') || 0;
  if (schema.default && schema.default.length >= minItems) return schema.default;
  let items = [];
  if (schema.default) items = [...schema.default];
  if (minItems === 0) return items;

  if (schema.items.hasOwnProperty('$ref')) {
    // :TODO: this mutates the original schema
    // but i'll fix it later
    schema.items = getRef(schema.items['$ref']);
  }

  let type = normalizeKeyword(schema.items.type);

  if (!type) {
    if (Array.isArray(schema.items['oneOf'])) type = getSchemaType(schema.items.oneOf[0]);else if (Array.isArray(schema.items['anyOf'])) type = getSchemaType(schema.items.anyOf[0]);else if (Array.isArray(schema.items['allOf'])) type = getSchemaType(schema.items.allOf[0]);else if (schema.items.hasOwnProperty('const')) type = actualType(schema.items.const);
  }

  if (type === 'array') {
    while (items.length < minItems) items.push(getBlankArray(schema.items, getRef));

    return items;
  } else if (type === 'object') {
    while (items.length < minItems) items.push(getBlankObject(schema.items, getRef));

    return items;
  } else if (type === 'oneOf') {
    while (items.length < minItems) items.push(getBlankOneOf(schema.items, getRef));

    return items;
  } else if (type === 'anyOf') {
    while (items.length < minItems) items.push(getBlankOneOf(schema.items, getRef));

    return items;
  }

  if (schema.items.widget === 'multiselect') return items;
  let default_ = schema.items.default;
  if (schema.items.hasOwnProperty('const')) default_ = schema.items.const;

  if (type === 'boolean') {
    while (items.length < minItems) items.push(default_ === false ? false : default_ || null);
  } else if (type === 'integer' || type === 'number') {
    while (items.length < minItems) items.push(default_ === 0 ? 0 : default_ || null);
  } else {
    // string, etc.
    while (items.length < minItems) items.push(default_ || '');
  }

  return items;
}
function getBlankAllOf(schema, getRef) {
  // currently, we support allOf only inside an object
  return getBlankObject(schema, getRef);
}
function getBlankOneOf(schema, getRef) {
  // for blank data, we always return the first option
  let nextSchema = schema.oneOf[0];
  getSchemaType(nextSchema);
  return getBlankData(nextSchema, getRef);
}
function getBlankAnyOf(schema, getRef) {
  // for blank data, we always return the first option
  let nextSchema = schema.anyOf[0];
  getSchemaType(nextSchema);
  return getBlankData(nextSchema, getRef);
}
function getBlankData(schema, getRef) {
  if (schema.hasOwnProperty('$ref')) schema = getRef(schema['$ref']);
  let type = getSchemaType(schema);
  let default_ = schema.default;

  if (schema.hasOwnProperty('const')) {
    type = actualType(schema.const);
    default_ = schema.const;
  }

  if (type === 'array') return getBlankArray(schema, getRef);else if (type === 'object') return getBlankObject(schema, getRef);else if (type === 'allOf') return getBlankAllOf(schema, getRef);else if (type === 'oneOf') return getBlankOneOf(schema, getRef);else if (type === 'anyOf') return getBlankAnyOf(schema, getRef);else if (type === 'boolean') return default_ === false ? false : default_ || null;else if (type === 'integer' || type === 'number') return default_ === 0 ? 0 : default_ || null;else // string, etc.
    return default_ || '';
}

function getSyncedArray(data, schema, getRef) {
  if (data === null) data = [];
  if (actualType(data) !== 'array') throw new Error("Schema expected an 'array' but the data type was '" + actualType(data) + "'");
  let newData = JSON.parse(JSON.stringify(data));

  if (schema.items.hasOwnProperty('$ref')) {
    // :TODO: this will most probably mutate the original schema
    // but i'll fix it later
    schema.items = getRef(schema.items['$ref']);
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

  while (data.length < minItems) data.push(FILLER);

  for (let i = 0; i < data.length; i++) {
    let item = data[i];

    if (type === 'array') {
      if (item === FILLER) item = [];
      newData[i] = getSyncedArray(item, schema.items, getRef);
    } else if (type === 'object') {
      if (item === FILLER) item = {};
      newData[i] = getSyncedObject(item, schema.items, getRef);
    } else {
      // if the current value is not in choices, we reset to blank
      if (!valueInChoices(schema.items, newData[i])) item = FILLER;

      if (item === FILLER) {
        if (type === 'integer' || type === 'number') newData[i] = default_ === 0 ? 0 : default_ || null;else if (type === 'boolean') newData[i] = default_ === false ? false : default_ || null;else newData[i] = default_ || '';
      }
    }

    if (schema.items.hasOwnProperty('const')) newData[i] = schema.items.const;
  }

  return newData;
}

function getSyncedObject(data, schema, getRef) {
  if (data === null) data = {};
  if (actualType(data) !== 'object') throw new Error("Schema expected an 'object' but the data type was '" + actualType(data) + "'");
  let newData = JSON.parse(JSON.stringify(data));
  let schema_keys = getKeyword(schema, 'keys', 'properties', {});

  if (schema.hasOwnProperty('allOf')) {
    for (let i = 0; i < schema.allOf.length; i++) {
      // ignore items in allOf which are not object
      if (getSchemaType(schema.allOf[i]) !== 'object') continue;
      schema_keys = _extends({}, schema_keys, getKeyword(schema.allOf[i], 'properties', 'keys', {}));
    }
  }

  let keys = [...Object.keys(schema_keys)];

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let schemaValue = schema_keys[key];
    let isRef = schemaValue.hasOwnProperty('$ref');
    if (isRef) schemaValue = getRef(schemaValue['$ref']);
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
      if (type === 'array') newData[key] = getSyncedArray([], schemaValue, getRef);else if (type === 'object') newData[key] = getSyncedObject({}, schemaValue, getRef);else if (type === 'boolean') newData[key] = default_ === false ? false : default_ || null;else if (type === 'integer' || type === 'number') newData[key] = default_ === 0 ? 0 : default_ || null;else newData[key] = default_ || '';
    } else {
      if (type === 'array') newData[key] = getSyncedArray(data[key], schemaValue, getRef);else if (type === 'object') newData[key] = getSyncedObject(data[key], schemaValue, getRef);else {
        // if the current value is not in choices, we reset to blank
        if (!valueInChoices(schemaValue, data[key])) data[key] = '';

        if (data[key] === '') {
          if (type === 'integer' || type === 'number') newData[key] = default_ === 0 ? 0 : default_ || null;else if (type === 'boolean') newData[key] = default_ === false ? false : default_ || null;else newData[key] = default_ || '';
        } else {
          newData[key] = data[key];
        }
      }
    }

    if (schemaValue.hasOwnProperty('const')) newData[key] = schemaValue.const;
  }

  return newData;
}

function getSyncedAllOf(data, schema, getRef) {
  // currently we only support allOf inside an object
  // so, we'll treat the curent schema and data to be an object
  return getSyncedObject(data, schema, getRef);
}
function getSyncedOneOf(data, schema, getRef) {
  let index = findMatchingSubschemaIndex(data, schema, getRef, 'oneOf');
  let subschema = schema['oneOf'][index];
  let syncFunc = getSyncFunc(getSchemaType(subschema));
  if (syncFunc) return syncFunc(data, subschema, getRef);
  return data;
}
function getSyncedAnyOf(data, schema, getRef) {
  let index = findMatchingSubschemaIndex(data, schema, getRef, 'anyOf');
  let subschema = schema['anyOf'][index];
  let syncFunc = getSyncFunc(getSchemaType(subschema));
  if (syncFunc) return syncFunc(data, subschema, getRef);
  return data;
}
function getSyncedData(data, schema, getRef) {
  // adds those keys to data which are in schema but not in data
  if (schema.hasOwnProperty('$ref')) schema = getRef(schema['$ref']);
  let type = getSchemaType(schema);
  let syncFunc = getSyncFunc(type);
  if (syncFunc) return syncFunc(data, schema, getRef);
  return data;
}

function getSyncFunc(type) {
  if (type === 'array') return getSyncedArray;else if (type === 'object') return getSyncedObject;else if (type === 'allOf') return getSyncedAllOf;else if (type === 'oneOf') return getSyncedOneOf;else if (type === 'anyOf') return getSyncedAnyOf;
  return null;
}

function findMatchingSubschemaIndex(data, schema, getRef, schemaName) {
  let dataType = actualType(data);
  let subschemas = schema[schemaName];
  let index = null;

  for (let i = 0; i < subschemas.length; i++) {
    let subschema = subschemas[i];
    if (subschema.hasOwnProperty('$ref')) subschema = getRef(subschema['$ref']);
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
      if (subschema.hasOwnProperty('$ref')) subschema = getRef(subschema['$ref']);
      let subType = getSchemaType(subschema);

      if (dataType === subType) {
        index = i;
        break;
      }
    }
  }

  return index;
}
function dataObjectMatchesSchema(data, subschema) {
  let dataType = actualType(data);
  let subType = getSchemaType(subschema);
  if (subType !== dataType) return false;
  let subSchemaKeys = getKeyword(subschema, 'properties', 'keys', {}); // check if all keys in the schema are present in the data

  keyset1 = new Set(Object.keys(data));
  keyset2 = new Set(Object.keys(subSchemaKeys));

  if (subschema.hasOwnProperty('additionalProperties')) {
    // subSchemaKeys must be a subset of data
    if (!isSubset(keyset2, keyset1)) return false;
  } else {
    // subSchemaKeys must be equal to data
    if (!isEqualset(keyset2, keyset1)) return false;
  }

  for (let key in subSchemaKeys) {
    if (!subSchemaKeys.hasOwnProperty(key)) continue;
    if (!data.hasOwnProperty(key)) return false;

    if (subSchemaKeys[key].hasOwnProperty('const')) {
      if (subSchemaKeys[key].const !== data[key]) return false;
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
    } // TODO: also check minimum, maximum, etc. keywords

  } // if here, all checks have passed


  return true;
}
function dataArrayMatchesSchema(data, subschema) {
  let dataType = actualType(data);
  let subType = getSchemaType(subschema);
  if (subType !== dataType) return false;
  let itemsType = subschema.items.type; // Temporary. Nested subschemas inside array.items won't work.
  // check each item in data conforms to array items.type

  for (let i = 0; i < data.length; i++) {
    dataValueType = actualType(data[i]);

    if (subschema.items.hasOwnProperty('const')) {
      if (subschema.items.const !== data[i]) return false;
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
  } // if here, all checks have passed


  return true;
}

const _excluded$2 = ["className", "alterClassName"];
function Button(_ref) {
  let {
    className,
    alterClassName
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, _excluded$2);

  if (!className) className = '';
  let classes = className.split(' ');

  if (alterClassName !== false) {
    className = '';

    for (let i = 0; i < classes.length; i++) {
      className = className + 'rjf-' + classes[i] + '-button ';
    }
  }

  return /*#__PURE__*/React.createElement("button", _extends({
    className: className.trim(),
    type: "button"
  }, props), props.children);
}

function Loader(props) {
  let className = 'rjf-loader';
  if (props.className) className = className + ' ' + props.className;
  return /*#__PURE__*/React.createElement("div", {
    className: className
  });
}

function Icon(props) {
  let icon;

  switch (props.name) {
    case 'chevron-up':
      icon = /*#__PURE__*/React__default["default"].createElement(ChevronUp, null);
      break;

    case 'chevron-down':
      icon = /*#__PURE__*/React__default["default"].createElement(ChevronDown, null);
      break;

    case 'arrow-down':
      icon = /*#__PURE__*/React__default["default"].createElement(ArrowDown, null);
      break;

    case 'x-lg':
      icon = /*#__PURE__*/React__default["default"].createElement(XLg, null);
      break;

    case 'x-circle':
      icon = /*#__PURE__*/React__default["default"].createElement(XCircle, null);
      break;

    case 'three-dots-vertical':
      icon = /*#__PURE__*/React__default["default"].createElement(ThreeDotsVertical, null);
      break;
  }

  return /*#__PURE__*/React__default["default"].createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "16",
    height: "16",
    fill: "currentColor",
    className: "rjf-icon rjf-icon-" + props.name,
    viewBox: "0 0 16 16"
  }, icon);
}

function ChevronUp(props) {
  return /*#__PURE__*/React__default["default"].createElement("path", {
    fillRule: "evenodd",
    d: "M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"
  });
}

function ChevronDown(props) {
  return /*#__PURE__*/React__default["default"].createElement("path", {
    fillRule: "evenodd",
    d: "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
  });
}

function ArrowDown(props) {
  return /*#__PURE__*/React__default["default"].createElement("path", {
    "fill-rule": "evenodd",
    d: "M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"
  });
}

function XLg(props) {
  return /*#__PURE__*/React__default["default"].createElement("path", {
    d: "M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
  });
}

function XCircle(props) {
  return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, /*#__PURE__*/React__default["default"].createElement("path", {
    d: "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
  }), /*#__PURE__*/React__default["default"].createElement("path", {
    d: "M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
  }));
}

function ThreeDotsVertical(props) {
  return /*#__PURE__*/React__default["default"].createElement("path", {
    d: "M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
  });
}

class TimePicker extends React__default["default"].Component {
  constructor(...args) {
    super(...args);

    this.sendValue = data => {
      this.props.onChange(data);
    };

    this.validateValue = (name, value) => {
      if (name === 'hh' && value < 1) return 12;else if (name !== 'hh' && value < 0) return 59;else if (name === 'hh' && value > 12) return 1;else if (name !== 'hh' && value > 59) return 0;
      return value;
    };

    this.handleChange = e => {
      let name = e.target.dataset.name;
      let value = e.target.value;
      if (isNaN(value)) return;
      let validValue = this.validateValue(name, parseInt(value) || 0);
      if (name === 'hh' && (value === '0' || value === '' || value === '00') && validValue === 1) validValue = 0;

      if (value.startsWith('0') && validValue < 10 && validValue !== 0) {
        validValue = validValue.toString().padStart(2, '0');
      }

      this.sendValue({
        [name]: value !== '' ? validValue.toString() : ''
      });
    };

    this.handleKeyDown = e => {
      if (e.keyCode !== 38 && e.keyCode !== 40) return;
      let name = e.target.dataset.name;
      let value = parseInt(e.target.value) || 0;

      if (e.keyCode === 38) {
        value++;
      } else if (e.keyCode === 40) {
        value--;
      }

      this.sendValue({
        [name]: this.validateValue(name, value).toString().padStart(2, '0')
      });
    };

    this.handleSpin = (name, type) => {
      let value = this.props[name];

      if (name === 'ampm') {
        value = value === 'am' ? 'pm' : 'am';
      } else {
        value = parseInt(value) || 0;

        if (type === 'up') {
          value++;
        } else {
          value--;
        }

        value = this.validateValue(name, value).toString().padStart(2, '0');
      }

      this.sendValue({
        [name]: value
      });
    };

    this.handleBlur = e => {
      let value = this.validateValue(e.target.dataset.name, parseInt(e.target.value) || 0);

      if (value < 10) {
        this.sendValue({
          [e.target.dataset.name]: value.toString().padStart(2, '0')
        });
      }
    };
  }

  componentWillUnmount() {
    let data = {
      hh: this.validateValue('hh', this.props.hh).toString().padStart(2, '0'),
      mm: this.validateValue('mm', this.props.mm).toString().padStart(2, '0'),
      ss: this.validateValue('ss', this.props.ss).toString().padStart(2, '0')
    };
    this.sendValue(data);
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-row rjf-time-picker-labels"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, "Hrs"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, "Min"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, "Sec"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, "am/pm")), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-row"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('hh', 'up')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-up"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('mm', 'up')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-up"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('ss', 'up')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-up"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('ampm', 'up')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-up"
    })))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-row rjf-time-picker-values"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement("input", {
      type: "text",
      "data-name": "hh",
      value: this.props.hh,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onKeyDown: this.handleKeyDown
    })), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }, ":"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement("input", {
      type: "text",
      "data-name": "mm",
      value: this.props.mm,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onKeyDown: this.handleKeyDown
    })), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }, ":"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement("input", {
      type: "text",
      "data-name": "ss",
      value: this.props.ss,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onKeyDown: this.handleKeyDown
    })), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, this.props.ampm)), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-row"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('hh', 'down')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-down"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('mm', 'down')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-down"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('ss', 'down')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-down"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: () => this.handleSpin('ampm', 'down')
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "chevron-down"
    })))));
  }

}

const _excluded$1 = ["label", "help_text", "error", "inputRef"],
      _excluded2 = ["label", "help_text", "error", "value"],
      _excluded3 = ["label", "help_text", "error", "value", "options"],
      _excluded4 = ["label", "help_text", "error", "value", "options"],
      _excluded5 = ["label", "value"],
      _excluded6 = ["label", "help_text", "error", "inputRef"];
function Label(props) {
  if (!props.label) return null;
  return /*#__PURE__*/React__default["default"].createElement("label", {
    className: props.required ? 'rjf-required' : null
  }, props.children, props.children && ' ', props.label);
}
function FormInput(_ref) {
  let {
    label,
    help_text,
    error,
    inputRef
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, _excluded$1);

  if (props.type === 'string') props.type = 'text';
  if (inputRef) props.ref = inputRef;
  if (props.value === null) props.value = '';
  let wrapperProps = {};
  if (props.type == 'hidden') wrapperProps['style'] = {
    display: 'none'
  }; // readonly inputs are automatically marked disabled
  // if this is undesired, explicitly pass disabled=false

  if (props.readOnly && (props.disabled === undefined || props.disabled === null)) props.disabled = true;
  return /*#__PURE__*/React__default["default"].createElement("div", wrapperProps, /*#__PURE__*/React__default["default"].createElement(Label, {
    label: label,
    required: props.required
  }), /*#__PURE__*/React__default["default"].createElement("div", {
    className: error ? "rjf-input-group has-error" : "rjf-input-group"
  }, props.children || /*#__PURE__*/React__default["default"].createElement("input", props), error && error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-error-text",
    key: i
  }, error)), help_text && /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-help-text"
  }, help_text)));
}
function FormCheckInput(_ref2) {
  let {
    label,
    help_text,
    error,
    value
  } = _ref2,
      props = _objectWithoutPropertiesLoose(_ref2, _excluded2);

  if (!label) label = props.name.toUpperCase();
  if (props.type === 'bool') props.type = 'checkbox';
  if (props.checked === undefined) props.checked = value;
  if (props.checked === '' || props.checked === null || props.checked === undefined) props.checked = false;
  if (props.readOnly) props.disabled = true;
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: error ? "rjf-check-input has-error" : "rjf-check-input"
  }, /*#__PURE__*/React__default["default"].createElement(Label, {
    label: label,
    required: props.required
  }, /*#__PURE__*/React__default["default"].createElement("input", props)), error && error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-error-text",
    key: i
  }, error)), help_text && /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-help-text"
  }, help_text));
}
function FormRadioInput(_ref3) {
  let {
    label,
    help_text,
    error,
    value,
    options
  } = _ref3,
      props = _objectWithoutPropertiesLoose(_ref3, _excluded3);

  if (props.readOnly) props.disabled = true;
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: error ? "rjf-check-input has-error" : "rjf-check-input"
  }, /*#__PURE__*/React__default["default"].createElement(Label, {
    label: label,
    required: props.required
  }), options.map((option, i) => {
    let title, inputValue;

    if (typeof option === 'object') {
      title = option.title || option.label;
      inputValue = option.value;
    } else {
      title = option;
      if (typeof title === 'boolean') title = capitalize$1(title.toString());
      inputValue = option;
    }

    return /*#__PURE__*/React__default["default"].createElement("label", {
      className: "rjf-radio-option",
      key: title + '_' + inputValue + '_' + i
    }, /*#__PURE__*/React__default["default"].createElement("input", _extends({}, props, {
      value: inputValue,
      checked: inputValue === value
    })), " ", title);
  }), error && error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-error-text",
    key: i
  }, error)), help_text && /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-help-text"
  }, help_text));
}
function FormSelectInput(_ref4) {
  let {
    label,
    help_text,
    error,
    value,
    options
  } = _ref4,
      props = _objectWithoutPropertiesLoose(_ref4, _excluded4);

  if (props.readOnly) props.disabled = true;
  if (!value && value !== false && value !== 0) value = '';
  return /*#__PURE__*/React__default["default"].createElement("div", null, /*#__PURE__*/React__default["default"].createElement(Label, {
    label: label,
    required: props.required
  }), /*#__PURE__*/React__default["default"].createElement("div", {
    className: error ? "rjf-input-group has-error" : "rjf-input-group"
  }, /*#__PURE__*/React__default["default"].createElement("select", _extends({
    value: value
  }, props), /*#__PURE__*/React__default["default"].createElement("option", {
    disabled: true,
    value: "",
    key: '__placeholder'
  }, "Select..."), options.map((option, i) => {
    let title, inputValue;

    if (typeof option === 'object') {
      title = option.title || option.label;
      inputValue = option.value;
    } else {
      title = option;
      if (typeof title === 'boolean') title = capitalize$1(title.toString());
      inputValue = option;
    }

    return /*#__PURE__*/React__default["default"].createElement("option", {
      value: inputValue,
      key: title + '_' + inputValue + '_' + i
    }, title);
  })), error && error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-error-text",
    key: i
  }, error)), help_text && /*#__PURE__*/React__default["default"].createElement("span", {
    className: "rjf-help-text"
  }, help_text)));
}
class FormMultiSelectInput extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.handleChange = e => {
      let value = [...this.props.value];
      let val = e.target.value;
      if (typeof val !== this.props.valueType) val = convertType(val, this.props.valueType);

      if (e.target.checked) {
        value.push(val);
      } else {
        value = value.filter(item => {
          return item !== val;
        });
      }

      let event = {
        target: {
          type: this.props.type,
          value: value,
          name: this.props.name
        }
      };
      this.props.onChange(event);
    };

    this.showOptions = e => {
      if (!this.state.showOptions) this.setState({
        showOptions: true
      });
    };

    this.hideOptions = e => {
      this.setState({
        showOptions: false
      });
    };

    this.toggleOptions = e => {
      this.setState(state => ({
        showOptions: !state.showOptions
      }));
    };

    this.state = {
      showOptions: false
    };
    this.optionsContainer = /*#__PURE__*/React__default["default"].createRef();
    this.input = /*#__PURE__*/React__default["default"].createRef();
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: this.props.readOnly ? "rjf-multiselect-field readonly" : "rjf-multiselect-field"
    }, /*#__PURE__*/React__default["default"].createElement(FormInput, {
      label: this.props.label,
      help_text: this.props.help_text,
      error: this.props.error
    }, /*#__PURE__*/React__default["default"].createElement(FormMultiSelectInputField, {
      inputRef: this.input,
      onClick: this.toggleOptions,
      value: this.props.value,
      onChange: this.handleChange,
      disabled: this.props.readOnly,
      placeholder: this.props.placeholder
    })), this.state.showOptions && /*#__PURE__*/React__default["default"].createElement(FormMultiSelectInputOptions, {
      options: this.props.options,
      value: this.props.value,
      hideOptions: this.hideOptions,
      onChange: this.handleChange,
      containerRef: this.optionsContainer,
      inputRef: this.input,
      disabled: this.props.readOnly,
      hasHelpText: (this.props.help_text || this.props.error) && 1
    }));
  }

}
class FormMultiSelectInputField extends React__default["default"].Component {
  constructor(...args) {
    super(...args);

    this.handleRemove = (e, index) => {
      e.stopPropagation(); // we create a fake event object for the onChange handler

      let event = {
        target: {
          value: this.props.value[index],
          checked: false
        }
      };
      this.props.onChange(event);
    };
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-multiselect-field-input",
      onClick: this.props.onClick,
      ref: this.props.inputRef,
      tabIndex: 0
    }, this.props.value.length ? this.props.value.map((item, index) => /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-multiselect-field-input-item",
      key: item + '_' + index
    }, /*#__PURE__*/React__default["default"].createElement("span", null, item), this.props.disabled || /*#__PURE__*/React__default["default"].createElement("button", {
      title: "Remove",
      type: "button",
      onClick: e => this.handleRemove(e, index)
    }, "\xD7"))) : /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-multiselect-field-input-placeholder"
    }, this.props.placeholder || 'Select...'));
  }

}
class FormMultiSelectInputOptions extends React__default["default"].Component {
  constructor(...args) {
    super(...args);

    this.handleClickOutside = e => {
      if (this.props.containerRef.current && !this.props.containerRef.current.contains(e.target) && !this.props.inputRef.current.contains(e.target)) this.props.hideOptions();
    };
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      ref: this.props.containerRef
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-multiselect-field-options-container",
      style: this.props.hasHelpText ? {
        marginTop: '-15px'
      } : {}
    }, this.props.options.map((option, i) => {
      let title, inputValue;

      if (typeof option === 'object') {
        title = option.title || option.label;
        inputValue = option.value;
      } else {
        title = option;
        if (typeof title === 'boolean') title = capitalize$1(title.toString());
        inputValue = option;
      }

      let selected = this.props.value.indexOf(inputValue) > -1;
      let optionClassName = 'rjf-multiselect-field-option';
      if (selected) optionClassName += ' selected';
      if (this.props.disabled) optionClassName += ' disabled';
      return /*#__PURE__*/React__default["default"].createElement("div", {
        key: title + '_' + inputValue + '_' + i,
        className: optionClassName
      }, /*#__PURE__*/React__default["default"].createElement("label", null, /*#__PURE__*/React__default["default"].createElement("input", {
        type: "checkbox",
        onChange: this.props.onChange,
        value: inputValue,
        checked: selected,
        disabled: this.props.disabled
      }), " ", title));
    })));
  }

}
function dataURItoBlob(dataURI) {
  // Split metadata from data
  const splitted = dataURI.split(","); // Split params

  const params = splitted[0].split(";"); // Get mime-type from params

  const type = params[0].replace("data:", ""); // Filter the name property from params

  const properties = params.filter(param => {
    return param.split("=")[0] === "name";
  }); // Look for the name and use unknown if no name property.

  let name;

  if (properties.length !== 1) {
    name = "unknown";
  } else {
    // Because we filtered out the other property,
    // we only have the name case here.
    name = properties[0].split("=")[1];
  } // Built the Uint8Array Blob parameter from the base64 string.


  const binary = atob(splitted[1]);
  const array = [];

  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  } // Create the blob object


  const blob = new window.Blob([new Uint8Array(array)], {
    type
  });
  return {
    blob,
    name
  };
}
class FormFileInput extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.getFileName = () => {
      if (!this.props.value) return '';

      if (this.props.type === 'data-url') {
        return this.extractFileInfo(this.props.value).name;
      } else if (this.props.type === 'file-url') {
        return this.props.value;
      } else {
        return 'Unknown file';
      }
    };

    this.extractFileInfo = dataURL => {
      const {
        blob,
        name
      } = dataURItoBlob(dataURL);
      return {
        name: name,
        size: blob.size,
        type: blob.type
      };
    };

    this.addNameToDataURL = (dataURL, name) => {
      return dataURL.replace(';base64', ';name=' + encodeURIComponent(name) + ';base64');
    };

    this.handleChange = e => {
      if (this.props.type === 'data-url') {
        let file = e.target.files[0];
        let fileName = file.name;
        let reader = new FileReader();

        reader.onload = () => {
          // this.setState({src: reader.result});
          // we create a fake event object
          let event = {
            target: {
              type: 'text',
              value: this.addNameToDataURL(reader.result, fileName),
              name: this.props.name
            }
          };
          this.props.onChange(event);
        };

        reader.readAsDataURL(file);
      } else if (this.props.type === 'file-url') {
        let endpoint = this.props.handler || this.context.fileHandler;

        if (!endpoint) {
          console.error("Error: fileHandler option need to be passed " + "while initializing editor for enabling file uploads.");
          alert("Files couldn't be uploaded.");
          return;
        }

        this.setState({
          loading: true
        });
        let formData = new FormData();

        for (let key in this.context.fileHandlerArgs) {
          if (this.context.fileHandlerArgs.hasOwnProperty(key)) formData.append(key, this.context.fileHandlerArgs[key]);
        }

        formData.append('coords', getCoordsFromName(this.props.name));
        formData.append('file', e.target.files[0]);
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'X-CSRFToken': getCsrfCookie()
          },
          body: formData
        }).then(response => response.json()).then(result => {
          // we create a fake event object
          let event = {
            target: {
              type: 'text',
              value: result.value,
              name: this.props.name
            }
          };
          this.props.onChange(event);
          this.setState({
            loading: false
          });
        }).catch(error => {
          alert('Something went wrong while uploading file');
          console.error('Error:', error);
          this.setState({
            loading: false
          });
        });
      }
    };

    this.showFileBrowser = () => {
      this.inputRef.current.click();
    };

    this.clearFile = () => {
      if (window.confirm('Do you want to remove this file?')) {
        let event = {
          target: {
            type: 'text',
            value: '',
            name: this.props.name
          }
        };
        this.props.onChange(event);
        if (this.inputRef.current) this.inputRef.current.value = '';
      }
    };

    this.state = {
      value: props.value,
      fileName: this.getFileName(),
      loading: false
    };
    this.inputRef = /*#__PURE__*/React__default["default"].createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.value !== prevProps.value) {
      this.setState({
        value: this.props.value,
        fileName: this.getFileName()
      });
    }
  }

  render() {
    let _value$this$props = _extends({
      value
    }, this.props),
        {
      label,
      value
    } = _value$this$props,
        props = _objectWithoutPropertiesLoose(_value$this$props, _excluded5);

    props.type = 'file';
    props.onChange = this.handleChange;
    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React__default["default"].createElement("div", null, /*#__PURE__*/React__default["default"].createElement(Label, {
      label: label,
      required: props.required
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-file-field"
    }, this.state.value && /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-current-file-name"
    }, "Current file: ", /*#__PURE__*/React__default["default"].createElement("span", null, this.state.fileName), " ", ' ', /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "remove-file",
      onClick: this.clearFile
    }, "Clear")), this.state.value && !this.state.loading && 'Change:', this.state.loading ? /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-file-field-loading"
    }, /*#__PURE__*/React__default["default"].createElement(Loader, null), " Uploading...") : /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-file-field-input"
    }, /*#__PURE__*/React__default["default"].createElement(FormInput, _extends({}, props, {
      inputRef: this.inputRef
    })))));
  }

}
FormFileInput.contextType = EditorContext;
class FormTextareaInput extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.handleChange = e => {
      this.updateHeight(e.target);
      if (this.props.onChange) this.props.onChange(e);
    };

    this.updateHeight = el => {
      let offset = el.offsetHeight - el.clientHeight;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + offset + 'px';
    };

    if (!props.inputRef) this.inputRef = /*#__PURE__*/React__default["default"].createRef();
  }

  componentDidMount() {
    if (this.props.inputRef) this.updateHeight(this.props.inputRef.current);else this.updateHeight(this.inputRef.current);
  }

  render() {
    let _this$props = this.props,
        {
      label,
      help_text,
      error,
      inputRef
    } = _this$props,
        props = _objectWithoutPropertiesLoose(_this$props, _excluded6);

    delete props.type;
    props.ref = inputRef || this.inputRef;
    props.onChange = this.handleChange; // readonly inputs are automatically marked disabled
    // if this is undesired, explicitly pass disabled=false

    if (props.readOnly && (props.disabled === undefined || props.disabled === null)) props.disabled = true;
    return /*#__PURE__*/React__default["default"].createElement("div", null, /*#__PURE__*/React__default["default"].createElement(Label, {
      label: label,
      required: props.required
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: error ? "rjf-input-group has-error" : "rjf-input-group"
    }, /*#__PURE__*/React__default["default"].createElement("textarea", props), error && error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-error-text",
      key: i
    }, error)), help_text && /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-help-text"
    }, help_text)));
  }

}
class FormDateTimeInput extends React__default["default"].Component {
  constructor(props) {
    super(props); // we maintain this input's state in itself
    // so that we can only pass valid values
    // otherwise keep the value empty if invalid

    this.getStateFromProps = () => {
      let date = '';
      let hh = '12';
      let mm = '00';
      let ss = '00';
      let ms = '000';
      let ampm = 'am';

      if (this.props.value) {
        let d = new Date(this.props.value);
        let year = d.getFullYear().toString().padStart(2, '0');
        let month = (d.getMonth() + 1).toString().padStart(2, '0');
        let day = d.getDate().toString().padStart(2, '0');
        date = year + '-' + month + '-' + day;
        hh = d.getHours();

        if (hh === 0) {
          hh = 12;
        } else if (hh === 12) {
          ampm = 'pm';
        } else if (hh > 12) {
          hh = hh - 12;
          ampm = 'pm';
        }

        mm = d.getMinutes();
        ss = d.getSeconds();
        ms = d.getMilliseconds();
        hh = hh.toString().padStart(2, '0');
        mm = mm.toString().padStart(2, '0');
        ss = ss.toString().padStart(2, '0');
      }

      return {
        date: date,
        hh: hh,
        mm: mm,
        ss: ss,
        ms: ms,
        ampm: ampm
      };
    };

    this.handleClickOutside = e => {
      if (this.state.showTimePicker) {
        if (this.timePickerContainer.current && !this.timePickerContainer.current.contains(e.target) && !this.timeInput.current.contains(e.target)) this.setState({
          showTimePicker: false
        });
      }
    };

    this.sendValue = () => {
      // we create a fake event object
      // to send a combined value from two inputs
      let event = {
        target: {
          type: 'text',
          value: '',
          name: this.props.name
        }
      };
      if (this.state.date === '' || this.state.date === null) return this.props.onChange(event);
      let hh = parseInt(this.state.hh);
      if (hh === 0) hh = NaN; // zero value is invalid for 12 hour clock, but will be valid for 24 hour clock
      // so we set it to NaN to prevent creating a date object

      if (this.state.ampm === 'am') {
        if (hh === 12) hh = 0;
      } else if (this.state.ampm === 'pm') {
        if (hh !== 12) hh = hh + 12;
      }

      hh = hh.toString().padStart(2, '0');
      let mm = this.state.mm.padStart(2, '0');
      let ss = this.state.ss.padStart(2, '0');

      try {
        let date = new Date(this.state.date + 'T' + hh + ':' + mm + ':' + ss + '.' + this.state.ms);
        event['target']['value'] = date.toISOString().replace('Z', '+00:00'); // make compatible to python
      } catch (err) {
        // invalid date
        return this.props.onChange(event);
      }

      this.props.onChange(event);
    };

    this.handleDateChange = e => {
      this.setState({
        date: e.target.value
      }, this.sendValue);
    };

    this.handleTimeChange = value => {
      this.setState(_extends({}, value), this.sendValue);
    };

    this.showTimePicker = () => {
      this.setState({
        showTimePicker: !this.props.readOnly && true
      });
    };

    this.state = _extends({}, this.getStateFromProps(), {
      showTimePicker: false
    });
    this.timeInput = /*#__PURE__*/React__default["default"].createRef();
    this.timePickerContainer = /*#__PURE__*/React__default["default"].createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.value !== this.props.value) {
      if (this.state.hh !== '' && this.state.hh !== '0' && this.state.hh !== '00') {
        let changed = false;
        let newState = this.getStateFromProps();

        for (let key in newState) {
          if (newState[key] !== this.state[key]) {
            changed = true;
            break;
          }
        }

        if (changed) this.setState(_extends({}, newState));
      }
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: this.props.error ? "rjf-datetime-field has-error" : "rjf-datetime-field"
    }, /*#__PURE__*/React__default["default"].createElement(Label, {
      label: this.props.label,
      required: this.props.required
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-datetime-field-inner"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: this.props.readOnly ? "rjf-datetime-field-inputs readonly" : "rjf-datetime-field-inputs"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-datetime-field-date"
    }, /*#__PURE__*/React__default["default"].createElement(FormInput, {
      label: "Date",
      type: "date",
      value: this.state.date,
      onChange: this.handleDateChange,
      readOnly: this.props.readOnly
    })), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-datetime-field-time"
    }, /*#__PURE__*/React__default["default"].createElement(FormInput, {
      label: "Time",
      type: "text",
      value: this.state.hh + ':' + this.state.mm + ':' + this.state.ss + ' ' + this.state.ampm,
      onFocus: this.showTimePicker,
      readOnly: true,
      disabled: this.props.readOnly || false,
      inputRef: this.timeInput
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      ref: this.timePickerContainer
    }, this.state.showTimePicker && /*#__PURE__*/React__default["default"].createElement(TimePicker, {
      onChange: this.handleTimeChange,
      hh: this.state.hh,
      mm: this.state.mm,
      ss: this.state.ss,
      ampm: this.state.ampm
    })))), this.props.error && this.props.error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-error-text",
      key: i
    }, error)), this.props.help_text && /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-help-text"
    }, this.props.help_text)));
  }

}

class AutoCompleteInput extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.handleSelect = value => {
      if (this.props.multiselect) {
        if (Array.isArray(this.props.value)) value = this.props.value.concat([value]);else value = [value];
      }

      let event = {
        target: {
          type: this.props.type,
          value: value,
          name: this.props.name
        }
      };
      if (!this.props.multiselect) this.hideOptions();
      this.props.onChange(event);
    };

    this.handleMultiselectRemove = val => {
      let value = this.props.value.filter(item => {
        return item !== val;
      });
      let event = {
        target: {
          type: this.props.type,
          value: value,
          name: this.props.name
        }
      };
      this.props.onChange(event);
    };

    this.clearValue = e => {
      this.handleSelect(this.defaultEmptyValue);
    };

    this.hasValue = () => {
      if (Array.isArray(this.props.value) && !this.props.value.length) return false;
      if (this.props.value === '' || this.props.value === null) return false;
      return true;
    };

    this.handleSearchInputChange = e => {
      let value = e.target.value;

      if (value) {
        this.setState({
          searchInputValue: value,
          loading: true
        }, this.debouncedFetchOptions);
      } else {
        this.setState({
          searchInputValue: value,
          loading: false,
          options: []
        });
      }
    };

    this.fetchOptions = () => {
      if (this.state.searchInputValue === '') return; // :TODO: cache results

      let endpoint = this.props.handler;

      if (!endpoint) {
        console.error("Error: No 'handler' endpoint provided for autocomplete input.");
        this.setState({
          loading: false
        });
        return;
      }

      let url = endpoint + '?' + new URLSearchParams({
        field_name: this.context.fieldName,
        model_name: this.context.modelName,
        coords: getCoordsFromName(this.props.name),
        query: this.state.searchInputValue
      });
      fetch(url, {
        method: 'GET'
      }).then(response => response.json()).then(result => {
        if (!Array.isArray(result.results)) result.results = [];
        this.setState(state => ({
          loading: false,
          options: [...result.results]
        }));
      }).catch(error => {
        alert('Something went wrong while fetching options');
        console.error('Error:', error);
        this.setState({
          loading: false
        });
      });
    };

    this.showOptions = e => {
      if (!this.state.showOptions) this.setState({
        showOptions: true
      });
    };

    this.hideOptions = e => {
      this.setState({
        showOptions: false,
        searchInputValue: '',
        options: [],
        loading: false
      });
    };

    this.toggleOptions = e => {
      this.setState(state => {
        if (state.showOptions) {
          return {
            showOptions: false,
            searchInputValue: '',
            options: [],
            loading: false
          };
        } else {
          return {
            showOptions: true
          };
        }
      });
    };

    this.state = {
      searchInputValue: '',
      showOptions: false,
      options: [],
      loading: false
    };
    this.optionsContainer = /*#__PURE__*/React__default["default"].createRef();
    this.searchInputRef = /*#__PURE__*/React__default["default"].createRef();
    this.input = /*#__PURE__*/React__default["default"].createRef();
    this.debouncedFetchOptions = debounce(this.fetchOptions, 500);
    this.defaultEmptyValue = props.multiselect ? [] : '';
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.showOptions && this.state.showOptions !== prevState.showOptions) {
      if (this.searchInputRef.current) this.searchInputRef.current.focus();
    }
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: this.props.label ? 'rjf-autocomplete-field has-label' : 'rjf-autocomplete-field'
    }, this.props.multiselect ? /*#__PURE__*/React__default["default"].createElement(FormInput, {
      label: this.props.label,
      help_text: this.props.help_text,
      error: this.props.error
    }, /*#__PURE__*/React__default["default"].createElement(FormMultiSelectInputField, {
      inputRef: this.input,
      onClick: this.toggleOptions,
      onChange: e => this.handleMultiselectRemove(e.target.value),
      value: this.props.value,
      placeholder: this.props.placeholder || ' ',
      disabled: this.props.readOnly || false
    })) : /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, /*#__PURE__*/React__default["default"].createElement(FormInput, {
      label: this.props.label,
      type: "text",
      value: this.props.value,
      help_text: this.props.help_text,
      error: this.props.error,
      readOnly: true,
      disabled: this.props.readOnly || false,
      onClick: this.toggleOptions,
      inputRef: this.input,
      placeholder: this.props.placeholder,
      name: this.props.name,
      className: "rjf-autocomplete-field-input"
    }), this.hasValue() && !this.props.readOnly && /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "autocomplete-field-clear",
      title: "Clear",
      onClick: this.clearValue
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "x-circle"
    }), " ", /*#__PURE__*/React__default["default"].createElement("span", null, "Clear"))), this.state.showOptions && !this.props.readOnly && /*#__PURE__*/React__default["default"].createElement(AutoCompletePopup, {
      options: this.state.options,
      value: this.props.value,
      hideOptions: this.hideOptions,
      onSelect: this.handleSelect,
      onSearchInputChange: this.handleSearchInputChange,
      searchInputValue: this.state.searchInputValue,
      containerRef: this.optionsContainer,
      searchInputRef: this.searchInputRef,
      inputRef: this.input,
      loading: this.state.loading,
      hasHelpText: (this.props.help_text || this.props.error) && 1,
      multiselect: this.props.multiselect
    }));
  }

}
AutoCompleteInput.contextType = EditorContext;

class AutoCompletePopup extends React__default["default"].Component {
  constructor(...args) {
    super(...args);

    this.handleClickOutside = e => {
      if (this.props.containerRef.current && !this.props.containerRef.current.contains(e.target) && !this.props.inputRef.current.contains(e.target)) this.props.hideOptions();
    };
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      ref: this.props.containerRef
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-autocomplete-field-popup",
      style: this.props.hasHelpText ? {
        marginTop: '-15px'
      } : {}
    }, /*#__PURE__*/React__default["default"].createElement(AutocompleteSearchBox, {
      inputRef: this.props.searchInputRef,
      onChange: this.props.onSearchInputChange,
      value: this.props.searchInputValue,
      loading: this.props.loading
    }), this.props.searchInputValue && /*#__PURE__*/React__default["default"].createElement(AutocompleteOptions, {
      options: this.props.options,
      value: this.props.value,
      onSelect: this.props.onSelect,
      loading: this.props.loading,
      hasHelpText: this.props.hasHelpText,
      multiselect: this.props.multiselect
    })));
  }

}

function AutocompleteSearchBox(props) {
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-autocomplete-field-search"
  }, /*#__PURE__*/React__default["default"].createElement(FormInput, {
    type: "text",
    placeholder: "Search...",
    inputRef: props.inputRef,
    onChange: props.onChange,
    value: props.value,
    form: ""
  }), props.loading && /*#__PURE__*/React__default["default"].createElement(Loader, null));
}

function AutocompleteOptions(props) {
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-autocomplete-field-options"
  }, !props.options.length && !props.loading && /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-autocomplete-field-option disabled"
  }, "No options"), props.options.map((option, i) => {
    let title, inputValue;

    if (typeof option === 'object') {
      title = option.title || option.label;
      inputValue = option.value;
    } else {
      title = option;
      if (typeof title === 'boolean') title = capitalize(title.toString());
      inputValue = option;
    }

    let selected = false;
    if (Array.isArray(props.value)) selected = props.value.indexOf(inputValue) > -1;else selected = props.value === inputValue;
    let optionClassName = 'rjf-autocomplete-field-option';
    if (selected) optionClassName += ' selected';
    return /*#__PURE__*/React__default["default"].createElement("div", {
      key: title + '_' + inputValue + '_' + i,
      className: optionClassName,
      tabIndex: 0,
      role: "button",
      onClick: () => props.multiselect && selected ? null : props.onSelect(inputValue)
    }, title);
  }));
}

function GroupTitle(props) {
  if (!props.children) return null;
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-form-group-title"
  }, props.children, props.editable && /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, ' ', /*#__PURE__*/React__default["default"].createElement(Button, {
    className: "edit",
    onClick: props.onEdit,
    title: "Edit"
  }, "Edit")), props.collapsible && /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, ' ', /*#__PURE__*/React__default["default"].createElement(Button, {
    className: "collapse",
    onClick: props.onCollapse,
    title: props.collapsed ? "Expand" : "Collapse"
  }, props.collapsed ? "[+]" : "[-]")));
}
function GroupDescription(props) {
  if (!props.children) return null;
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-form-group-description"
  }, props.children);
}

function animate(e, animation, callback) {
  let el = e.target.parentElement.parentElement;
  let prevEl = el.previousElementSibling;
  let nextEl = el.nextElementSibling;
  el.classList.add('rjf-animate', 'rjf-' + animation);

  if (animation === 'move-up') {
    let {
      y,
      height
    } = prevEl.getBoundingClientRect();
    let y1 = y;
    ({
      y,
      height
    } = el.getBoundingClientRect());
    let y2 = y;
    prevEl.classList.add('rjf-animate');
    prevEl.style.opacity = 0;
    prevEl.style.transform = 'translateY(' + (y2 - y1) + 'px)';
    el.style.opacity = 0;
    el.style.transform = 'translateY(-' + (y2 - y1) + 'px)';
  } else if (animation === 'move-down') {
    let {
      y,
      height
    } = el.getBoundingClientRect();
    let y1 = y;
    ({
      y,
      height
    } = nextEl.getBoundingClientRect());
    let y2 = y;
    nextEl.classList.add('rjf-animate');
    nextEl.style.opacity = 0;
    nextEl.style.transform = 'translateY(-' + (y2 - y1) + 'px)';
    el.style.opacity = 0;
    el.style.transform = 'translateY(' + (y2 - y1) + 'px)';
  }

  setTimeout(function () {
    callback();
    el.classList.remove('rjf-animate', 'rjf-' + animation);
    el.style = null;

    if (animation === 'move-up') {
      prevEl.classList.remove('rjf-animate');
      prevEl.style = null;
    } else if (animation === 'move-down') {
      nextEl.classList.remove('rjf-animate');
      nextEl.style = null;
    }
  }, 200);
}

function FormRowControls(props) {
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-form-row-controls"
  }, props.onMoveUp && /*#__PURE__*/React__default["default"].createElement(Button, {
    className: "move-up",
    onClick: e => animate(e, 'move-up', props.onMoveUp),
    title: "Move up"
  }, /*#__PURE__*/React__default["default"].createElement("span", null, "\u2191")), props.onMoveDown && /*#__PURE__*/React__default["default"].createElement(Button, {
    className: "move-down",
    onClick: e => animate(e, 'move-down', props.onMoveDown),
    title: "Move down"
  }, /*#__PURE__*/React__default["default"].createElement("span", null, "\u2193")), props.onRemove && /*#__PURE__*/React__default["default"].createElement(Button, {
    className: "remove",
    onClick: e => animate(e, 'remove', props.onRemove),
    title: "Remove"
  }, /*#__PURE__*/React__default["default"].createElement("span", null, "\xD7")));
}
function FormRow(props) {
  let className = 'rjf-form-row';
  if (props.hidden) className += ' rjf-form-row-hidden';
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: className
  }, /*#__PURE__*/React__default["default"].createElement(FormRowControls, props), /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-form-row-inner"
  }, props.children));
}
function FormGroup(props) {
  const [collapsed, setCollapsed] = React__default["default"].useState(false);
  let type = getSchemaType(props.schema);
  React__default["default"].Children.count(props.children);
  let innerClassName = props.level === 0 && props.childrenType === 'groups' ? '' : 'rjf-form-group-inner';
  let addButtonText;
  let addButtonTitle;

  if (type === 'object') {
    addButtonText = 'Add key';
    addButtonTitle = 'Add new key';
  } else {
    addButtonText = 'Add item';
    addButtonTitle = 'Add new item';
  }

  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-form-group"
  }, props.level === 0 && /*#__PURE__*/React__default["default"].createElement(GroupTitle, {
    editable: props.editable,
    onEdit: props.onEdit,
    collapsible: props.collapsible,
    onCollapse: () => setCollapsed(!collapsed),
    collapsed: collapsed
  }, props.schema.title), props.level === 0 && /*#__PURE__*/React__default["default"].createElement(GroupDescription, null, props.schema.description), /*#__PURE__*/React__default["default"].createElement("div", {
    className: innerClassName
  }, props.level > 0 && /*#__PURE__*/React__default["default"].createElement(GroupTitle, {
    editable: props.editable,
    onEdit: props.onEdit,
    collapsible: props.collapsible,
    onCollapse: () => setCollapsed(!collapsed),
    collapsed: collapsed
  }, props.schema.title), props.level > 0 && /*#__PURE__*/React__default["default"].createElement(GroupDescription, null, props.schema.description), collapsed && /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-collapsed-indicator"
  }, /*#__PURE__*/React__default["default"].createElement("span", null, "Collapsed")), /*#__PURE__*/React__default["default"].createElement("div", {
    className: collapsed ? "rjf-form-group-children rjf-collapsed" : "rjf-form-group-children"
  }, props.children), !collapsed && props.addable && /*#__PURE__*/React__default["default"].createElement(Button, {
    className: "add",
    onClick: e => props.onAdd(),
    title: addButtonTitle
  }, addButtonText)));
}

class FileUploader extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.openModal = e => {
      this.setState({
        open: true
      });
    };

    this.closeModal = e => {
      this.setState({
        open: false,
        pane: 'upload'
      });
    };

    this.togglePane = name => {
      this.setState({
        pane: name
      });
    };

    this.handleFileSelect = value => {
      // we create a fake event
      let event = {
        target: {
          type: 'text',
          value: value,
          name: this.props.name
        }
      };
      this.props.onChange(event);
      this.closeModal();
    };

    this.handleFileUpload = e => {
      this.newFiles.push(e.target.value);
      this.addExitEventListeners();
      this.props.onChange(e);
      this.closeModal();
    };

    this.addExitEventListeners = () => {
      /* Sets page exit (unload) event listeners.
       *
       * The purpose of these listeners is to send a DELETE
       * request uf user leaves page WITHOUT SAVING FORM.
       *
       * The event listeners are only added if there a <form> element
       * parent of this react-jsonform component because if there's
       * no form to save, then the user will always have to leave
       * without saving. Hence, no point in sending unsaved DELETE requests.
      */
      if (this.exitListenersAdded) return;
      if (!this.hiddenInputRef.current) return;
      if (!this.hiddenInputRef.current.form) return;
      window.addEventListener('beforeunload', this.promptOnExit);
      window.addEventListener('unload', this.sendDeleteRequestOnExit);
      this.hiddenInputRef.current.form.addEventListener('submit', e => {
        window.removeEventListener('beforeunload', this.promptOnExit);
        window.removeEventListener('unload', this.sendDeleteRequestOnExit);
      });
      this.exitListenersAdded = true;
    };

    this.promptOnExit = e => {
      if (!this.newFiles.length) return;
      e.preventDefault();
      e.returnValue = '';
    };

    this.sendDeleteRequestOnExit = e => {
      if (!this.newFiles.length) return;
      this.sendDeleteRequest([this.newFiles], 'unsaved_form_page_exit', true);
    };

    this.clearFile = () => {
      if (window.confirm('Do you want to remove this file?')) {
        let event = {
          target: {
            type: 'text',
            value: '',
            name: this.props.name
          }
        };
        this.props.onChange(event);
      }
    };

    this.sendDeleteRequest = (values, trigger, keepalive) => {
      /* Sends DELETE request to file handler endpoint.
       *
       * Prams:
       *   values: (array) names of files to delete
       *   trigger: (string) the action which triggered the deletion
       *   keepalive: (bool) whether to use keepalive flag or not
      */
      let endpoint = this.props.handler || this.context.fileHandler;
      let querystring = new URLSearchParams(_extends({}, this.context.fileHandlerArgs, {
        coords: getCoordsFromName(this.props.name),
        trigger: trigger
      }));

      for (let i = 0; i < values.length; i++) {
        querystring.append('value', values[i]);
      }

      let url = endpoint + '?' + querystring;
      let options = {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfCookie()
        }
      };
      if (keepalive) options['keepalive'] = true;
      return fetch(url, options);
    };

    this.state = {
      value: props.value,
      //fileName: this.getFileName(),
      loading: false,
      open: false,
      pane: 'upload'
    };
    this.hiddenInputRef = /*#__PURE__*/React__default["default"].createRef();
    this.newFiles = []; // track new uploaded files to send DELETE request
    // on page exit if unsaved

    this.exitListenersAdded = false;
  }

  render() {
    if (!this.props.handler && !this.context.fileHandler) {
      return /*#__PURE__*/React__default["default"].createElement(FormFileInput, this.props);
    }

    return /*#__PURE__*/React__default["default"].createElement("div", null, /*#__PURE__*/React__default["default"].createElement(Label, {
      label: this.props.label,
      required: this.props.required
    }), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-file-field"
    }, this.props.value && /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-current-file-name"
    }, "Current file: ", /*#__PURE__*/React__default["default"].createElement("span", null, this.props.value), " ", ' ', /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "remove-file",
      onClick: this.clearFile
    }, "Clear")), /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: this.openModal,
      className: "upload-modal__open"
    }, this.props.value ? 'Change file' : 'Select file'), this.props.error && this.props.error.map((error, i) => /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-error-text",
      key: i
    }, error)), this.props.help_text && /*#__PURE__*/React__default["default"].createElement("span", {
      className: "rjf-help-text"
    }, this.props.help_text)), /*#__PURE__*/React__default["default"].createElement("input", {
      type: "hidden",
      ref: this.hiddenInputRef
    }), /*#__PURE__*/React__default["default"].createElement(ReactModal__default["default"], {
      isOpen: this.state.open,
      onRequestClose: this.closeModal,
      contentLabel: "Select file",
      portalClassName: "rjf-modal-portal",
      overlayClassName: "rjf-modal__overlay",
      className: "rjf-modal__dialog",
      bodyOpenClassName: "rjf-modal__main-body--open",
      closeTimeoutMS: 150,
      ariaHideApp: false
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-modal__content"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-modal__header"
    }, /*#__PURE__*/React__default["default"].createElement(TabButton, {
      onClick: this.togglePane,
      tabName: "upload",
      active: this.state.pane === "upload"
    }, "Upload new"), ' ', /*#__PURE__*/React__default["default"].createElement(TabButton, {
      onClick: this.togglePane,
      tabName: "library",
      active: this.state.pane === "library"
    }, "Choose from library"), /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "modal__close",
      onClick: this.closeModal,
      title: "Close (Esc)"
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "x-lg"
    }))), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-modal__body"
    }, this.state.pane === 'upload' && /*#__PURE__*/React__default["default"].createElement(UploadPane, _extends({}, this.props, {
      onChange: this.handleFileUpload,
      label: "",
      value: "",
      help_text: "",
      error: ""
    })), this.state.pane === 'library' && /*#__PURE__*/React__default["default"].createElement(LibraryPane, {
      fileHandler: this.props.handler || this.context.fileHandler,
      fileHandlerArgs: _extends({}, this.context.fileHandlerArgs, {
        coords: getCoordsFromName(this.props.name)
      }),
      onFileSelect: this.handleFileSelect,
      sendDeleteRequest: this.sendDeleteRequest
    })), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-modal__footer"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "modal__footer-close",
      onClick: this.closeModal
    }, "Cancel")))));
  }

}
FileUploader.contextType = EditorContext;

function TabButton(props) {
  let className = 'rjf-upload-modal__tab-button';
  if (props.active) className += ' rjf-upload-modal__tab-button--active';
  return /*#__PURE__*/React__default["default"].createElement("button", {
    onClick: () => props.onClick(props.tabName),
    className: className
  }, props.children);
}

function UploadPane(props) {
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-upload-modal__pane"
  }, /*#__PURE__*/React__default["default"].createElement("h3", null, "Upload new"), /*#__PURE__*/React__default["default"].createElement("br", null), /*#__PURE__*/React__default["default"].createElement(FormFileInput, props));
}

class LibraryPane extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.fetchList = () => {
      let endpoint = this.props.fileHandler;

      if (!endpoint) {
        console.error("Error: fileHandler option need to be passed " + "while initializing editor for enabling file listing.");
        this.setState({
          loading: false,
          hasMore: false
        });
        return;
      }

      let url = endpoint + '?' + new URLSearchParams(_extends({}, this.props.fileHandlerArgs, {
        page: this.state.page + 1
      }));
      fetch(url, {
        method: 'GET'
      }).then(response => response.json()).then(result => {
        if (!Array.isArray(result.results)) result.results = [];
        this.setState(state => ({
          loading: false,
          files: [...state.files, ...result.results],
          page: result.results.length > 0 ? state.page + 1 : state.page,
          hasMore: result.results.length > 0
        }));
      }).catch(error => {
        alert('Something went wrong while retrieving media files');
        console.error('Error:', error);
        this.setState({
          loading: false
        });
      });
    };

    this.onLoadMore = e => {
      this.setState({
        loading: true
      }, this.fetchList);
    };

    this.onFileDelete = () => {
      this.setState({
        page: 0,
        files: []
      }, this.onLoadMore);
    };

    this.state = {
      loading: true,
      files: [],
      page: 0,
      // current page
      hasMore: true
    };
  }

  componentDidMount() {
    //setTimeout(() => this.setState({loading: false}), 1000);
    this.fetchList();
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-upload-modal__pane"
    }, /*#__PURE__*/React__default["default"].createElement("h3", null, "Media library"), /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-upload-modal__media-container"
    }, this.state.files.map(i => {
      return /*#__PURE__*/React__default["default"].createElement(MediaTile, _extends({}, i, {
        onClick: this.props.onFileSelect,
        sendDeleteRequest: this.props.sendDeleteRequest,
        onFileDelete: this.onFileDelete
      }));
    })), this.state.loading && /*#__PURE__*/React__default["default"].createElement(Loader, {
      className: "rjf-upload-modal__media-loader"
    }), !this.state.loading && this.state.hasMore && /*#__PURE__*/React__default["default"].createElement("div", null, /*#__PURE__*/React__default["default"].createElement(Button, {
      onClick: this.onLoadMore,
      className: "upload-modal__media-load"
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: "arrow-down"
    }), " View more")), !this.state.hasMore && /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-upload-modal__media-end-message"
    }, this.state.files.length ? 'End of list' : 'No files found'));
  }

}

const DEFAULT_THUBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23999999' viewBox='0 0 16 16'%3E%3Cpath d='M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z'/%3E%3C/svg%3E";

function MediaTile(props) {
  let metadata = props.metadata || {};
  return /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-upload-modal__media-tile"
  }, /*#__PURE__*/React__default["default"].createElement(MediaTileMenu, {
    value: props.value,
    sendDeleteRequest: props.sendDeleteRequest,
    onFileDelete: props.onFileDelete
  }), /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-upload-modal__media-tile-inner",
    tabIndex: "0",
    onClick: () => props.onClick(props.value)
  }, /*#__PURE__*/React__default["default"].createElement("img", {
    src: props.thumbnail ? props.thumbnail : DEFAULT_THUBNAIL
  }), props.metadata && /*#__PURE__*/React__default["default"].createElement("div", {
    className: "rjf-upload-modal__media-tile-metadata"
  }, Object.getOwnPropertyNames(metadata).map(key => {
    return /*#__PURE__*/React__default["default"].createElement("span", null, metadata[key]);
  }))));
}

class MediaTileMenu extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.toggleMenu = e => {
      this.setState(state => ({
        open: !state.open
      }));
    };

    this.handleDeleteClick = e => {
      if (window.confirm('Do you want to delete this file?')) {
        this.setState({
          loading: true
        });
        this.props.sendDeleteRequest([this.props.value], 'delete_button').then(response => {
          let status = response.status;
          let msg;

          if (status === 200) ; else if (status === 400) msg = 'Bad request';else if (status === 401 || status === 403) msg = "You don't have permission to delete this file";else if (status === 404) msg = 'This file does not exist on server';else if (status === 405) msg = 'This operation is not permitted';else if (status > 405) msg = 'Something went wrong while deleting file';

          this.setState({
            loading: false,
            open: false
          });
          if (msg) alert(msg);else this.props.onFileDelete();
        }).catch(error => {
          alert('Something went wrong while deleting file');
          console.error('Error:', error);
          this.setState({
            loading: false
          });
        });
      }
    };

    this.state = {
      open: false,
      loading: false
    };
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: this.state.open ? 'rjf-dropdown open' : 'rjf-dropdown'
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "rjf-dropdown-toggler",
      alterClassName: false,
      title: this.state.open ? 'Close menu' : 'Open menu',
      onClick: this.toggleMenu
    }, /*#__PURE__*/React__default["default"].createElement(Icon, {
      name: this.state.open ? 'x-lg' : 'three-dots-vertical'
    })), this.state.open && /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-dropdown-items"
    }, /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "rjf-dropdown-item rjf-text-danger",
      alterClassName: false,
      onClick: this.handleDeleteClick
    }, this.state.loading && /*#__PURE__*/React__default["default"].createElement(Loader, null), this.state.loading ? ' Deleting...' : 'Delete')));
  }

}

const _excluded = ["data", "schema", "name", "onChange", "onRemove", "removable", "onEdit", "onKeyEdit", "editable", "onMoveUp", "onMoveDown", "parentType", "errorMap"];

function handleChange(e, fieldType, callback) {
  let type = e.target.type;
  let value;

  if (type === 'checkbox') {
    value = e.target.checked;
  } else {
    value = e.target.value;
  }

  if (Array.isArray(value)) {
    /* multiselect widget values are arrays */
    value = value.map(item => convertType(item, fieldType));
  } else {
    value = convertType(value, fieldType);
  }

  callback(e.target.name, value);
}

function FormField(props) {
  let inputProps = {
    name: props.name,
    value: props.data,
    readOnly: getKeyword(props.schema, 'readOnly', 'readonly'),
    help_text: getKeyword(props.schema, 'help_text', 'helpText'),
    error: props.errorMap[getCoordsFromName(props.name)],
    required: props.schema.required || false
  };
  if (typeof inputProps.error === 'string') inputProps.error = [inputProps.error];
  if (props.schema.placeholder) inputProps.placeholder = props.schema.placeholder;
  if (props.schema.handler) inputProps.handler = props.schema.handler;
  let type;

  if (props.schema.hasOwnProperty('const')) {
    type = actualType(props.schema.const);
    inputProps.readOnly = true;
  } else {
    type = normalizeKeyword(props.schema.type);
  }

  let choices = getKeyword(props.schema, 'choices', 'enum');

  if (choices) {
    inputProps.options = choices;
    type = 'select';
  }

  if (props.schema.widget) {
    if (props.schema.widget === 'multiselect' && props.parentType !== 'array') ; else if (props.schema.widget === 'hidden') {
      type = 'string';
    } else {
      type = props.schema.widget;
    }
  }

  let InputField;

  switch (type) {
    case 'string':
      InputField = FormInput;

      if (props.schema.format) {
        if (props.schema.format === 'data-url') {
          InputField = FormFileInput;
        } else if (props.schema.format === 'file-url') {
          InputField = FileUploader;
        } else if (normalizeKeyword(props.schema.format) === 'date-time') {
          InputField = FormDateTimeInput;
        }

        inputProps.type = props.schema.format;
      } else if (props.schema.widget === 'hidden') {
        inputProps.type = 'hidden';
      } else {
        inputProps.type = 'text';
      }

      if (props.schema.minLength || props.schema.minLength === 0) inputProps.minLength = props.schema.minLength;
      if (props.schema.maxLength || props.schema.maxLength === 0) inputProps.maxLength = props.schema.maxLength;
      break;

    case 'fileinput':
      InputField = FormFileInput;
      if (props.schema.format) inputProps.type = props.schema.format;
      break;

    case 'range':
    case 'integer':
      inputProps.step = '1';
    // fall through

    case 'number':
      if (type === 'range') inputProps.type = 'range';else inputProps.type = 'number';
      InputField = FormInput;
      if (props.schema.minimum || props.schema.minimum === 0) inputProps.min = props.schema.minimum;
      if (props.schema.maximum || props.schema.maximum === 0) inputProps.max = props.schema.maximum;
      break;

    case 'boolean':
      inputProps.type = 'checkbox';
      InputField = FormCheckInput;
      break;

    case 'checkbox':
      inputProps.type = 'checkbox';
      InputField = FormCheckInput;
      break;

    case 'radio':
      inputProps.type = 'radio';
      InputField = FormRadioInput;
      break;

    case 'select':
      InputField = FormSelectInput;
      break;

    case 'multiselect':
      inputProps.valueType = props.schema.type;
      InputField = FormMultiSelectInput;
      break;

    case 'autocomplete':
      InputField = AutoCompleteInput;
      break;

    case 'multiselect-autocomplete':
      InputField = AutoCompleteInput;
      inputProps.multiselect = true;
      break;

    case 'textarea':
      InputField = FormTextareaInput;
      if (props.schema.minLength || props.schema.minLength === 0) inputProps.minLength = props.schema.minLength;
      if (props.schema.maxLength || props.schema.maxLength === 0) inputProps.maxLength = props.schema.maxLength;
      break;

    default:
      inputProps.type = 'text';
      InputField = FormInput;
  }

  return /*#__PURE__*/React__default["default"].createElement(InputField, _extends({}, inputProps, {
    label: props.editable ? /*#__PURE__*/React__default["default"].createElement("span", null, props.schema.title, " ", /*#__PURE__*/React__default["default"].createElement(Button, {
      className: "edit",
      onClick: props.onEdit,
      title: "Edit"
    }, "Edit")) : props.schema.title,
    onChange: e => handleChange(e, props.schema.type, props.onChange)
  }));
}

function getStringFormRow(args) {
  let {
    data,
    schema,
    name,
    onChange,
    onRemove,
    removable,
    onKeyEdit,
    editable,
    onMoveUp,
    onMoveDown,
    parentType,
    errorMap
  } = args,
      fieldProps = _objectWithoutPropertiesLoose(args, _excluded);

  return /*#__PURE__*/React__default["default"].createElement(FormRow, {
    key: name,
    onRemove: removable ? e => onRemove(name) : null,
    onMoveUp: onMoveUp,
    onMoveDown: onMoveDown,
    hidden: schema.widget === 'hidden'
  }, /*#__PURE__*/React__default["default"].createElement(FormField, _extends({
    data: data,
    schema: schema,
    name: name,
    onChange: onChange,
    onEdit: onKeyEdit,
    editable: editable,
    parentType: parentType,
    errorMap: errorMap
  }, fieldProps)));
}
function getArrayFormRow(args) {
  let {
    data,
    schema,
    name,
    onChange,
    onAdd,
    onRemove,
    onMove,
    onEdit,
    level
  } = args;
  let rows = [];
  let groups = [];
  let isReadonly = getKeyword(schema, 'readonly', 'readOnly', false);
  let removable = true;
  let min_items = getKeyword(schema, 'min_items', 'minItems') || 0;
  if (data.length <= min_items || isReadonly) removable = false;
  let addable = true;
  let max_items = getKeyword(schema, 'max_items', 'maxItems') || 100;
  if (data.length >= max_items || isReadonly) addable = false;
  let isRef = schema.items.hasOwnProperty('$ref');
  if (isRef) schema.items = args.getRef(schema.items['$ref']);
  let type = normalizeKeyword(schema.items.type);
  let nextArgs = {
    schema: schema.items,
    onChange: onChange,
    onAdd: onAdd,
    onRemove: onRemove,
    level: level + 1,
    removable: removable,
    onMove: onMove,
    onEdit: onEdit,
    onKeyEdit: args.onKeyEdit,
    parentType: 'array',
    getRef: args.getRef,
    errorMap: args.errorMap
  };
  if (isReadonly) nextArgs.schema.readOnly = true;

  if (nextArgs.schema.widget === 'multiselect' || nextArgs.schema.widget === 'multiselect-autocomplete') {
    nextArgs.data = data;
    nextArgs.name = name;
    nextArgs.removable = false;
    nextArgs.onMoveUp = null;
    nextArgs.onMoveDown = null;
    addable = false;
    rows.push(getStringFormRow(nextArgs));
  } else {
    for (let i = 0; i < data.length; i++) {
      nextArgs.data = data[i];
      nextArgs.name = joinCoords(name, i);
      if (i === 0 || isReadonly) nextArgs.onMoveUp = null;else nextArgs.onMoveUp = e => onMove(joinCoords(name, i), joinCoords(name, i - 1));
      if (i === data.length - 1 || isReadonly) nextArgs.onMoveDown = null;else nextArgs.onMoveDown = e => onMove(joinCoords(name, i), joinCoords(name, i + 1));

      if (type === 'array') {
        groups.push(getArrayFormRow(nextArgs));
      } else if (type === 'object') {
        groups.push(getObjectFormRow(nextArgs));
      } else {
        // oneOf/anyOf
        if (schema.items.hasOwnProperty('oneOf')) {
          groups.push( /*#__PURE__*/React__default["default"].createElement(OneOf, {
            parentArgs: args,
            nextArgs: _extends({}, nextArgs),
            key: "oneOf_" + name + '_' + i
          }));
        } else if (schema.items.hasOwnProperty('anyOf')) {
          groups.push( /*#__PURE__*/React__default["default"].createElement(AnyOf, {
            parentArgs: args,
            nextArgs: _extends({}, nextArgs),
            key: "anyOf_" + name + '_' + i
          }));
        } else {
          rows.push(getStringFormRow(nextArgs));
        }
      }
    }
  }

  let coords = name; // coordinates for insertion and deletion

  if (rows.length || !rows.length && !groups.length) {
    let rowError;

    if (!groups.length) {
      rowError = args.errorMap[getCoordsFromName(coords)];
      if (typeof rowError === 'string') rowError = [rowError];
    }

    rows = /*#__PURE__*/React__default["default"].createElement(FormGroup, {
      level: level,
      schema: schema,
      addable: addable,
      onAdd: () => onAdd(getBlankData(schema.items, args.getRef), coords),
      editable: args.editable,
      onEdit: args.onKeyEdit,
      key: 'row_group_' + name,
      collapsible: data.length > 0,
      childrenType: "rows"
    }, rowError && rowError.map((error, i) => /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-error-text",
      key: i
    }, error)), rows);

    if (args.parentType === 'object' && args.removable) {
      rows = /*#__PURE__*/React__default["default"].createElement("div", {
        className: "rjf-form-group-wrapper",
        key: 'row_group_wrapper_' + name
      }, /*#__PURE__*/React__default["default"].createElement(FormRowControls, {
        onRemove: e => onRemove(name)
      }), rows);
    }
  }

  if (groups.length) {
    let groupError = args.errorMap[getCoordsFromName(coords)];
    if (typeof groupError === 'string') groupError = [groupError];
    groups = /*#__PURE__*/React__default["default"].createElement("div", {
      key: 'group_' + name,
      className: "rjf-form-group-wrapper"
    }, args.parentType === 'object' && args.removable && /*#__PURE__*/React__default["default"].createElement(FormRowControls, {
      onRemove: e => onRemove(name)
    }), /*#__PURE__*/React__default["default"].createElement(FormGroup, {
      level: level,
      schema: schema,
      addable: addable,
      onAdd: () => onAdd(getBlankData(schema.items, args.getRef), coords),
      editable: args.editable,
      onEdit: args.onKeyEdit,
      collapsible: data.length > 0,
      childrenType: "groups"
    }, groupError && groupError.map((error, i) => /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-error-text",
      key: i
    }, error)), groups.map((i, index) => /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-form-group-wrapper",
      key: 'group_wrapper_' + name + '_' + index
    }, /*#__PURE__*/React__default["default"].createElement(FormRowControls, {
      onRemove: removable ? e => onRemove(joinCoords(name, index)) : null,
      onMoveUp: index > 0 && !isReadonly ? e => onMove(joinCoords(name, index), joinCoords(name, index - 1)) : null,
      onMoveDown: index < groups.length - 1 && !isReadonly ? e => onMove(joinCoords(name, index), joinCoords(name, index + 1)) : null
    }), i))));
  }

  return [...rows, ...groups];
}
function getObjectFormRow(args) {
  let {
    data,
    schema,
    name,
    onChange,
    onAdd,
    onRemove,
    onMove,
    onEdit,
    level
  } = args;
  let rows = [];
  let isReadonly = getKeyword(schema, 'readonly', 'readOnly', false);
  let schema_keys = getKeyword(schema, 'keys', 'properties', {});

  if (schema.hasOwnProperty('allOf')) {
    for (let i = 0; i < schema.allOf.length; i++) {
      schema_keys = _extends({}, schema_keys, getKeyword(schema.allOf[i], 'keys', 'properties', {}));
    }
  }

  let keys = [...Object.keys(schema_keys)];
  if (schema.additionalProperties) keys = [...keys, ...Object.keys(data).filter(k => keys.indexOf(k) === -1)];

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let value = data[key];
    let childName = joinCoords(name, key);
    let schemaValue = schema_keys.hasOwnProperty(key) ? _extends({}, schema_keys[key]) : undefined;
    let isAdditionalProperty = schema_keys.hasOwnProperty(key) ? false : true;

    if (typeof schemaValue === 'undefined') {
      // for keys added through additionalProperties
      if (typeof schema.additionalProperties === 'boolean') schemaValue = {
        type: 'string'
      };else schemaValue = _extends({}, schema.additionalProperties);
    }

    let isRef = schemaValue.hasOwnProperty('$ref');
    if (isRef) schemaValue = args.getRef(schemaValue['$ref']);
    if (isReadonly) schemaValue.readOnly = true;
    let type = normalizeKeyword(schemaValue.type);

    if (!schemaValue.title) {
      if (isAdditionalProperty) schemaValue.title = key;else schemaValue.title = getVerboseName(key);
    }

    let removable = false;
    if (schema_keys[key] === undefined) removable = true;

    if (schema.hasOwnProperty('required') && Array.isArray(schema.required)) {
      if (schema.required.indexOf(key) > -1) schemaValue['required'] = true;
    }

    let nextArgs = {
      data: value,
      schema: schemaValue,
      name: childName,
      onChange: onChange,
      onAdd: onAdd,
      onRemove: onRemove,
      level: level + 1,
      removable: removable,
      onMove: onMove,
      onEdit: onEdit,
      parentType: 'object',
      getRef: args.getRef,
      errorMap: args.errorMap
    };

    nextArgs.onKeyEdit = () => handleKeyEdit(data, key, value, childName, onEdit);

    nextArgs.editable = removable;

    if (type === 'array') {
      rows.push(getArrayFormRow(nextArgs));
    } else if (type === 'object') {
      rows.push(getObjectFormRow(nextArgs));
    } else {
      // oneOf/anyOf
      if (nextArgs.schema.hasOwnProperty('oneOf')) {
        rows.push( /*#__PURE__*/React__default["default"].createElement(OneOf, {
          parentArgs: args,
          nextArgs: _extends({}, nextArgs),
          key: "oneOf_" + name + '_' + i
        }));
      } else if (nextArgs.schema.hasOwnProperty('anyOf')) {
        rows.push( /*#__PURE__*/React__default["default"].createElement(AnyOf, {
          parentArgs: args,
          nextArgs: _extends({}, nextArgs),
          key: "anyOf_" + name + '_' + i
        }));
      } else {
        rows.push(getStringFormRow(nextArgs));
      }
    }
  } // oneOf


  if (schema.hasOwnProperty('oneOf')) {
    rows.push( /*#__PURE__*/React__default["default"].createElement(OneOf, {
      parentArgs: args,
      key: "oneOf_" + name
    }));
  } // anyOf


  if (schema.hasOwnProperty('anyOf')) {
    rows.push( /*#__PURE__*/React__default["default"].createElement(AnyOf, {
      parentArgs: args,
      key: "anyOf_" + name
    }));
  }

  if (rows.length || schema.additionalProperties) {
    let coords = name;
    let groupError = args.errorMap[getCoordsFromName(coords)];
    if (typeof groupError === 'string') groupError = [groupError];
    rows = /*#__PURE__*/React__default["default"].createElement(FormGroup, {
      level: level,
      schema: schema,
      addable: schema.additionalProperties && !isReadonly,
      onAdd: () => handleKeyValueAdd(data, coords, onAdd, schema.additionalProperties, args.getRef),
      editable: args.editable,
      onEdit: args.onKeyEdit,
      key: 'row_group_' + name,
      collapsible: keys.length > 0,
      childrenType: "rows"
    }, groupError && groupError.map((error, i) => /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-error-text",
      key: i
    }, error)), rows);

    if (args.parentType === 'object' && args.removable) {
      rows = /*#__PURE__*/React__default["default"].createElement("div", {
        className: "rjf-form-group-wrapper",
        key: 'row_group_wrapper_' + name
      }, /*#__PURE__*/React__default["default"].createElement(FormRowControls, {
        onRemove: e => onRemove(name)
      }), rows);
    }
  }

  return rows;
}
function getOneOfFormRow(args) {
  /* For top-level oneOf when type is not provided.
   This will try to find appropriate option for the given data.
  */
  return /*#__PURE__*/React__default["default"].createElement(OneOfTopLevel, {
    args: args
  });
}
function getAnyOfFormRow(args) {
  /* For top-level oneOf when type is not provided */
  return /*#__PURE__*/React__default["default"].createElement(OneOfTopLevel, {
    args: args,
    schemaName: "anyOf"
  });
}
function getAllOfFormRow(args) {
  /* For top-level oneOf when type is not provided */
  // currently we only suuport allOf inside an object.
  // so we'll render it as an object
  return getObjectFormRow(args);
}

class OneOfTopLevel extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.findSelectedOption = () => {
      /* Returns index of currently selected option.
       * It's a hard problem to reliably find the selected option for
       * the given data.
      */
      actualType(this.props.args.data);
      return findMatchingSubschemaIndex(this.props.args.data, this.props.args.schema, this.props.args.getRef, this.schemaName);
    };

    this.getOptions = () => {
      return this.props.args.schema[this.schemaName].map((option, index) => {
        return {
          label: option.title || 'Option ' + (index + 1),
          value: index
        };
      });
    };

    this.getSchema = index => {
      if (index === undefined) index = this.state.option;
      let schema = this.props.args.schema[this.schemaName][index];
      let isRef = schema.hasOwnProperty('$ref');
      if (isRef) schema = this.props.args.getRef(schema['$ref']);
      return schema;
    };

    this.handleOptionChange = e => {
      this.updateData(this.getSchema(e.target.value)); // Uncomment when caching is reimplemented
      //
      // this.setState({
      //     option: e.target.value
      // });
    };

    this.schemaName = this.props.schemaName || 'oneOf'; // Uncomment when caching is implemented
    //
    // this.state = {
    //     option: this.findSelectedOption(),
    // };
  }

  updateData(newSchema) {
    this.props.args.onChange(this.props.args.name, getBlankData(newSchema, this.props.args.getRef));
  }

  render() {
    /* Perfomance note:
     *
     * In order to resolve https://github.com/bhch/react-json-form/issues/67,
     * we will not cache the selected option. Instead, we'll recalculate the
     * selected option on every render.
     *
     * If there're serious performance issues, we'll reconsider caching.
    */
    let selectedOption = this.findSelectedOption();
    let schema = this.getSchema(selectedOption);
    let type = getSchemaType(schema);
    let args = this.props.args;
    let rowFunc;

    if (type === 'object') {
      rowFunc = getObjectFormRow;
    } else if (type === 'array') {
      rowFunc = getArrayFormRow;
    } else {
      rowFunc = getStringFormRow;
      args.removable = false;
      args.onMoveUp = null;
      args.onMoveDown = null;
      if (Array.isArray(args.data) || typeof args.data === 'object') args.data = null;
    }

    let rows = rowFunc(_extends({}, args, {
      schema: schema
    }));
    let selectorLabel = this.props.args.schema.title || null;
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-form-group rjf-oneof-group rjf-oneof-group-top-level"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-oneof-selector"
    }, /*#__PURE__*/React__default["default"].createElement(FormSelectInput, {
      value: selectedOption,
      options: this.getOptions(),
      onChange: this.handleOptionChange,
      className: "rjf-oneof-selector-input",
      label: selectorLabel
    })), rows);
  }

}

class OneOf extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.findSelectedOption = () => {
      /* Returns index of currently selected option.
       * It's a hard problem to reliably find the selected option for
       * the given data.
      */
      let index = 0;

      if (this.props.nextArgs) {
        let dataType = actualType(this.props.nextArgs.data);
        let subschemas = this.props.nextArgs.schema[this.schemaName];

        for (let i = 0; i < subschemas.length; i++) {
          let subschema = subschemas[i];
          let isRef = subschema.hasOwnProperty('$ref');
          if (isRef) subschema = this.props.parentArgs.getRef(subschema['$ref']);
          let subType = getSchemaType(subschema);

          if (subschema.hasOwnProperty('const')) {
            if (subschema.const === this.props.nextArgs.data) {
              index = 1;
              break;
            } else {
              continue;
            }
          }

          if (dataType === 'number') {
            if (subType === 'number' || subType === 'integer') {
              index = i;
              break;
            }
          } else if (dataType === 'null' && ['boolean', 'integer', 'number'].indexOf(subType) > -1) {
            index = i;
            break;
          } else if (dataType === 'object') {
            // check if all keys match
            if (dataObjectMatchesSchema(this.props.nextArgs.data, subschema)) {
              index = i;
              break;
            }
          } else if (dataType === 'array') {
            // check if item types match
            if (dataArrayMatchesSchema(this.props.nextArgs.data, subschema)) {
              index = i;
              break;
            }
          } else if (dataType === subType) {
            index = i;
            break;
          }
        }
      } else {
        let data = this.props.parentArgs.data;
        let dataType = actualType(data);
        let subschemas = this.props.parentArgs.schema[this.schemaName];
        if (subschemas === undefined) return index;

        for (let i = 0; i < subschemas.length; i++) {
          let subschema = subschemas[i];
          let subType = getSchemaType(subschema);
          if (subType !== dataType) continue;

          if (dataType === 'object') {
            if (dataObjectMatchesSchema(data, subschema)) {
              index = i;
              break;
            }
          } else if (dataType === 'array') {
            // check if all items in data match the items type
            // strangely enough, haven't found a schema case
            // which triggers this condition.
            // for the time being, let's just throw an error if
            // this runs and ask the user to report the error
            throw new Error("Unexpected block (#1) tirggered. " + "If you see this error, you've found a rare schema. " + "Please report this issue on our Github.");
          }
        }
      }

      return index;
    };

    this.getOptions = () => {
      let parentType = this.getParentType();

      if (parentType === 'object') {
        let schema;

        if (this.props.nextArgs) {
          // this is an object key which has oneOf keyword
          schema = this.props.nextArgs.schema;
        } else {
          schema = this.props.parentArgs.schema;
        }

        return schema[this.schemaName].map((option, index) => {
          return {
            label: option.title || 'Option ' + (index + 1),
            value: index
          };
        });
      } else if (parentType === 'array') {
        return this.props.parentArgs.schema.items[this.schemaName].map((option, index) => {
          return {
            label: option.title || 'Option ' + (index + 1),
            value: index
          };
        });
      }

      return [];
    };

    this.getSchema = index => {
      if (index === undefined) index = this.state.option;
      let parentType = this.getParentType();
      let schema;

      if (parentType === 'object') {
        if (this.props.nextArgs) {
          // this is an object key which has oneOf keyword
          schema = _extends({}, this.props.nextArgs.schema[this.schemaName][index]);
          if (!schema.title) schema.title = this.props.nextArgs.schema.title;
        } else {
          schema = this.props.parentArgs.schema[this.schemaName][index];
        }
      } else if (parentType === 'array') {
        schema = this.props.parentArgs.schema.items[this.schemaName][index];
      } else {
        schema = {
          'type': 'string'
        };
      }

      let isRef = schema.hasOwnProperty('$ref');
      if (isRef) schema = this.props.parentArgs.getRef(schema['$ref']);
      return schema;
    };

    this.getParentType = () => {
      return getSchemaType(this.props.parentArgs.schema);
    };

    this.handleOptionChange = (e, selectedOption) => {
      this.updateData(this.getSchema(selectedOption), this.getSchema(e.target.value)); // Uncomment when caching is implemented
      //
      // this.setState({
      //     option: e.target.value
      // });
    };

    this.schemaName = this.props.schemaName || 'oneOf'; // Uncomment when caching is implemented
    //
    // this.state = {
    //     option: this.findSelectedOption(),
    // };
  }
  /* Uncomment when caching is implemente
   componentDidUpdate(prevProps, prevState) {
      if (prevProps.nextArgs || this.props.nextArgs) {
          let prevDataType = 'string';
          let newDataType = 'string';
          if (prevProps.nextArgs)
              prevDataType = actualType(prevProps.nextArgs.data);
          if (this.props.nextArgs)
              newDataType = actualType(this.props.nextArgs.data);
           if (prevDataType !== newDataType)
              this.setState({option: this.findSelectedOption()});
      }
  }
  */


  updateData(oldSchema, newSchema) {
    let parentType = this.getParentType();
    /*
        If parent is an object,
            then all subschemas in oneOf must be objects containing properties
            of the parent object
            otherwise, it's an error
         If parent is an array,
            then the subschemas in oneOf can be anything.
    */

    if (parentType === 'object' && !this.props.nextArgs) {
      let name = this.props.parentArgs.name;
      let schema = newSchema;
      let data = this.props.parentArgs.data;
      let schemaProperties = getKeyword(schema, 'properties', 'keys', {}); // keys to remove

      let remove = [...Object.keys(getKeyword(oldSchema, 'properties', 'keys'))]; // keys to add

      let add = [...Object.keys(getKeyword(schema, 'properties', 'keys'))];
      let newData = {};

      for (let key in data) {
        if (!data.hasOwnProperty(key)) continue;
        if (remove.indexOf(key) > -1) continue;
        newData[key] = data[key];
      }

      add.forEach((key, index) => {
        newData[key] = getBlankData(schemaProperties[key], this.props.parentArgs.getRef);
      });
      this.props.parentArgs.onChange(name, newData);
    } else if (parentType === 'array' || this.props.nextArgs) {
      let name = this.props.nextArgs.name;
      let schema = newSchema;
      this.props.parentArgs.onChange(name, getBlankData(schema, this.props.parentArgs.getRef));
    }
  }

  render() {
    /* Perfomance note:
     *
     * In order to resolve https://github.com/bhch/react-json-form/issues/67,
     * we will not cache the selected option. Instead, we'll recalculate the
     * selected option on every render.
     *
     * If there're serious performance issues, we'll reconsider caching.
    */
    let selectedOption = this.findSelectedOption();
    let schema = this.getSchema(selectedOption);
    let type = getSchemaType(schema);
    let args = this.props.nextArgs ? this.props.nextArgs : this.props.parentArgs;
    let rowFunc;

    if (type === 'object') {
      rowFunc = getObjectFormRow;
      if (typeof args.data != 'object' || args.data === null) args.data = {};
    } else if (type === 'array') {
      rowFunc = getArrayFormRow;
      if (!Array.isArray(args.data)) args.data = [];
    } else {
      rowFunc = getStringFormRow;
      args.removable = false;
      args.onMoveUp = null;
      args.onMoveDown = null;
      if (Array.isArray(args.data) || typeof args.data === 'object') args.data = null;
    }

    let rows = rowFunc(_extends({}, args, {
      schema: schema
    }));
    let selectorLabel = null;
    if (this.props.nextArgs) selectorLabel = this.props.nextArgs.schema.title || null;
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-form-group rjf-oneof-group"
    }, /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-oneof-selector"
    }, /*#__PURE__*/React__default["default"].createElement(FormSelectInput, {
      value: selectedOption,
      options: this.getOptions(),
      onChange: e => this.handleOptionChange(e, selectedOption),
      className: "rjf-oneof-selector-input",
      label: selectorLabel
    })), rows);
  }

}

function AnyOf(props) {
  return /*#__PURE__*/React__default["default"].createElement(OneOf, _extends({}, props, {
    schemaName: "anyOf"
  }));
}

function handleKeyValueAdd(data, coords, onAdd, newSchema, getRef) {
  let key = prompt("Add new key");
  if (key === null) // clicked cancel
    return;
  if (newSchema === true) newSchema = {
    type: 'string'
  };
  key = key.trim();
  if (!key) alert("(!) Can't add empty key.\r\n\r\n‎");else if (data.hasOwnProperty(key)) alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");else onAdd(getBlankData(newSchema, getRef), joinCoords(coords, key));
}

function handleKeyEdit(data, key, value, coords, onEdit) {
  let newKey = prompt("Rename key", key);
  if (newKey === null) // clicked cancel
    return;
  newKey = newKey.trim();
  if (newKey === key) // same keys
    return;
  if (!newKey) return alert("(!) Key name can't be empty.\r\n\r\n‎");else if (data.hasOwnProperty(newKey)) return alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");
  let newCoords = splitCoords(coords);
  newCoords.pop();
  newCoords.push(newKey);
  newCoords = joinCoords.apply(null, newCoords);
  onEdit(value, newCoords, coords);
}

function validateSchema(schema) {
  if (!(schema instanceof Object)) return {
    isValid: false,
    msg: "Schema must be an object"
  };
  let type = getSchemaType(schema);
  let validation = {
    isValid: true,
    msg: ""
  };
  if (type === 'object') validation = validateObject(schema);else if (type === 'array') validation = validateArray(schema);else {
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
  if (!validation.isValid || !schema.hasOwnProperty('$defs')) return validation; // validate $defs
  // :TODO: validate $defs nested inside objects/arrays

  if (!schema['$defs'] instanceof Object) return {
    isValid: false,
    msg: "'$defs' must be a valid JavaScript Object"
  };
  return validation;
}
function validateObject(schema) {
  if (!schema.hasOwnProperty('keys') && !schema.hasOwnProperty('properties') && !schema.hasOwnProperty('oneOf') && !schema.hasOwnProperty('anyOf') && !schema.hasOwnProperty('allOf')) return {
    isValid: false,
    msg: "Schema of type '" + schema.type + "' must have at least one of these keys: " + "['properties' or 'keys' or 'oneOf' or 'anyOf' or 'allOf']"
  };
  let validation;
  let keys = schema.properties || schema.keys;

  if (keys) {
    validation = validateKeys(keys);
    if (!validation.isValid) return validation;
  }

  if (schema.hasOwnProperty('additionalProperties')) {
    if (!(schema.additionalProperties instanceof Object) && typeof schema.additionalProperties !== 'boolean') return {
      isValid: false,
      msg: "'additionalProperties' must be either a JavaScript boolean or a JavaScript object"
    };

    if (schema.additionalProperties instanceof Object) {
      if (schema.additionalProperties.hasOwnProperty('$ref')) {
        validation = validateRef(schema.additionalProperties);
        if (!validation.isValid) return validation;
      } else {
        let type = normalizeKeyword(schema.additionalProperties.type);
        if (type === 'object') return validateObject(schema.additionalProperties);else if (type === 'array') return validateSchema(schema.additionalProperties);
        /* :TODO: else validate allowed types */
      }
    }
  }

  if (schema.hasOwnProperty('oneOf')) {
    validation = validateOneOf(schema);
    if (!validation.isValid) return validation;
  }

  if (schema.hasOwnProperty('anyOf')) {
    validation = validateAnyOf(schema);
    if (!validation.isValid) return validation;
  }

  if (schema.hasOwnProperty('allOf')) {
    validation = validateAllOf(schema);
    if (!validation.isValid) return validation;
  }

  return {
    isValid: true,
    msg: ""
  };
}

function validateKeys(keys) {
  if (!(keys instanceof Object)) return {
    isValid: false,
    msg: "The 'keys' or 'properties' key must be a valid JavaScript Object"
  };

  for (let key in keys) {
    if (!keys.hasOwnProperty(key)) continue;
    let value = keys[key];
    if (!(value instanceof Object)) return {
      isValid: false,
      msg: "Key '" + key + "' must be a valid JavaScript Object"
    };
    let validation = {
      isValid: true
    };
    let value_type = normalizeKeyword(value.type);

    if (value_type) {
      if (value_type === 'object') validation = validateObject(value);else if (value_type === 'array') validation = validateArray(value);
    } else if (value.hasOwnProperty('$ref')) {
      validation = validateRef(value);
    } else if (value.hasOwnProperty('oneOf')) {
      validation = validateOneOf(value);
    } else if (value.hasOwnProperty('anyOf')) {
      validation = validateAnyOf(value);
    } else if (value.hasOwnProperty('allOf')) {
      validation = validateAllOf(value);
    } else if (value.hasOwnProperty('const')) {
      validation = validateConst();
    } else {
      validation = {
        isValid: false,
        msg: "Key '" + key + "' must have a 'type' or a '$ref"
      };
    }

    if (!validation.isValid) return validation;
  }

  return {
    isValid: true,
    msg: ""
  };
}

function validateArray(schema) {
  if (!schema.hasOwnProperty('items')) return {
    isValid: false,
    msg: "Schema of type '" + schema.type + "' must have a key called 'items'"
  };
  if (!(schema.items instanceof Object)) return {
    isValid: false,
    msg: "The 'items' key must be a valid JavaScript Object'"
  };
  let items_type = normalizeKeyword(schema.items.type);

  if (items_type) {
    if (items_type === 'object') return validateObject(schema.items);else if (items_type === 'array') return validateArray(schema.items);
    /* :TODO: else validate allowed types */
  } else if (schema.items.hasOwnProperty('$ref')) {
    return validateRef(schema.items);
  } else {
    if (!schema.items.hasOwnProperty('oneOf') && !schema.items.hasOwnProperty('anyOf') && !schema.items.hasOwnProperty('allOf') && !schema.items.hasOwnProperty('const')) return {
      isValid: false,
      msg: "Array 'items' must have a 'type' or '$ref' or 'oneOf' or 'anyOf'"
    };
  }

  if (schema.items.hasOwnProperty('oneOf')) {
    validation = validateOneOf(schema.items);
    if (!validation.isValid) return validation;
  }

  if (schema.items.hasOwnProperty('anyOf')) {
    validation = validateAnyOf(schema.items);
    if (!validation.isValid) return validation;
  }

  if (schema.items.hasOwnProperty('allOf')) {
    // we don't support allOf inside array yet
    return {
      isValid: false,
      msg: "Currently, 'allOf' inside array items is not supported"
    };
  }

  if (schema.items.hasOwnProperty('const')) {
    validation = validateConst();
    if (!validation.isValid) return validation;
  }

  return {
    isValid: true,
    msg: ""
  };
}
function validateRef(schema) {
  if (typeof schema['$ref'] !== 'string') return {
    isValid: false,
    msg: "'$ref' keyword must be a string"
  };
  if (!schema['$ref'].startsWith('#')) return {
    isValid: false,
    msg: "'$ref' value must begin with a hash (#) character"
  };
  if (schema['$ref'].lenght > 1 && !schema['$ref'].startsWith('#/')) return {
    isValid: false,
    msg: "Invalid '$ref' path"
  };
  return {
    isValid: true,
    msg: ""
  };
}
function validateOneOf(schema) {
  return validateSubschemas(schema, 'oneOf');
}
function validateAnyOf(schema) {
  return validateSubschemas(schema, 'anyOf');
}
function validateAllOf(schema) {
  let validation = validateSubschemas(schema, 'allOf');
  if (!validation.isValid) return validation; // currently, we only support anyOf inside an object
  // so, we'll check if all subschemas are objects or not

  let subschemas = schema['allOf'];

  for (let i = 0; i < subschemas.length; i++) {
    let subschema = subschemas[i];
    let subType = getSchemaType(subschema);

    if (subType !== 'object') {
      return {
        isValid: false,
        msg: "Possible conflict in 'allOf' subschemas. Currently, we only support subschemas listed in 'allOf' to be of type 'object'."
      };
    }
  }

  return validation;
}

function validateConst(schema) {
  return {
    isValid: true,
    msg: ""
  };
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
  if (!Array.isArray(subschemas)) return {
    isValid: false,
    msg: "'" + keyword + "' property must be an array"
  };
  if (!subschemas.length) return {
    isValid: false,
    msg: "'" + keyword + "' must contain at least one subschema"
  };

  for (let i = 0; i < subschemas.length; i++) {
    let subschema = subschemas[i];
    let subType = getSchemaType(subschema);

    if (subType === 'object') {
      let validation = validateObject(subschema);
      if (!validation.isValid) return validation;
    } else if (subType === 'array') {
      let validation = validateArray(subschema);
      if (!validation.isValid) return validation;
    }
  }

  return {
    isValid: true,
    msg: ""
  };
}

class EditorState {
  /* Not for public consumption */
  constructor(state) {
    this.state = state;
  }

  static create(schema, data) {
    /*
      schema and data can be either a JSON string or a JS object.
      data is optional.
    */
    if (typeof schema === 'string') schema = JSON.parse(schema);
    let validation = validateSchema(schema);
    if (!validation.isValid) throw new Error('Error while creating EditorState: Invalid schema: ' + validation.msg);
    if (typeof data === 'string' && data !== '') data = JSON.parse(data);

    if (!data && data !== null) {
      // create empty data from schema
      data = getBlankData(schema, ref => EditorState.getRef(ref, schema));
    } else {
      // data might be stale if schema has new keys, so add them to data
      try {
        data = getSyncedData(data, schema, ref => EditorState.getRef(ref, schema));
      } catch (error) {
        console.error("Error while creating EditorState: Schema and data structure don't match");
        throw error;
      }
    }

    return new EditorState({
      schema: schema,
      data: data
    });
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
      if (token === '#') refSchema = schema;else refSchema = refSchema[token];
    }

    return _extends({}, refSchema);
  }

  static update(editorState, data) {
    /* Only for updating data.
       For updating schema, create new state.
    */
    return new EditorState(_extends({}, editorState._getState(), {
      data: data
    }));
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

class ReactJSONForm extends React__default["default"].Component {
  constructor(..._args) {
    super(..._args);

    this.handleChange = (coords, value) => {
      /*
          e.target.name is a chain of indices and keys:
          xxx-0-key-1-key2 and so on.
          These can be used as coordinates to locate 
          a particular deeply nested item.
           This first coordinate is not important and should be removed.
      */
      coords = splitCoords(coords);
      coords.shift(); // remove first coord
      // :TODO: use immutable JS instead of JSON-ising the data

      let data = setDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())), value);
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.getRef = ref => {
      /* Returns schema reference. Nothing to do with React's refs.*/
      return EditorState.getRef(ref, this.props.editorState.getSchema());
    };

    this.getFields = () => {
      let data = this.props.editorState.getData();
      let schema = this.props.editorState.getSchema();
      let formGroups = [];
      let type = getSchemaType(schema);
      let args = {
        data: data,
        schema: schema,
        name: FIELD_NAME_PREFIX,
        onChange: this.handleChange,
        onAdd: this.addFieldset,
        onRemove: this.removeFieldset,
        onEdit: this.editFieldset,
        onMove: this.moveFieldset,
        level: 0,
        getRef: this.getRef,
        errorMap: this.props.errorMap || {}
      };
      if (this.props.readonly) args.schema.readOnly = true;
      if (type === 'array') return getArrayFormRow(args);else if (type === 'object') return getObjectFormRow(args);else if (type === 'oneOf') return getOneOfFormRow(args);else if (type === 'anyOf') return getAnyOfFormRow(args);else if (type === 'allOf') return getAllOfFormRow(args);
      return formGroups;
    };

    this.addFieldset = (blankData, coords) => {
      coords = splitCoords(coords);
      coords.shift(); // :TODO: use immutable JS instead of JSON-ising the data

      let data = addDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())), blankData);
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.removeFieldset = coords => {
      coords = splitCoords(coords);
      coords.shift(); // :TODO: use immutable JS instead of JSON-ising the data

      let data = removeDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())));
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.editFieldset = (value, newCoords, oldCoords) => {
      /* Add and remove in a single state update
           newCoords will be added
          oldCoords willbe removed
      */
      newCoords = splitCoords(newCoords);
      newCoords.shift();
      oldCoords = splitCoords(oldCoords);
      oldCoords.shift();
      let data = addDataUsingCoords(newCoords, JSON.parse(JSON.stringify(this.props.editorState.getData())), value);
      data = removeDataUsingCoords(oldCoords, data);
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.moveFieldset = (oldCoords, newCoords) => {
      oldCoords = splitCoords(oldCoords);
      oldCoords.shift();
      newCoords = splitCoords(newCoords);
      newCoords.shift(); // :TODO: use immutable JS instead of JSON-ising the data

      let data = moveDataUsingCoords(oldCoords, newCoords, JSON.parse(JSON.stringify(this.props.editorState.getData())));
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      className: "rjf-form-wrapper"
    }, /*#__PURE__*/React__default["default"].createElement("fieldset", {
      className: "module aligned"
    }, /*#__PURE__*/React__default["default"].createElement(EditorContext.Provider, {
      value: {
        fileHandler: this.props.fileHandler,
        fileHandlerArgs: this.props.fileHandlerArgs
      }
    }, this.getFields())));
  }

}

function setDataUsingCoords(coords, data, value) {
  let coord = coords.shift();
  if (!isNaN(Number(coord))) coord = Number(coord);

  if (coords.length) {
    data[coord] = setDataUsingCoords(coords, data[coord], value);
  } else {
    if (coord === undefined) // top level array with multiselect widget
      data = value;else data[coord] = value;
  }

  return data;
}

function addDataUsingCoords(coords, data, value) {
  let coord = coords.shift();
  if (!isNaN(Number(coord))) coord = Number(coord);

  if (coords.length) {
    data[coord] = addDataUsingCoords(coords, data[coord], value);
  } else {
    if (Array.isArray(data[coord])) {
      data[coord].push(value);
    } else {
      if (Array.isArray(data)) {
        data.push(value);
      } else {
        data[coord] = value;
      }
    }
  }

  return data;
}

function removeDataUsingCoords(coords, data) {
  let coord = coords.shift();
  if (!isNaN(Number(coord))) coord = Number(coord);

  if (coords.length) {
    removeDataUsingCoords(coords, data[coord]);
  } else {
    if (Array.isArray(data)) data.splice(coord, 1); // in-place mutation
    else delete data[coord];
  }

  return data;
}

function moveDataUsingCoords(oldCoords, newCoords, data) {
  let oldCoord = oldCoords.shift();
  if (!isNaN(Number(oldCoord))) oldCoord = Number(oldCoord);

  if (oldCoords.length) {
    moveDataUsingCoords(oldCoords, newCoords, data[oldCoord]);
  } else {
    if (Array.isArray(data)) {
      /* Using newCoords allows us to move items from 
      one array to another. 
      However, for now, we're only moving items in a 
      single array.
      */
      let newCoord = newCoords[newCoords.length - 1];
      let item = data[oldCoord];
      data.splice(oldCoord, 1);
      data.splice(newCoord, 0, item);
    }
  }

  return data;
}

function DataValidator(schema) {
  this.schema = schema;
  this.errorMap = {};

  this.validate = function (data) {
    // reset errorMap so that this validator object
    // can be reused for same schema
    this.errorMap = {};
    let validator = this.getValidator(getSchemaType(schema));
    if (validator) validator(this.schema, data, '');else this.addError('', 'Invalid schema type: "' + schema.type + '"');
    let validation = {
      isValid: true,
      errorMap: this.errorMap
    };
    if (Object.keys(this.errorMap).length) validation['isValid'] = false;
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

      case 'allOf':
        func = this.validateAllOf;
        break;

      case 'oneOf':
        func = this.validateOneOf;
        break;

      case 'anyOf':
        func = this.validateAnyOf;
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

    if (func) return func.bind(this);
    return func;
  };

  this.getRef = function (ref) {
    return EditorState.getRef(ref, this.schema);
  };

  this.addError = function (coords, msg) {
    if (!this.errorMap.hasOwnProperty(coords)) this.errorMap[coords] = [];
    this.errorMap[coords].push(msg);
  };

  this.joinCoords = function (coords) {
    let c = joinCoords.apply(null, coords);
    if (c.startsWith(JOIN_SYMBOL)) c = c.slice(1);
    return c;
  };

  this.validateArray = function (schema, data, coords) {
    if (!Array.isArray(data)) {
      this.addError(coords, "Invalid data type. Expected array.");
      return;
    }

    let next_schema = schema.items;
    if (next_schema.hasOwnProperty('$ref')) next_schema = this.getRef(next_schema.$ref);
    let next_type = normalizeKeyword(next_schema.type);
    let minItems = getKeyword(schema, 'minItems', 'min_items');
    let maxItems = getKeyword(schema, 'maxItems', 'max_items');
    let choices = getKeyword(schema.items, 'choices', 'enum');
    if (minItems && data.length < parseInt(minItems)) this.addError(coords, 'Minimum ' + minItems + ' items required.');
    if (maxItems && data.length > parseInt(maxItems)) this.addError(coords, 'Maximum ' + maxItems + ' items allowed.');

    if (getKey(schema, 'uniqueItems')) {
      let items_type = next_type;

      if (items_type === 'array' || items_type === 'object') {
        if (data.length !== new Set(data.map(i => JSON.stringify(i))).size) this.addError(coords, 'All items in this list must be unique.');
      } else {
        if (data.length !== new Set(data).size) this.addError(coords, 'All items in this list must be unique.');
      }
    }

    if (choices) {
      let invalid_choice = data.find(i => choices.indexOf(i) === -1);
      if (typeof invalid_choice !== 'undefined') this.addError(coords, 'Invalid choice + "' + invalid_choice + '"');
    }

    let next_validator = this.getValidator(next_type);

    if (!next_validator) {
      if (next_schema.hasOwnProperty('oneOf')) {
        next_validator = this.validateOneOf;
      } else if (next_schema.hasOwnProperty('anyOf')) {
        next_validator = this.validateAnyOf;
      } else if (next_schema.hasOwnProperty('anyOf')) ;
    }

    if (next_validator) {
      for (let i = 0; i < data.length; i++) next_validator(next_schema, data[i], this.joinCoords([coords, i]));
    } else this.addError(coords, 'Unsupported type "' + next_type + '" for array items.');
  };

  this.validateObject = function (schema, data, coords) {
    if (typeof data !== 'object' || Array.isArray(data)) {
      this.addError(coords, "Invalid data type. Expected object.");
      return;
    }

    let fields = getKeyword(schema, 'properties', 'keys', {});
    let data_keys = Object.keys(data);
    let missing_keys = Object.keys(fields).filter(i => data_keys.indexOf(i) === -1);

    if (missing_keys.length) {
      this.addError(coords, 'These fields are missing from the data: ' + missing_keys.join(', '));
      return;
    }

    for (let key in data) {
      if (!data.hasOwnProperty(key)) continue;
      let next_schema;
      if (fields.hasOwnProperty(key)) next_schema = fields[key];else {
        if (!schema.hasOwnProperty('additionalProperties')) continue;
        next_schema = schema.additionalProperties;
        if (next_schema === true) next_schema = {
          type: 'string'
        };
      }
      if (next_schema.hasOwnProperty('$ref')) next_schema = this.getRef(next_schema.$ref);

      if (schema.hasOwnProperty('required') && Array.isArray(schema.required)) {
        if (schema.required.indexOf(key) > -1 && !next_schema.hasOwnProperty('required')) next_schema['required'] = true;
      }

      let next_type = normalizeKeyword(next_schema.type);
      let next_validator = this.getValidator(next_type);
      if (next_validator) next_validator(next_schema, data[key], this.joinCoords([coords, key]));else {
        this.addError(coords, 'Unsupported type "' + next_type + '" for object properties (keys).');
        return;
      }
    }

    if (schema.hasOwnProperty('allOf')) this.validateAllOf(schema, data, coords);
  };

  this.validateAllOf = function (schema, data, coords) {
    /* Currently, we only support allOf inside object
    so we assume the given type to be an object.
    */
    let newSchema = {
      type: 'object',
      properties: {}
    }; // combine subschemas

    for (let i = 0; i < schema.allOf.length; i++) {
      let subschema = schema.allOf[i];
      if (subschema.hasOwnProperty('$ref')) subschema = this.getRef(subschema.$ref);
      let fields = getKeyword(subschema, 'properties', 'keys', {});

      for (let field in fields) newSchema.properties[field] = fields[field];
    }

    this.validateObject(newSchema, data, coords);
  };

  this.validateOneOf = function (schema, data, coords) {// :TODO:
  };

  this.validateAnyOf = function (schema, data, coords) {// :TODO:
  };

  this.validateString = function (schema, data, coords) {
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
    if (schema.minLength && data.length < parseInt(schema.minLength)) this.addError(coords, 'This value must be at least ' + schema.minLength + ' characters long.');
    if ((schema.maxLength || schema.maxLength == 0) && data.length > parseInt(schema.maxLength)) this.addError(coords, 'This value may not be longer than ' + schema.maxLength + ' characters.');

    if (!valueInChoices(schema, data)) {
      this.addError(coords, 'Invalid choice "' + data + '"');
      return;
    }

    let format = normalizeKeyword(schema.format);
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

    if (format_validator) format_validator.call(this, schema, data, coords);
  };

  this.validateBoolean = function (schema, data, coords) {
    if (schema.required && (data === null || data === undefined)) {
      this.addError(coords, 'This field is required.');
      return;
    }

    if (typeof data !== 'boolean' && data !== null && data !== undefined) this.addError(coords, 'Invalid value.');
  };

  this.validateInteger = function (schema, data, coords) {
    if (schema.required && (data === null || data === undefined)) {
      this.addError(coords, 'This field is required.');
      return;
    }

    if (data === null) // not required, integer can be null
      return;

    if (typeof data !== 'number') {
      this.addError(coords, 'Invalid value. Only integers allowed.');
      return;
    } // 1.0 and 1 must be treated equal


    if (data !== parseInt(data)) {
      this.addError(coords, 'Invalid value. Only integers allowed.');
      return;
    }

    this.validateNumber(schema, data, coords);
  };

  this.validateNumber = function (schema, data, coords) {
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

    if ((schema.minimum || schema.minimum === 0) && data < schema.minimum) this.addError(coords, 'This value must not be less than ' + schema.minimum);
    if ((schema.maximum || schema.maximum === 0) && data > schema.maximum) this.addError(coords, 'This value must not be greater than ' + schema.maximum);
    if ((schema.exclusiveMinimum || schema.exclusiveMinimum === 0) && data <= schema.exclusiveMinimum) this.addError(coords, 'This value must be greater than ' + schema.exclusiveMinimum);
    if ((schema.exclusiveMaximum || schema.exclusiveMaximum === 0) && data >= schema.exclusiveMaximum) this.addError(coords, 'This value must be less than ' + schema.exclusiveMaximum);
    if ((schema.multipleOf || schema.multipleOf === 0) && data * 100 % (schema.multipleOf * 100) / 100) this.addError(coords, 'This value must be a multiple of ' + schema.multipleOf);

    if (!valueInChoices(schema, data)) {
      this.addError(coords, 'Invalid choice "' + data + '"');
      return;
    }
  };

  this.validateEmail = function (schema, data, coords) {
    // half-arsed validation but will do for the time being
    if (data.indexOf(' ') > -1) {
      this.addError(coords, 'Enter a valid email address.');
      return;
    }

    if (data.length > 320) {
      this.addError(coords, 'Email may not be longer than 320 characters');
      return;
    }
  };

  this.validateDate = function (schema, data, coords) {// :TODO:
  };

  this.validateTime = function (schema, data, coords) {// :TODO:
  };

  this.validateDateTime = function (schema, data, coords) {// :TODO:
  };
}

function FormInstance(config) {
  this.containerId = config.containerId;
  this.dataInputId = config.dataInputId;
  this.schema = config.schema;
  this.data = config.data;
  this.errorMap = config.errorMap;
  this.fileHandler = config.fileHandler;
  this.fileHandlerArgs = config.fileHandlerArgs || {};
  this.readonly = config.readonly || false;
  this.eventListeners = null;
  this._dataSynced = false;

  this.addEventListener = function (event, listener) {
    if (this.eventListeners === null) this.eventListeners = {};
    if (!this.eventListeners.hasOwnProperty(event)) this.eventListeners[event] = new Set();
    this.eventListeners[event].add(listener);
  };

  this.onChange = function (e) {
    this.data = e.data;

    if (!this._dataSynced) {
      // this is the first change event for syncing data
      this._dataSynced = true;
      return;
    }

    if (!this.eventListeners) return;
    if (!this.eventListeners.hasOwnProperty('change') || !this.eventListeners.change.size) return;
    this.eventListeners.change.forEach(cb => cb(e));
  };

  this.onChange = this.onChange.bind(this);

  this.render = function () {
    try {
      ReactDOM__default["default"].render( /*#__PURE__*/React__default["default"].createElement(FormContainer, {
        schema: this.schema,
        dataInputId: this.dataInputId,
        data: this.data,
        errorMap: this.errorMap,
        fileHandler: this.fileHandler,
        fileHandlerArgs: this.fileHandlerArgs,
        onChange: this.onChange,
        readonly: this.readonly
      }), document.getElementById(this.containerId));
    } catch (error) {
      ReactDOM__default["default"].render( /*#__PURE__*/React__default["default"].createElement(ErrorReporter, {
        error: error
      }), document.getElementById(this.containerId));
    }
  };

  this.update = function (config) {
    this.schema = config.schema || this.schema;
    this.data = config.data || this.data;
    this.errorMap = config.errorMap || this.errorMap;
    this.render();
  };

  this.getSchema = function () {
    return this.schema;
  };

  this.getData = function () {
    return this.data;
  };

  this.validate = function () {
    let validator = new DataValidator(this.getSchema());
    return validator.validate(this.getData());
  };
}
const FORM_INSTANCES = {};
function createForm(config) {
  let instance = new FormInstance(config); // save a reference to the instance

  FORM_INSTANCES[config.containerId] = instance;
  return instance;
}
function getFormInstance(id) {
  return FORM_INSTANCES[id];
}
class FormContainer extends React__default["default"].Component {
  constructor(props) {
    super(props);

    this.populateDataInput = data => {
      this.dataInput.value = JSON.stringify(data);
    };

    this.handleChange = editorState => {
      this.setState({
        editorState: editorState
      });
    };

    this.state = {
      editorState: EditorState.create(props.schema, props.data)
    };
    this.prevEditorState = this.state.editorState;
    this.dataInput = document.getElementById(props.dataInputId);
  }

  componentDidMount() {
    this.props.onChange({
      data: this.state.editorState.getData()
    });
    this.populateDataInput(this.state.editorState.getData());
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.schema !== prevProps.schema) {
      let newSchema = this.props.schema;
      let newData = this.props.data !== prevProps.data ? this.props.data : this.state.editorState.getData();
      this.setState({
        editorState: EditorState.create(newSchema, newData)
      });
      return;
    }

    if (this.props.data !== prevProps.data) {
      this.setState({
        editorState: EditorState.update(this.state.editorState, this.props.data)
      });
      return;
    }

    if (this.state.editorState !== prevState.editorState) this.populateDataInput(this.state.editorState.getData());
    if (this.props.onChange && this.state.editorState !== prevState.editorState) this.props.onChange({
      schema: this.state.editorState.getSchema(),
      data: this.state.editorState.getData(),
      prevSchema: prevState.editorState.getSchema(),
      prevData: prevState.editorState.getData()
    });
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement(ReactJSONForm, {
      editorState: this.state.editorState,
      onChange: this.handleChange,
      fileHandler: this.props.fileHandler,
      fileHandlerArgs: this.props.fileHandlerArgs,
      errorMap: this.props.errorMap,
      readonly: this.props.readonly
    });
  }

}

function ErrorReporter(props) {
  /* Component for displaying errors to the user related to schema */
  return /*#__PURE__*/React__default["default"].createElement("div", {
    style: {
      color: '#f00'
    }
  }, /*#__PURE__*/React__default["default"].createElement("p", null, "(!) ", props.error.toString()), /*#__PURE__*/React__default["default"].createElement("p", null, "Check browser console for more details about the error."));
}

exports.DataValidator = DataValidator;
exports.EditorState = EditorState;
exports.ReactJSONForm = ReactJSONForm;
exports.createForm = createForm;
exports.getFormInstance = getFormInstance;
