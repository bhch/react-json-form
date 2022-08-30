import React$1 from 'react';
import ReactModal from 'react-modal';
import ReactDOM from 'react-dom';

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

function getBlankObject(schema, getRef) {
  let keys = {};
  let schema_keys = schema.keys || schema.properties;

  for (let key in schema_keys) {
    let value = schema_keys[key];
    let isRef = value.hasOwnProperty('$ref');
    if (isRef) value = getRef(value['$ref']);
    let type = value.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    if (type === 'array') keys[key] = isRef ? [] : getBlankArray(value, getRef);else if (type === 'object') keys[key] = getBlankObject(value, getRef);else if (type === 'boolean') keys[key] = value.default === false ? false : value.default || null;else if (type === 'integer' || type === 'number') keys[key] = value.default === 0 ? 0 : value.default || null;else // string etc.
      keys[key] = value.default || '';
  }

  return keys;
}
function getBlankArray(schema, getRef) {
  let minItems = schema.minItems || schema.min_items || 0;
  if (schema.default && schema.default.length >= minItems) return schema.default;
  let items = [];
  if (schema.default) items = [...schema.default];
  if (minItems === 0) return items;

  if (schema.items.hasOwnProperty('$ref')) {
    // :TODO: this will most probably mutate the original schema
    // but i'll fix it later
    schema.items = getRef(schema.items['$ref']);
  }

  let type = schema.items.type;
  if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

  if (type === 'array') {
    while (items.length < minItems) items.push(getBlankArray(schema.items, getRef));

    return items;
  } else if (type === 'object') {
    while (items.length < minItems) items.push(getBlankObject(schema.items, getRef));

    return items;
  }

  if (schema.items.widget === 'multiselect') return items;

  if (type === 'boolean') {
    while (items.length < minItems) items.push(schema.items.default === false ? false : schema.items.default || null);
  } else if (type === 'integer' || type === 'number') {
    while (items.length < minItems) items.push(schema.items.default === 0 ? 0 : schema.items.default || null);
  } else {
    // string, etc.
    while (items.length < minItems) items.push(schema.items.default || '');
  }

  return items;
}
function getBlankData(schema, getRef) {
  if (schema.hasOwnProperty('$ref')) schema = getRef(schema['$ref']);
  let type = schema.type;
  if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
  if (type === 'array') return getBlankArray(schema, getRef);else if (type === 'object') return getBlankObject(schema, getRef);else if (type === 'boolean') return schema.default === false ? false : schema.default || null;else if (type === 'integer' || type === 'number') return schema.default === 0 ? 0 : schema.default || null;else // string, etc.
    return schema.default || '';
}

function getSyncedArray(data, schema, getRef) {
  let newData = JSON.parse(JSON.stringify(data));

  if (schema.items.hasOwnProperty('$ref')) {
    // :TODO: this will most probably mutate the original schema
    // but i'll fix it later
    schema.items = getRef(schema.items['$ref']);
  }

  let type = schema.items.type;
  let minItems = schema.minItems || schema.min_items || 0;
  if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
  const filler = '__JSONRORM_FILLER__'; // filler for minItems

  while (data.length < minItems) data.push(filler);

  for (let i = 0; i < data.length; i++) {
    let item = data[i];

    if (type === 'array') {
      if (item === filler) item = [];
      newData[i] = getSyncedArray(item, schema.items, getRef);
    } else if (type === 'object') {
      if (item === filler) item = {};
      newData[i] = getSyncedObject(item, schema.items, getRef);
    } else {
      if (item === filler) {
        if (type === 'integer' || type === 'number') newData[i] = schema.items.default === 0 ? 0 : schema.items.default || null;else if (type === 'boolean') newData[i] = schema.items.default === false ? false : schema.items.default || null;else newData[i] = schema.items.default || '';
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
    if (isRef) schemaValue = getRef(schemaValue['$ref']);
    let type = schemaValue.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

    if (!data.hasOwnProperty(key)) {
      if (type === 'array') newData[key] = getSyncedArray([], schemaValue, getRef);else if (type === 'object') newData[key] = getSyncedObject({}, schemaValue, getRef);else if (type === 'boolean') newData[key] = schemaValue.default === false ? false : schemaValue.default || null;else if (type === 'integer' || type === 'number') newData[key] = schemaValue.default === 0 ? 0 : schemaValue.default || null;else newData[key] = schemaValue.default || '';
    } else {
      if (type === 'array') newData[key] = getSyncedArray(data[key], schemaValue, getRef);else if (type === 'object') newData[key] = getSyncedObject(data[key], schemaValue, getRef);else {
        if (data[key] === '') {
          if (type === 'integer' || type === 'number') newData[key] = schemaValue.default === 0 ? 0 : schemaValue.default || null;else if (type === 'boolean') newData[key] = schemaValue.default === false ? false : schemaValue.default || null;
        } else {
          newData[key] = data[key];
        }
      }
    }
  }

  return newData;
}

function getSyncedData(data, schema, getRef) {
  // adds those keys to data which are in schema but not in data
  if (schema.hasOwnProperty('$ref')) schema = getRef(schema['$ref']);
  let type = schema.type;
  if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

  if (type === 'array') {
    return getSyncedArray(data, schema, getRef);
  } else if (type === 'object') {
    return getSyncedObject(data, schema, getRef);
  }

  return data;
}

const _excluded$2 = ["className"];
function Button(_ref) {
  let {
    className
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, _excluded$2);

  if (!className) className = '';
  let classes = className.split(' ');
  className = '';

  for (let i = 0; i < classes.length; i++) {
    className = className + 'rjf-' + classes[i] + '-button ';
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
      icon = /*#__PURE__*/React.createElement(ChevronUp, null);
      break;

    case 'chevron-down':
      icon = /*#__PURE__*/React.createElement(ChevronDown, null);
      break;

    case 'arrow-down':
      icon = /*#__PURE__*/React.createElement(ArrowDown, null);
      break;

    case 'x-lg':
      icon = /*#__PURE__*/React.createElement(XLg, null);
      break;
  }

  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "16",
    height: "16",
    fill: "currentColor",
    className: "rjf-icon rjf-icon-" + props.name,
    viewBox: "0 0 16 16"
  }, icon);
}

function ChevronUp(props) {
  return /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    d: "M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"
  });
}

function ChevronDown(props) {
  return /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    d: "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
  });
}

function ArrowDown(props) {
  return /*#__PURE__*/React.createElement("path", {
    "fill-rule": "evenodd",
    d: "M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"
  });
}

function XLg(props) {
  return /*#__PURE__*/React.createElement("path", {
    d: "M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
  });
}

class TimePicker extends React$1.Component {
  constructor(...args) {
    super(...args);

    this.sendValue = data => {
      this.props.onChange(data);
    };

    this.validateValue = (name, value) => {
      if (name === 'hh' && value < 1) return 1;else if (name !== 'hh' && value < 0) return 0;else if (name === 'hh' && value > 12) return 12;else if (name !== 'hh' && value > 59) return 59;
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
    return /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-row rjf-time-picker-labels"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, "Hrs"), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, "Min"), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, "Sec"), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, "am/pm")), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-row"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('hh', 'up')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-up"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('mm', 'up')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-up"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('ss', 'up')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-up"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('ampm', 'up')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-up"
    })))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-row rjf-time-picker-values"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement("input", {
      type: "text",
      "data-name": "hh",
      value: this.props.hh,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onKeyDown: this.handleKeyDown
    })), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }, ":"), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement("input", {
      type: "text",
      "data-name": "mm",
      value: this.props.mm,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onKeyDown: this.handleKeyDown
    })), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }, ":"), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement("input", {
      type: "text",
      "data-name": "ss",
      value: this.props.ss,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onKeyDown: this.handleKeyDown
    })), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, this.props.ampm)), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-row"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('hh', 'down')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-down"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('mm', 'down')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-down"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('ss', 'down')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-down"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col rjf-time-picker-col-sm"
    }), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-time-picker-col"
    }, /*#__PURE__*/React$1.createElement(Button, {
      onClick: () => this.handleSpin('ampm', 'down')
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "chevron-down"
    })))));
  }

}

const EditorContext = /*#__PURE__*/React$1.createContext();
function capitalize(string) {
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
function getVerboseName(name) {
  if (name === undefined || name === null) return '';
  name = name.replace(/_/g, ' ');
  return capitalize(name);
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

const _excluded$1 = ["label", "help_text", "error", "inputRef"],
      _excluded2 = ["label", "help_text", "error", "value"],
      _excluded3 = ["label", "help_text", "error", "value", "options"],
      _excluded4 = ["label", "help_text", "error", "value", "options"],
      _excluded5 = ["label", "value"],
      _excluded6 = ["label", "help_text", "error", "inputRef"];
function FormInput(_ref) {
  let {
    label,
    help_text,
    inputRef
  } = _ref,
      props = _objectWithoutPropertiesLoose(_ref, _excluded$1);

  if (props.type === 'string') props.type = 'text';
  if (inputRef) props.ref = inputRef;
  if (props.value === null) props.value = '';
  return /*#__PURE__*/React$1.createElement("div", null, label && /*#__PURE__*/React$1.createElement("label", null, label), /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-input-group"
  }, /*#__PURE__*/React$1.createElement("input", props), help_text && /*#__PURE__*/React$1.createElement("span", {
    className: "rjf-help-text"
  }, help_text)));
}
function FormCheckInput(_ref2) {
  let {
    label,
    help_text,
    value
  } = _ref2,
      props = _objectWithoutPropertiesLoose(_ref2, _excluded2);

  if (!label) label = props.name.toUpperCase();
  if (props.type === 'bool') props.type = 'checkbox';
  if (props.checked === undefined) props.checked = value;
  if (props.checked === '' || props.checked === null || props.checked === undefined) props.checked = false;
  if (props.readOnly) props.disabled = true;
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-check-input"
  }, /*#__PURE__*/React$1.createElement("label", null, /*#__PURE__*/React$1.createElement("input", props), " ", label), help_text && /*#__PURE__*/React$1.createElement("span", {
    className: "rjf-help-text"
  }, help_text));
}
function FormRadioInput(_ref3) {
  let {
    label,
    help_text,
    value,
    options
  } = _ref3,
      props = _objectWithoutPropertiesLoose(_ref3, _excluded3);

  if (props.readOnly) props.disabled = true;
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-check-input"
  }, /*#__PURE__*/React$1.createElement("label", null, label), options.map((option, i) => {
    let label, inputValue;

    if (typeof option === 'object') {
      label = option.label;
      inputValue = option.value;
    } else {
      label = option;
      if (typeof label === 'boolean') label = capitalize(label.toString());
      inputValue = option;
    }

    return /*#__PURE__*/React$1.createElement("label", {
      key: label + '_' + inputValue + '_' + i
    }, /*#__PURE__*/React$1.createElement("input", _extends({}, props, {
      value: inputValue,
      checked: inputValue === value
    })), " ", label);
  }), help_text && /*#__PURE__*/React$1.createElement("span", {
    className: "rjf-help-text"
  }, help_text));
}
function FormSelectInput(_ref4) {
  let {
    label,
    help_text,
    value,
    options
  } = _ref4,
      props = _objectWithoutPropertiesLoose(_ref4, _excluded4);

  if (props.readOnly) props.disabled = true;
  if (!value && value !== false && value !== 0) value = '';
  return /*#__PURE__*/React$1.createElement("div", null, label && /*#__PURE__*/React$1.createElement("label", null, label), /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-input-group"
  }, /*#__PURE__*/React$1.createElement("select", _extends({
    value: value
  }, props), /*#__PURE__*/React$1.createElement("option", {
    disabled: true,
    value: "",
    key: '__placehlder'
  }, "Select..."), options.map((option, i) => {
    let label, inputValue;

    if (typeof option === 'object') {
      label = option.label;
      inputValue = option.value;
    } else {
      label = option;
      if (typeof label === 'boolean') label = capitalize(label.toString());
      inputValue = option;
    }

    return /*#__PURE__*/React$1.createElement("option", {
      value: inputValue,
      key: label + '_' + inputValue + '_' + i
    }, label);
  })), help_text && /*#__PURE__*/React$1.createElement("span", {
    className: "rjf-help-text"
  }, help_text)));
}
class FormMultiSelectInput extends React$1.Component {
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
    this.optionsContainer = /*#__PURE__*/React$1.createRef();
    this.input = /*#__PURE__*/React$1.createRef();
  }

  render() {
    return /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-multiselect-field"
    }, /*#__PURE__*/React$1.createElement(FormInput, {
      label: this.props.label,
      type: "text",
      value: this.props.value.length ? this.props.value.length + ' selected' : 'Select...',
      help_text: this.props.help_text,
      error: this.props.error,
      onClick: this.toggleOptions,
      readOnly: true,
      inputRef: this.input,
      className: "rjf-multiselect-field-input"
    }), this.state.showOptions && /*#__PURE__*/React$1.createElement(FormMultiSelectInputOptions, {
      options: this.props.options,
      value: this.props.value,
      hideOptions: this.hideOptions,
      onChange: this.handleChange,
      containerRef: this.optionsContainer,
      inputRef: this.input,
      disabled: this.props.readOnly,
      hasHelpText: this.props.help_text && 1
    }));
  }

}

class FormMultiSelectInputOptions extends React$1.Component {
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
    return /*#__PURE__*/React$1.createElement("div", {
      ref: this.props.containerRef
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-multiselect-field-options-container",
      style: this.props.hasHelpText ? {
        marginTop: '-15px'
      } : {}
    }, this.props.options.map((option, i) => {
      let label, inputValue;

      if (typeof option === 'object') {
        label = option.label;
        inputValue = option.value;
      } else {
        label = option;
        if (typeof label === 'boolean') label = capitalize(label.toString());
        inputValue = option;
      }

      let selected = this.props.value.indexOf(inputValue) > -1;
      let optionClassName = 'rjf-multiselect-field-option';
      if (selected) optionClassName += ' selected';
      if (this.props.disabled) optionClassName += ' disabled';
      return /*#__PURE__*/React$1.createElement("div", {
        key: label + '_' + inputValue + '_' + i,
        className: optionClassName
      }, /*#__PURE__*/React$1.createElement("label", null, /*#__PURE__*/React$1.createElement("input", {
        type: "checkbox",
        onChange: this.props.onChange,
        value: inputValue,
        checked: selected,
        disabled: this.props.disabled
      }), " ", label));
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
class FormFileInput extends React$1.Component {
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
        formData.append('field_name', this.context.fieldName);
        formData.append('model_name', this.context.modelName);
        formData.append('coordinates', JSON.stringify(this.props.name.split('-').slice(1)));
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
    this.inputRef = /*#__PURE__*/React$1.createRef();
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
    return /*#__PURE__*/React$1.createElement("div", null, label && /*#__PURE__*/React$1.createElement("label", null, label), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-file-field"
    }, this.state.value && /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-current-file-name"
    }, "Current file: ", /*#__PURE__*/React$1.createElement("span", null, this.state.fileName), " ", ' ', /*#__PURE__*/React$1.createElement(Button, {
      className: "remove-file",
      onClick: this.clearFile
    }, "Clear")), this.state.value && !this.state.loading && 'Change:', this.state.loading ? /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-file-field-loading"
    }, /*#__PURE__*/React$1.createElement(Loader, null), " Uploading...") : /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-file-field-input"
    }, /*#__PURE__*/React$1.createElement(FormInput, _extends({}, props, {
      inputRef: this.inputRef
    })))));
  }

}
FormFileInput.contextType = EditorContext;
class FormTextareaInput extends React$1.Component {
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

    if (!props.inputRef) this.inputRef = /*#__PURE__*/React$1.createRef();
  }

  componentDidMount() {
    if (this.props.inputRef) this.updateHeight(this.props.inputRef.current);else this.updateHeight(this.inputRef.current);
  }

  render() {
    let _this$props = this.props,
        {
      label,
      help_text,
      inputRef
    } = _this$props,
        props = _objectWithoutPropertiesLoose(_this$props, _excluded6);

    delete props.type;
    props.ref = inputRef || this.inputRef;
    props.onChange = this.handleChange;
    return /*#__PURE__*/React$1.createElement("div", null, label && /*#__PURE__*/React$1.createElement("label", null, label), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-input-group"
    }, /*#__PURE__*/React$1.createElement("textarea", props), help_text && /*#__PURE__*/React$1.createElement("span", {
      className: "rjf-help-text"
    }, help_text)));
  }

}
class FormDateTimeInput extends React$1.Component {
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
        showTimePicker: true
      });
    };

    this.state = _extends({}, this.getStateFromProps(), {
      showTimePicker: false
    });
    this.timeInput = /*#__PURE__*/React$1.createRef();
    this.timePickerContainer = /*#__PURE__*/React$1.createRef();
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
    return /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-datetime-field"
    }, this.props.label && /*#__PURE__*/React$1.createElement("label", null, this.props.label), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-datetime-field-inner"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-datetime-field-inputs"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-datetime-field-date"
    }, /*#__PURE__*/React$1.createElement(FormInput, {
      label: "Date",
      type: "date",
      value: this.state.date,
      onChange: this.handleDateChange
    })), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-datetime-field-time"
    }, /*#__PURE__*/React$1.createElement(FormInput, {
      label: "Time",
      type: "text",
      value: this.state.hh + ':' + this.state.mm + ':' + this.state.ss + ' ' + this.state.ampm,
      onFocus: this.showTimePicker,
      readOnly: true,
      inputRef: this.timeInput
    }), /*#__PURE__*/React$1.createElement("div", {
      ref: this.timePickerContainer
    }, this.state.showTimePicker && /*#__PURE__*/React$1.createElement(TimePicker, {
      onChange: this.handleTimeChange,
      hh: this.state.hh,
      mm: this.state.mm,
      ss: this.state.ss,
      ampm: this.state.ampm
    })))), this.props.help_text && /*#__PURE__*/React$1.createElement("span", {
      className: "rjf-help-text"
    }, this.props.help_text)));
  }

}

function GroupTitle(props) {
  if (!props.children) return null;
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-form-group-title"
  }, props.editable ? /*#__PURE__*/React$1.createElement("span", null, props.children, " ", /*#__PURE__*/React$1.createElement(Button, {
    className: "edit",
    onClick: props.onEdit,
    title: "Edit"
  }, "Edit")) : props.children);
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
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-form-row-controls"
  }, props.onMoveUp && /*#__PURE__*/React$1.createElement(Button, {
    className: "move-up",
    onClick: e => animate(e, 'move-up', props.onMoveUp),
    title: "Move up"
  }, /*#__PURE__*/React$1.createElement("span", null, "\u2191")), props.onMoveDown && /*#__PURE__*/React$1.createElement(Button, {
    className: "move-down",
    onClick: e => animate(e, 'move-down', props.onMoveDown),
    title: "Move down"
  }, /*#__PURE__*/React$1.createElement("span", null, "\u2193")), props.onRemove && /*#__PURE__*/React$1.createElement(Button, {
    className: "remove",
    onClick: e => animate(e, 'remove', props.onRemove),
    title: "Remove"
  }, /*#__PURE__*/React$1.createElement("span", null, "\xD7")));
}
function FormRow(props) {
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-form-row"
  }, /*#__PURE__*/React$1.createElement(FormRowControls, props), /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-form-row-inner"
  }, props.children));
}
function FormGroup(props) {
  let hasChildren = React$1.Children.count(props.children);
  let innerClassName = props.level === 0 && !hasChildren ? "" : "rjf-form-group-inner";
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-form-group"
  }, props.level === 0 && /*#__PURE__*/React$1.createElement(GroupTitle, {
    editable: props.editable,
    onEdit: props.onEdit
  }, props.schema.title), /*#__PURE__*/React$1.createElement("div", {
    className: innerClassName
  }, props.level > 0 && /*#__PURE__*/React$1.createElement(GroupTitle, {
    editable: props.editable,
    onEdit: props.onEdit
  }, props.schema.title), props.children, props.addable && /*#__PURE__*/React$1.createElement(Button, {
    className: "add",
    onClick: e => props.onAdd(),
    title: props.schema.type === 'object' ? 'Add new key' : 'Add new item'
  }, props.schema.type === 'object' ? 'Add key' : 'Add item')));
}

class FileUploader extends React$1.Component {
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
      this.props.onChange(e);
      this.closeModal();
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

    this.state = {
      value: props.value,
      //fileName: this.getFileName(),
      loading: false,
      open: false,
      pane: 'upload'
    };
    this.inputRef = /*#__PURE__*/React$1.createRef();
  }

  render() {
    if (!this.props.handler && !this.context.fileHandler) {
      return /*#__PURE__*/React$1.createElement(FormFileInput, this.props);
    }

    return /*#__PURE__*/React$1.createElement("div", null, this.props.label && /*#__PURE__*/React$1.createElement("label", null, this.props.label), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-file-field"
    }, this.props.value && /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-current-file-name"
    }, "Current file: ", /*#__PURE__*/React$1.createElement("span", null, this.props.value), " ", ' ', /*#__PURE__*/React$1.createElement(Button, {
      className: "remove-file",
      onClick: this.clearFile
    }, "Clear")), /*#__PURE__*/React$1.createElement(Button, {
      onClick: this.openModal,
      className: "upload-modal__open"
    }, this.props.value ? 'Change file' : 'Select file'), this.props.help_text && /*#__PURE__*/React$1.createElement("span", {
      className: "rjf-help-text"
    }, this.props.help_text)), /*#__PURE__*/React$1.createElement(ReactModal, {
      isOpen: this.state.open,
      onRequestClose: this.closeModal,
      contentLabel: "Select file",
      portalClassName: "rjf-modal-portal",
      overlayClassName: "rjf-modal__overlay",
      className: "rjf-modal__dialog",
      bodyOpenClassName: "rjf-modal__main-body--open",
      closeTimeoutMS: 150,
      ariaHideApp: false
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-modal__content"
    }, /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-modal__header"
    }, /*#__PURE__*/React$1.createElement(TabButton, {
      onClick: this.togglePane,
      tabName: "upload",
      active: this.state.pane === "upload"
    }, "Upload new"), ' ', /*#__PURE__*/React$1.createElement(TabButton, {
      onClick: this.togglePane,
      tabName: "library",
      active: this.state.pane === "library"
    }, "Choose from library"), /*#__PURE__*/React$1.createElement(Button, {
      className: "modal__close",
      onClick: this.closeModal,
      title: "Close (Esc)"
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "x-lg"
    }))), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-modal__body"
    }, this.state.pane === 'upload' && /*#__PURE__*/React$1.createElement(UploadPane, _extends({}, this.props, {
      onChange: this.handleFileUpload,
      label: "",
      value: "",
      help_text: ""
    })), this.state.pane === 'library' && /*#__PURE__*/React$1.createElement(LibraryPane, {
      fileHandler: this.props.handler || this.context.fileHandler,
      fileHandlerArgs: {
        field_name: this.context.fieldName,
        model_name: this.context.modelName,
        coordinates: JSON.stringify(this.props.name.split('-').slice(1))
      },
      onFileSelect: this.handleFileSelect
    })), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-modal__footer"
    }, /*#__PURE__*/React$1.createElement(Button, {
      className: "modal__footer-close",
      onClick: this.closeModal
    }, "Cancel")))));
  }

}
FileUploader.contextType = EditorContext;

function TabButton(props) {
  let className = 'rjf-upload-modal__tab-button';
  if (props.active) className += ' rjf-upload-modal__tab-button--active';
  return /*#__PURE__*/React$1.createElement("button", {
    onClick: () => props.onClick(props.tabName),
    className: className
  }, props.children);
}

function UploadPane(props) {
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-upload-modal__pane"
  }, /*#__PURE__*/React$1.createElement("h3", null, "Upload new"), /*#__PURE__*/React$1.createElement("br", null), /*#__PURE__*/React$1.createElement(FormFileInput, props));
}

class LibraryPane extends React$1.Component {
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
    return /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-upload-modal__pane"
    }, /*#__PURE__*/React$1.createElement("h3", null, "Media library"), /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-upload-modal__media-container"
    }, this.state.files.map(i => {
      return /*#__PURE__*/React$1.createElement(MediaTile, _extends({}, i, {
        onClick: this.props.onFileSelect
      }));
    })), this.state.loading && /*#__PURE__*/React$1.createElement(Loader, {
      className: "rjf-upload-modal__media-loader"
    }), !this.state.loading && this.state.hasMore && /*#__PURE__*/React$1.createElement("div", null, /*#__PURE__*/React$1.createElement(Button, {
      onClick: this.onLoadMore,
      className: "upload-modal__media-load"
    }, /*#__PURE__*/React$1.createElement(Icon, {
      name: "arrow-down"
    }), " View more")), !this.state.hasMore && /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-upload-modal__media-end-message"
    }, this.state.files.length ? 'End of list' : 'No files found'));
  }

}

const DEFAULT_THUBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23999999' viewBox='0 0 16 16'%3E%3Cpath d='M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z'/%3E%3C/svg%3E";

function MediaTile(props) {
  let metadata = props.metadata || {};
  return /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-upload-modal__media-tile"
  }, /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-upload-modal__media-tile-inner",
    tabIndex: "0",
    onClick: () => props.onClick(props.value)
  }, /*#__PURE__*/React$1.createElement("img", {
    src: props.thumbnail ? props.thumbnail : DEFAULT_THUBNAIL
  }), props.metadata && /*#__PURE__*/React$1.createElement("div", {
    className: "rjf-upload-modal__media-tile-metadata"
  }, Object.getOwnPropertyNames(metadata).map(key => {
    return /*#__PURE__*/React$1.createElement("span", null, metadata[key]);
  }))));
}

const _excluded = ["data", "schema", "name", "onChange", "onRemove", "removable", "onEdit", "onKeyEdit", "editable", "onMoveUp", "onMoveDown", "parentType"];

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
    readOnly: props.schema.readOnly || props.schema.readonly,
    help_text: props.schema.help_text || props.schema.helpText
  };
  if (props.schema.placeholder) inputProps.placeholder = props.schema.placeholder;
  if (props.schema.handler) inputProps.handler = props.schema.handler;
  let type = props.schema.type;
  let choices = props.schema.choices || props.schema.enum;

  if (choices) {
    inputProps.options = choices;
    type = 'select';
  }

  if (props.schema.widget) {
    if (props.schema.widget === 'multiselect' && props.parentType !== 'array') ; else {
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
        } else if (props.schema.format === 'datetime' || props.schema.format === 'date-time') {
          InputField = FormDateTimeInput;
        }

        inputProps.type = props.schema.format;
      } else {
        inputProps.type = 'text';
      }

      break;

    case 'number':
      inputProps.type = 'number';
      InputField = FormInput;
      break;

    case 'integer':
      inputProps.type = 'number';
      inputProps.step = '1';
      InputField = FormInput;
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

    case 'textarea':
      InputField = FormTextareaInput;
      break;

    default:
      inputProps.type = 'text';
      InputField = FormInput;
  }

  return /*#__PURE__*/React.createElement(InputField, _extends({}, inputProps, {
    label: props.editable ? /*#__PURE__*/React.createElement("span", null, props.schema.title, " ", /*#__PURE__*/React.createElement(Button, {
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
    parentType
  } = args,
      fieldProps = _objectWithoutPropertiesLoose(args, _excluded);

  return /*#__PURE__*/React.createElement(FormRow, {
    key: name,
    onRemove: removable ? e => onRemove(name) : null,
    onMoveUp: onMoveUp,
    onMoveDown: onMoveDown
  }, /*#__PURE__*/React.createElement(FormField, _extends({
    data: data,
    schema: schema,
    name: name,
    onChange: onChange,
    onEdit: onKeyEdit,
    editable: editable,
    parentType: parentType
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
  let removable = true;
  let min_items = schema.min_items || schema.minItems || 0;
  if (data.length <= min_items) removable = false;
  let addable = true;
  let max_items = schema.max_items || schema.maxItems || 100;
  if (data.length >= max_items) addable = false;
  let isRef = schema.items.hasOwnProperty('$ref');
  if (isRef) schema.items = args.getRef(schema.items['$ref']);
  let type = schema.items.type;
  if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
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
    getRef: args.getRef
  };

  if (nextArgs.schema.widget === 'multiselect') {
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
      nextArgs.name = name + '-' + i;
      if (i === 0) nextArgs.onMoveUp = null;else nextArgs.onMoveUp = e => onMove(name + '-' + i, name + '-' + (i - 1));
      if (i === data.length - 1) nextArgs.onMoveDown = null;else nextArgs.onMoveDown = e => onMove(name + '-' + i, name + '-' + (i + 1));

      if (type === 'array') {
        groups.push(getArrayFormRow(nextArgs));
      } else if (type === 'object') {
        groups.push(getObjectFormRow(nextArgs));
      } else {
        rows.push(getStringFormRow(nextArgs));
      }
    }
  }

  let coords = name; // coordinates for insertion and deletion

  if (rows.length || !rows.length && !groups.length) {
    rows = /*#__PURE__*/React.createElement(FormGroup, {
      level: level,
      schema: schema,
      addable: addable,
      onAdd: () => onAdd(getBlankData(schema.items, args.getRef), coords),
      editable: args.editable,
      onEdit: args.onKeyEdit,
      key: 'row_group_' + name
    }, rows);

    if (args.parentType === 'object' && args.removable) {
      rows = /*#__PURE__*/React.createElement("div", {
        className: "rjf-form-group-wrapper",
        key: 'row_group_wrapper_' + name
      }, /*#__PURE__*/React.createElement(FormRowControls, {
        onRemove: e => onRemove(name)
      }), rows);
    }
  }

  if (groups.length) {
    let groupTitle = schema.title ? /*#__PURE__*/React.createElement(GroupTitle, {
      editable: args.editable,
      onEdit: args.onKeyEdit
    }, schema.title) : null;
    groups = /*#__PURE__*/React.createElement("div", {
      key: 'group_' + name,
      className: "rjf-form-group-wrapper"
    }, args.parentType === 'object' && args.removable && /*#__PURE__*/React.createElement(FormRowControls, {
      onRemove: e => onRemove(name)
    }), /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-group"
    }, /*#__PURE__*/React.createElement("div", {
      className: level > 0 ? "rjf-form-group-inner" : ""
    }, groupTitle, groups.map((i, index) => /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-group-wrapper",
      key: 'group_wrapper_' + name + '_' + index
    }, /*#__PURE__*/React.createElement(FormRowControls, {
      onRemove: removable ? e => onRemove(name + '-' + index) : null,
      onMoveUp: index > 0 ? e => onMove(name + '-' + index, name + '-' + (index - 1)) : null,
      onMoveDown: index < groups.length - 1 ? e => onMove(name + '-' + index, name + '-' + (index + 1)) : null
    }), i)), addable && /*#__PURE__*/React.createElement(Button, {
      className: "add",
      onClick: e => onAdd(getBlankData(schema.items, args.getRef), coords),
      title: "Add new item"
    }, "Add item"))));
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
  let schema_keys = schema.keys || schema.properties;
  let keys = [...Object.keys(schema_keys)];
  if (schema.additionalProperties) keys = [...keys, ...Object.keys(data).filter(k => keys.indexOf(k) === -1)];

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let value = data[key];
    let childName = name + '-' + key;
    let schemaValue = schema_keys.hasOwnProperty(key) ? _extends({}, schema_keys[key]) : undefined;

    if (typeof schemaValue === 'undefined') {
      // for keys added through additionalProperties
      if (typeof schema.additionalProperties === 'boolean') schemaValue = {
        type: 'string'
      };else schemaValue = _extends({}, schema.additionalProperties);
    }

    let isRef = schemaValue.hasOwnProperty('$ref');
    if (isRef) schemaValue = args.getRef(schemaValue['$ref']);
    let type = schemaValue.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    if (!schemaValue.title || isRef && schema.additionalProperties) // for additionalProperty refs, use the key as the title
      schemaValue.title = getVerboseName(key);
    let removable = false;
    if (schema_keys[key] === undefined) removable = true;
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
      getRef: args.getRef
    };

    nextArgs.onKeyEdit = () => handleKeyEdit(data, key, value, childName, onEdit);

    nextArgs.editable = removable;

    if (type === 'array') {
      rows.push(getArrayFormRow(nextArgs));
    } else if (type === 'object') {
      rows.push(getObjectFormRow(nextArgs));
    } else {
      rows.push(getStringFormRow(nextArgs));
    }
  }

  if (rows.length || schema.additionalProperties) {
    let coords = name;
    rows = /*#__PURE__*/React.createElement(FormGroup, {
      level: level,
      schema: schema,
      addable: schema.additionalProperties,
      onAdd: () => handleKeyValueAdd(data, coords, onAdd, schema.additionalProperties, args.getRef),
      editable: args.editable,
      onEdit: args.onKeyEdit,
      key: 'row_group_' + name
    }, rows);

    if (args.parentType === 'object' && args.removable) {
      rows = /*#__PURE__*/React.createElement("div", {
        className: "rjf-form-group-wrapper",
        key: 'row_group_wrapper_' + name
      }, /*#__PURE__*/React.createElement(FormRowControls, {
        onRemove: e => onRemove(name)
      }), rows);
    }
  }

  return rows;
}

function handleKeyValueAdd(data, coords, onAdd, newSchema, getRef) {
  let key = prompt("Add new key");
  if (key === null) // clicked cancel
    return;
  if (newSchema === true) newSchema = {
    type: 'string'
  };
  key = key.trim();
  if (!key) alert("(!) Can't add empty key.\r\n\r\n‎");else if (data.hasOwnProperty(key)) alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");else onAdd(getBlankData(newSchema, getRef), coords + '-' + key);
}

function handleKeyEdit(data, key, value, coords, onEdit) {
  let newKey = prompt("Rename key", key);
  if (newKey === null) // clicked cancel
    return;
  newKey = newKey.trim();
  if (newKey === key) // same keys
    return;
  if (!newKey) return alert("(!) Key name can't be empty.\r\n\r\n‎");else if (data.hasOwnProperty(newKey)) return alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");
  let newCoords = coords.split('-');
  newCoords.pop();
  newCoords.push(newKey);
  newCoords = newCoords.join('-');
  onEdit(value, newCoords, coords);
}

function validateSchema(schema) {
  if (!(schema instanceof Object)) return {
    isValid: false,
    msg: "Schema must be an object"
  };
  let type = normalize_keyword(schema.type);
  let validation = {
    isValid: true,
    msg: ""
  };
  if (type === 'object') validation = validateObject(schema);else if (type === 'array') validation = validateArray(schema);else validation = {
    isValid: false,
    msg: "Outermost schema can only be of type array, list, object or dict"
  };
  if (!validation.isValid || !schema.hasOwnProperty('$defs')) return validation; // validate $defs
  // :TODO: validate $defs nested inside objects/arrays

  if (!schema['$defs'] instanceof Object) return {
    isValid: false,
    msg: "'$defs' must be a valid JavaScript Object"
  };
  return validation;
}
function validateObject(schema) {
  if (!schema.hasOwnProperty('keys') && !schema.hasOwnProperty('properties')) return {
    isValid: false,
    msg: "Schema of type '" + schema.type + "' must have a key called 'properties' or 'keys'"
  };
  let keys = schema.properties || schema.keys;
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
    let value_type = normalize_keyword(value.type);

    if (value_type) {
      if (value_type === 'object') validation = validateObject(value);else if (value_type === 'array') validation = validateArray(value);
    } else if (value.hasOwnProperty('$ref')) {
      validation = validateRef(value);
    } else {
      validation = {
        isValid: false,
        msg: "Key '" + key + "' must have a 'type' or a '$ref"
      };
    }

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
        let type = normalize_keyword(schema.additionalProperties.type);
        if (type === 'object') return validateObject(schema.additionalProperties);else if (type === 'array') return validateSchema(schema.additionalProperties);
        /* :TODO: else validate allowed types */
      }
    }
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
  let items_type = normalize_keyword(schema.items.type);

  if (items_type) {
    if (items_type === 'object') return validateObject(schema.items);else if (items_type === 'array') return validateArray(schema.items);
    /* :TODO: else validate allowed types */
  } else if (schema.items.hasOwnProperty('$ref')) {
    return validateRef(schema.items);
  } else {
    return {
      isValid: false,
      msg: "'items' key must have a 'type' or a '$ref'"
    };
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

function normalize_keyword(kw) {
  /* Converts custom supported keywords to standard JSON schema keywords */
  switch (kw) {
    case 'list':
      return 'array';

    case 'dict':
      return 'object';

    case 'keys':
      return 'properties';

    case 'choices':
      return 'enum';

    default:
      return kw;
  }
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

    if (!data) {
      // create empty data from schema
      data = getBlankData(schema, ref => EditorState.getRef(ref, schema));
    } else {
      // data might be stale if schema has new keys, so add them to data
      try {
        data = getSyncedData(data, schema, ref => EditorState.getRef(ref, schema));
      } catch (error) {
        console.error("Error while creating EditorState: Schema and data structure don't match");
        console.error(error);
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

class ReactJSONForm extends React$1.Component {
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
      coords = coords.split('-');
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

      try {
        let type = schema.type;
        if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
        let args = {
          data: data,
          schema: schema,
          name: 'rjf',
          onChange: this.handleChange,
          onAdd: this.addFieldset,
          onRemove: this.removeFieldset,
          onEdit: this.editFieldset,
          onMove: this.moveFieldset,
          level: 0,
          getRef: this.getRef
        };

        if (type === 'array') {
          return getArrayFormRow(args);
        } else if (type === 'object') {
          return getObjectFormRow(args);
        }
      } catch (error) {
        console.log(error);
        formGroups = /*#__PURE__*/React$1.createElement("p", {
          style: {
            color: '#f00'
          }
        }, /*#__PURE__*/React$1.createElement("strong", null, "(!) Error:"), " Schema and data structure do not match.");
      }

      return formGroups;
    };

    this.addFieldset = (blankData, coords) => {
      coords = coords.split('-');
      coords.shift(); // :TODO: use immutable JS instead of JSON-ising the data

      let data = addDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())), blankData);
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.removeFieldset = coords => {
      coords = coords.split('-');
      coords.shift(); // :TODO: use immutable JS instead of JSON-ising the data

      let data = removeDataUsingCoords(coords, JSON.parse(JSON.stringify(this.props.editorState.getData())));
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.editFieldset = (value, newCoords, oldCoords) => {
      /* Add and remove in a single state update
           newCoords will be added
          oldCoords willbe removed
      */
      newCoords = newCoords.split('-');
      newCoords.shift();
      oldCoords = oldCoords.split('-');
      oldCoords.shift();
      let data = addDataUsingCoords(newCoords, JSON.parse(JSON.stringify(this.props.editorState.getData())), value);
      data = removeDataUsingCoords(oldCoords, data);
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };

    this.moveFieldset = (oldCoords, newCoords) => {
      oldCoords = oldCoords.split("-");
      oldCoords.shift();
      newCoords = newCoords.split("-");
      newCoords.shift(); // :TODO: use immutable JS instead of JSON-ising the data

      let data = moveDataUsingCoords(oldCoords, newCoords, JSON.parse(JSON.stringify(this.props.editorState.getData())));
      this.props.onChange(EditorState.update(this.props.editorState, data));
    };
  }

  render() {
    return /*#__PURE__*/React$1.createElement("div", {
      className: "rjf-form-wrapper"
    }, /*#__PURE__*/React$1.createElement("fieldset", {
      className: "module aligned"
    }, /*#__PURE__*/React$1.createElement(EditorContext.Provider, {
      value: {
        fileHandler: this.props.fileHandler,
        fieldName: this.props.fieldName,
        modelName: this.props.modelName
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

function FormInstance(config) {
  this.containerId = config.containerId;
  this.dataInputId = config.dataInputId;
  this.schema = config.schema;
  this.data = config.data;
  this.fileHandler = config.fileHandler;
  this.fieldName = config.fieldName;
  this.modelName = config.modelName;
  this.eventListeners = null;

  this.addEventListener = function (event, listener) {
    if (this.eventListeners === null) this.eventListeners = {};
    if (!this.eventListeners.hasOwnProperty(event)) this.eventListeners[event] = new Set();
    this.eventListeners[event].add(listener);
  };

  this.onChange = function (e) {
    if (!this.eventListeners) return;
    if (!this.eventListeners.hasOwnProperty('change') || !this.eventListeners.change.size) return;
    this.eventListeners.change.forEach(cb => cb(e));
  };

  this.onChange = this.onChange.bind(this);

  this.render = function () {
    try {
      ReactDOM.render( /*#__PURE__*/React$1.createElement(FormContainer, {
        schema: this.schema,
        dataInputId: this.dataInputId,
        data: this.data,
        fileHandler: this.fileHandler,
        fieldName: this.fieldName,
        modelName: this.modelName,
        onChange: this.onChange
      }), document.getElementById(this.containerId));
    } catch (error) {
      ReactDOM.render( /*#__PURE__*/React$1.createElement(ErrorReporter, {
        error: error
      }), document.getElementById(this.containerId));
    }
  };

  this.update = function (config) {
    this.schema = config.schema || this.schema;
    this.data = config.data || this.data;
    this.render();
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
class FormContainer extends React$1.Component {
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
    return /*#__PURE__*/React$1.createElement(ReactJSONForm, {
      editorState: this.state.editorState,
      onChange: this.handleChange,
      fileHandler: this.props.fileHandler,
      fieldName: this.props.fieldName,
      modelName: this.props.modelName
    });
  }

}

function ErrorReporter(props) {
  /* Component for displaying errors to the user related for schema */
  return /*#__PURE__*/React$1.createElement("div", {
    style: {
      color: '#f00'
    }
  }, /*#__PURE__*/React$1.createElement("p", null, "(!) ", props.error.toString()), /*#__PURE__*/React$1.createElement("p", null, "Check browser console for more details about the error."));
}

export { EditorState, ReactJSONForm, createForm, getFormInstance };
