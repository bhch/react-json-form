(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.reactJsonForm = factory());
}(this, (function () {
  function _extends() {
    _extends = Object.assign || function (target) {
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

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
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
    var keys = {};
    var schema_keys = schema.keys || schema.properties;

    for (var key in schema_keys) {
      var value = schema_keys[key];
      var isRef = value.hasOwnProperty('$ref');
      if (isRef) value = getRef(value['$ref']);
      var type = value.type;
      if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
      if (type === 'array') keys[key] = isRef ? [] : getBlankArray(value, getRef);else if (type === 'object') keys[key] = getBlankObject(value, getRef);else if (type === 'boolean') keys[key] = value["default"] || false;else if (type === 'integer' || type === 'number') keys[key] = value["default"] || null;else // string etc.
        keys[key] = value["default"] || '';
    }

    return keys;
  }
  function getBlankArray(schema, getRef) {
    if (schema["default"]) return schema["default"];
    var items = [];
    var minItems = schema.minItems || schema.min_items || 0;
    if (minItems === 0) return items;

    if (schema.items.hasOwnProperty('$ref')) {
      // :TODO: this will most probably mutate the original schema
      // but i'll fix it later
      schema.items = getRef(schema.items['$ref']);
    }

    var type = schema.items.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

    if (type === 'array') {
      items.push(getBlankArray(schema.items, getRef));
      return items;
    } else if (type === 'object') {
      items.push(getBlankObject(schema.items, getRef));
      return items;
    }

    if (schema.items.widget === 'multiselect') return items;
    if (type === 'boolean') items.push(schema.items["default"] || false);else if (type === 'integer' || type === 'number') items.push(schema.items["default"] || null);else // string, etc.
      items.push(schema.items["default"] || '');
    return items;
  }
  function getBlankData(schema, getRef) {
    if (schema.hasOwnProperty('$ref')) schema = getRef(schema['$ref']);
    var type = schema.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    if (type === 'array') return getBlankArray(schema, getRef);else if (type === 'object') return getBlankObject(schema, getRef);else if (type === 'boolean') return schema["default"] || false;else if (type === 'integer' || type === 'number') return schema["default"] || null;else // string, etc.
      return schema["default"] || '';
  }

  function getSyncedArray(data, schema, getRef) {
    var newData = JSON.parse(JSON.stringify(data));

    if (schema.items.hasOwnProperty('$ref')) {
      // :TODO: this will most probably mutate the original schema
      // but i'll fix it later
      schema.items = getRef(schema.items['$ref']);
    }

    var type = schema.items.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

    for (var i = 0; i < data.length; i++) {
      var item = data[i];

      if (type === 'array') {
        newData[i] = getSyncedArray(item, schema.items, getRef);
      } else if (type === 'object') {
        newData[i] = getSyncedObject(item, schema.items, getRef);
      } else {
        if ((type === 'integer' || type === 'number') && item === '') newData[i] = null;
      }
    }

    return newData;
  }

  function getSyncedObject(data, schema, getRef) {
    var newData = JSON.parse(JSON.stringify(data));
    var schema_keys = schema.keys || schema.properties;
    var keys = [].concat(Object.keys(schema_keys));

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var schemaValue = schema_keys[key];
      var isRef = schemaValue.hasOwnProperty('$ref');
      if (isRef) schemaValue = getRef(schemaValue['$ref']);
      var type = schemaValue.type;
      if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

      if (!data.hasOwnProperty(key)) {
        if (type === 'array') newData[key] = getSyncedArray([], schemaValue, getRef);else if (type === 'object') newData[key] = getSyncedObject({}, schemaValue, getRef);else if (type === 'boolean') newData[key] = false;else if (type === 'integer' || type === 'number') newData[key] = null;else newData[key] = '';
      } else {
        if (type === 'array') newData[key] = getSyncedArray(data[key], schemaValue, getRef);else if (type === 'object') newData[key] = getSyncedObject(data[key], schemaValue, getRef);else {
          if ((type === 'integer' || type === 'number') && data[key] === '') newData[key] = null;else newData[key] = data[key];
        }
      }
    }

    return newData;
  }

  function getSyncedData(data, schema, getRef) {
    // adds those keys to data which are in schema but not in data
    if (schema.hasOwnProperty('$ref')) schema = getRef(schema['$ref']);
    var type = schema.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

    if (type === 'array') {
      return getSyncedArray(data, schema, getRef);
    } else if (type === 'object') {
      return getSyncedObject(data, schema, getRef);
    }

    return data;
  }

  var _excluded$2 = ["className"];
  function Button(_ref) {
    var className = _ref.className,
        props = _objectWithoutPropertiesLoose(_ref, _excluded$2);

    if (!className) className = '';
    var classes = className.split(' ');
    className = '';

    for (var i = 0; i < classes.length; i++) {
      className = className + 'rjf-' + classes[i] + '-button ';
    }

    return /*#__PURE__*/React.createElement("button", _extends({
      className: className.trim(),
      type: "button"
    }, props), props.children);
  }

  function Loader(props) {
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-loader"
    });
  }

  function Icon(props) {
    var icon;

    switch (props.name) {
      case 'chevron-up':
        icon = /*#__PURE__*/React.createElement(ChevronUp, null);
        break;

      case 'chevron-down':
        icon = /*#__PURE__*/React.createElement(ChevronDown, null);
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

  var TimePicker = /*#__PURE__*/function (_React$Component) {
    _inheritsLoose(TimePicker, _React$Component);

    function TimePicker() {
      var _this;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;

      _this.sendValue = function (data) {
        _this.props.onChange(data);
      };

      _this.validateValue = function (name, value) {
        if (name === 'hh' && value < 1) return 1;else if (name !== 'hh' && value < 0) return 0;else if (name === 'hh' && value > 12) return 12;else if (name !== 'hh' && value > 59) return 59;
        return value;
      };

      _this.handleChange = function (e) {
        var _this$sendValue;

        var name = e.target.dataset.name;
        var value = e.target.value;
        if (isNaN(value)) return;

        var validValue = _this.validateValue(name, parseInt(value) || 0);

        if (name === 'hh' && (value === '0' || value === '' || value === '00') && validValue === 1) validValue = 0;

        if (value.startsWith('0') && validValue < 10 && validValue !== 0) {
          validValue = validValue.toString().padStart(2, '0');
        }

        _this.sendValue((_this$sendValue = {}, _this$sendValue[name] = value !== '' ? validValue.toString() : '', _this$sendValue));
      };

      _this.handleKeyDown = function (e) {
        var _this$sendValue2;

        if (e.keyCode !== 38 && e.keyCode !== 40) return;
        var name = e.target.dataset.name;
        var value = parseInt(e.target.value) || 0;

        if (e.keyCode === 38) {
          value++;
        } else if (e.keyCode === 40) {
          value--;
        }

        _this.sendValue((_this$sendValue2 = {}, _this$sendValue2[name] = _this.validateValue(name, value).toString().padStart(2, '0'), _this$sendValue2));
      };

      _this.handleSpin = function (name, type) {
        var _this$sendValue3;

        var value = _this.props[name];

        if (name === 'ampm') {
          value = value === 'am' ? 'pm' : 'am';
        } else {
          value = parseInt(value) || 0;

          if (type === 'up') {
            value++;
          } else {
            value--;
          }

          value = _this.validateValue(name, value).toString().padStart(2, '0');
        }

        _this.sendValue((_this$sendValue3 = {}, _this$sendValue3[name] = value, _this$sendValue3));
      };

      _this.handleBlur = function (e) {
        var value = _this.validateValue(e.target.dataset.name, parseInt(e.target.value) || 0);

        if (value < 10) {
          var _this$sendValue4;

          _this.sendValue((_this$sendValue4 = {}, _this$sendValue4[e.target.dataset.name] = value.toString().padStart(2, '0'), _this$sendValue4));
        }
      };

      return _this;
    }

    var _proto = TimePicker.prototype;

    _proto.componentWillUnmount = function componentWillUnmount() {
      var data = {
        hh: this.validateValue('hh', this.props.hh).toString().padStart(2, '0'),
        mm: this.validateValue('mm', this.props.mm).toString().padStart(2, '0'),
        ss: this.validateValue('ss', this.props.ss).toString().padStart(2, '0')
      };
      this.sendValue(data);
    };

    _proto.render = function render() {
      var _this2 = this;

      return /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-row rjf-time-picker-labels"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, "Hrs"), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, "Min"), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, "Sec"), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, "am/pm")), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-row"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('hh', 'up');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-up"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('mm', 'up');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-up"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('ss', 'up');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-up"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('ampm', 'up');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-up"
      })))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-row rjf-time-picker-values"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        "data-name": "hh",
        value: this.props.hh,
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        onKeyDown: this.handleKeyDown
      })), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }, ":"), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        "data-name": "mm",
        value: this.props.mm,
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        onKeyDown: this.handleKeyDown
      })), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }, ":"), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        "data-name": "ss",
        value: this.props.ss,
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        onKeyDown: this.handleKeyDown
      })), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, this.props.ampm)), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-row"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('hh', 'down');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-down"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('mm', 'down');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-down"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('ss', 'down');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-down"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, /*#__PURE__*/React.createElement(Button, {
        onClick: function onClick() {
          return _this2.handleSpin('ampm', 'down');
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "chevron-down"
      })))));
    };

    return TimePicker;
  }(React.Component);

  var EditorContext = React.createContext();
  function capitalize(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.substr(1).toLowerCase();
  }
  function getVerboseName(name) {
    if (name === undefined || name === null) return '';
    name = name.replace(/_/g, ' ');
    return capitalize(name);
  }
  function getCsrfCookie() {
    var csrfCookies = document.cookie.split(';').filter(function (item) {
      return item.trim().indexOf('csrftoken=') === 0;
    });

    if (csrfCookies.length) {
      return csrfCookies[0].split('=')[1];
    } else {
      // if no cookie found, get the value from the csrf form input
      var input = document.querySelector('input[name="csrfmiddlewaretoken"]');
      if (input) return input.value;
    }

    return null;
  }

  var _excluded$1 = ["label", "help_text", "error", "inputRef"],
      _excluded2 = ["label", "help_text", "error", "value"],
      _excluded3 = ["label", "help_text", "error", "value", "options"],
      _excluded4 = ["label", "help_text", "error", "value", "options"],
      _excluded5 = ["label", "value"],
      _excluded6 = ["label", "help_text", "error", "inputRef"];
  function FormInput(_ref) {
    var label = _ref.label,
        help_text = _ref.help_text,
        inputRef = _ref.inputRef,
        props = _objectWithoutPropertiesLoose(_ref, _excluded$1);

    if (props.type === 'string') props.type = 'text';
    if (inputRef) props.ref = inputRef;
    if (props.value === null) props.value = '';
    return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("div", {
      className: "rjf-input-group"
    }, /*#__PURE__*/React.createElement("input", props), help_text && /*#__PURE__*/React.createElement("span", {
      className: "rjf-help-text"
    }, help_text)));
  }
  function FormCheckInput(_ref2) {
    var label = _ref2.label,
        help_text = _ref2.help_text,
        value = _ref2.value,
        props = _objectWithoutPropertiesLoose(_ref2, _excluded2);

    if (!label) label = props.name.toUpperCase();
    if (props.type === 'bool') props.type = 'checkbox';
    if (props.checked === undefined) props.checked = value;
    if (props.checked === '' || props.checked === null || props.checked === undefined) props.checked = false;
    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-check-input"
    }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", props), " ", label), help_text && /*#__PURE__*/React.createElement("span", {
      className: "rjf-help-text"
    }, help_text));
  }
  function FormRadioInput(_ref3) {
    var label = _ref3.label,
        help_text = _ref3.help_text,
        value = _ref3.value,
        options = _ref3.options,
        props = _objectWithoutPropertiesLoose(_ref3, _excluded3);

    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-check-input"
    }, /*#__PURE__*/React.createElement("label", null, label), options.map(function (option, i) {
      var label, inputValue;

      if (typeof option === 'object') {
        label = option.label;
        inputValue = option.value;
      } else {
        label = option;
        if (typeof label === 'boolean') label = capitalize(label.toString());
        inputValue = option;
      }

      return /*#__PURE__*/React.createElement("label", {
        key: label + '_' + inputValue + '_' + i
      }, /*#__PURE__*/React.createElement("input", _extends({}, props, {
        value: inputValue,
        checked: inputValue === value
      })), " ", label);
    }), help_text && /*#__PURE__*/React.createElement("span", {
      className: "rjf-help-text"
    }, help_text));
  }
  function FormSelectInput(_ref4) {
    var label = _ref4.label,
        help_text = _ref4.help_text,
        value = _ref4.value,
        options = _ref4.options,
        props = _objectWithoutPropertiesLoose(_ref4, _excluded4);

    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("div", {
      className: "rjf-input-group"
    }, /*#__PURE__*/React.createElement("select", _extends({
      value: value || ''
    }, props), /*#__PURE__*/React.createElement("option", {
      disabled: true,
      value: "",
      key: '__placehlder'
    }, "Select..."), options.map(function (option, i) {
      var label, inputValue;

      if (typeof option === 'object') {
        label = option.label;
        inputValue = option.value;
      } else {
        label = option;
        if (typeof label === 'boolean') label = capitalize(label.toString());
        inputValue = option;
      }

      return /*#__PURE__*/React.createElement("option", {
        value: inputValue,
        key: label + '_' + inputValue + '_' + i
      }, label);
    })), help_text && /*#__PURE__*/React.createElement("span", {
      className: "rjf-help-text"
    }, help_text)));
  }
  var FormMultiSelectInput = /*#__PURE__*/function (_React$Component) {
    _inheritsLoose(FormMultiSelectInput, _React$Component);

    function FormMultiSelectInput(props) {
      var _this;

      _this = _React$Component.call(this, props) || this;

      _this.handleChange = function (e) {
        var value = [].concat(_this.props.value);

        if (e.target.checked) {
          value.push(e.target.value);
        } else {
          value = value.filter(function (item) {
            return item !== e.target.value;
          });
        }

        var event = {
          target: {
            type: _this.props.type,
            value: value,
            name: _this.props.name
          }
        };

        _this.props.onChange(event);
      };

      _this.showOptions = function (e) {
        if (!_this.state.showOptions) _this.setState({
          showOptions: true
        });
      };

      _this.hideOptions = function (e) {
        _this.setState({
          showOptions: false
        });
      };

      _this.toggleOptions = function (e) {
        _this.setState(function (state) {
          return {
            showOptions: !state.showOptions
          };
        });
      };

      _this.state = {
        showOptions: false
      };
      _this.optionsContainer = React.createRef();
      _this.input = React.createRef();
      return _this;
    }

    var _proto = FormMultiSelectInput.prototype;

    _proto.render = function render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "rjf-multiselect-field"
      }, /*#__PURE__*/React.createElement(FormInput, {
        label: this.props.label,
        type: "text",
        value: this.props.value.length ? this.props.value.length + ' selected' : 'Select...',
        help_text: this.props.help_text,
        error: this.props.error,
        onClick: this.toggleOptions,
        readOnly: true,
        inputRef: this.input,
        className: "rjf-multiselect-field-input"
      }), this.state.showOptions && /*#__PURE__*/React.createElement(FormMultiSelectInputOptions, {
        options: this.props.options,
        value: this.props.value,
        hideOptions: this.hideOptions,
        onChange: this.handleChange,
        containerRef: this.optionsContainer,
        inputRef: this.input,
        disabled: this.props.readOnly,
        hasHelpText: this.props.help_text && 1
      }));
    };

    return FormMultiSelectInput;
  }(React.Component);

  var FormMultiSelectInputOptions = /*#__PURE__*/function (_React$Component2) {
    _inheritsLoose(FormMultiSelectInputOptions, _React$Component2);

    function FormMultiSelectInputOptions() {
      var _this2;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      _this2 = _React$Component2.call.apply(_React$Component2, [this].concat(args)) || this;

      _this2.handleClickOutside = function (e) {
        if (_this2.props.containerRef.current && !_this2.props.containerRef.current.contains(e.target) && !_this2.props.inputRef.current.contains(e.target)) _this2.props.hideOptions();
      };

      return _this2;
    }

    var _proto2 = FormMultiSelectInputOptions.prototype;

    _proto2.componentDidMount = function componentDidMount() {
      document.addEventListener('mousedown', this.handleClickOutside);
    };

    _proto2.componentWillUnmount = function componentWillUnmount() {
      document.removeEventListener('mousedown', this.handleClickOutside);
    };

    _proto2.render = function render() {
      var _this3 = this;

      return /*#__PURE__*/React.createElement("div", {
        ref: this.props.containerRef
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-multiselect-field-options-container",
        style: this.props.hasHelpText ? {
          marginTop: '-15px'
        } : {}
      }, this.props.options.map(function (option, i) {
        var label, inputValue;

        if (typeof option === 'object') {
          label = option.label;
          inputValue = option.value;
        } else {
          label = option;
          if (typeof label === 'boolean') label = capitalize(label.toString());
          inputValue = option;
        }

        var selected = _this3.props.value.indexOf(inputValue) > -1;
        var optionClassName = 'rjf-multiselect-field-option';
        if (selected) optionClassName += ' selected';
        if (_this3.props.disabled) optionClassName += ' disabled';
        return /*#__PURE__*/React.createElement("div", {
          key: label + '_' + inputValue + '_' + i,
          className: optionClassName
        }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          onChange: _this3.props.onChange,
          value: inputValue,
          checked: selected,
          disabled: _this3.props.disabled
        }), " ", label));
      })));
    };

    return FormMultiSelectInputOptions;
  }(React.Component);

  function dataURItoBlob(dataURI) {
    // Split metadata from data
    var splitted = dataURI.split(","); // Split params

    var params = splitted[0].split(";"); // Get mime-type from params

    var type = params[0].replace("data:", ""); // Filter the name property from params

    var properties = params.filter(function (param) {
      return param.split("=")[0] === "name";
    }); // Look for the name and use unknown if no name property.

    var name;

    if (properties.length !== 1) {
      name = "unknown";
    } else {
      // Because we filtered out the other property,
      // we only have the name case here.
      name = properties[0].split("=")[1];
    } // Built the Uint8Array Blob parameter from the base64 string.


    var binary = atob(splitted[1]);
    var array = [];

    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    } // Create the blob object


    var blob = new window.Blob([new Uint8Array(array)], {
      type: type
    });
    return {
      blob: blob,
      name: name
    };
  }
  var FormFileInput = /*#__PURE__*/function (_React$Component3) {
    _inheritsLoose(FormFileInput, _React$Component3);

    function FormFileInput(props) {
      var _this4;

      _this4 = _React$Component3.call(this, props) || this;

      _this4.getFileName = function () {
        if (!_this4.props.value) return '';

        if (_this4.props.type === 'data-url') {
          return _this4.extractFileInfo(_this4.props.value).name;
        } else if (_this4.props.type === 'file-url') {
          return _this4.props.value;
        } else {
          return 'Unknown file';
        }
      };

      _this4.extractFileInfo = function (dataURL) {
        var _dataURItoBlob = dataURItoBlob(dataURL),
            blob = _dataURItoBlob.blob,
            name = _dataURItoBlob.name;

        return {
          name: name,
          size: blob.size,
          type: blob.type
        };
      };

      _this4.addNameToDataURL = function (dataURL, name) {
        return dataURL.replace(';base64', ';name=' + encodeURIComponent(name) + ';base64');
      };

      _this4.handleChange = function (e) {
        if (_this4.props.type === 'data-url') {
          var file = e.target.files[0];
          var fileName = file.name;
          var reader = new FileReader();

          reader.onload = function () {
            // this.setState({src: reader.result});
            // we create a fake event object
            var event = {
              target: {
                type: 'text',
                value: _this4.addNameToDataURL(reader.result, fileName),
                name: _this4.props.name
              }
            };

            _this4.props.onChange(event);
          };

          reader.readAsDataURL(file);
        } else if (_this4.props.type === 'file-url') {
          var endpoint = _this4.context.fileUploadEndpoint;

          if (!endpoint) {
            console.error("Error: fileUploadEndpoint option need to be passed " + "while initializing editor for enabling file uploads.");
            alert("Files can't be uploaded.");
            return;
          }

          _this4.setState({
            loading: true
          });

          var formData = new FormData();
          formData.append('field_name', _this4.context.fieldName);
          formData.append('model_name', _this4.context.modelName);
          formData.append('coordinates', JSON.stringify(_this4.props.name.split('-').slice(1)));
          formData.append('file', e.target.files[0]);
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'X-CSRFToken': getCsrfCookie()
            },
            body: formData
          }).then(function (response) {
            return response.json();
          }).then(function (result) {
            // we create a fake event object
            var event = {
              target: {
                type: 'text',
                value: result.file_path,
                name: _this4.props.name
              }
            };

            _this4.props.onChange(event);

            _this4.setState({
              loading: false
            });
          })["catch"](function (error) {
            alert('Something went wrong while uploading file');
            console.error('Error:', error);

            _this4.setState({
              loading: false
            });
          });
        }
      };

      _this4.showFileBrowser = function () {
        _this4.inputRef.current.click();
      };

      _this4.clearFile = function () {
        if (window.confirm('Do you want to remove this file?')) {
          var event = {
            target: {
              type: 'text',
              value: '',
              name: _this4.props.name
            }
          };

          _this4.props.onChange(event);

          if (_this4.inputRef.current) _this4.inputRef.current.value = '';
        }
      };

      _this4.state = {
        value: props.value,
        fileName: _this4.getFileName(),
        loading: false
      };
      _this4.inputRef = React.createRef();
      return _this4;
    }

    var _proto3 = FormFileInput.prototype;

    _proto3.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      if (this.props.value !== prevProps.value) {
        this.setState({
          value: this.props.value,
          fileName: this.getFileName()
        });
      }
    };

    _proto3.render = function render() {
      var _value$this$props = _extends({
        value: value
      }, this.props),
          label = _value$this$props.label,
          value = _value$this$props.value,
          props = _objectWithoutPropertiesLoose(_value$this$props, _excluded5);

      props.type = 'file';
      props.onChange = this.handleChange;
      if (props.readOnly) props.disabled = true;
      return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("div", {
        className: "rjf-file-field"
      }, this.state.value && /*#__PURE__*/React.createElement("div", {
        className: "rjf-current-file-name"
      }, "Current file: ", /*#__PURE__*/React.createElement("span", null, this.state.fileName), " ", ' ', /*#__PURE__*/React.createElement(Button, {
        className: "remove-file",
        onClick: this.clearFile
      }, "Clear")), this.state.value && !this.state.loading && 'Change:', this.state.loading ? /*#__PURE__*/React.createElement("div", {
        className: "rjf-file-field-loading"
      }, /*#__PURE__*/React.createElement(Loader, null), " Uploading...") : /*#__PURE__*/React.createElement("div", {
        className: "rjf-file-field-input"
      }, /*#__PURE__*/React.createElement(FormInput, _extends({}, props, {
        inputRef: this.inputRef
      })))));
    };

    return FormFileInput;
  }(React.Component);
  FormFileInput.contextType = EditorContext;
  var FormTextareaInput = /*#__PURE__*/function (_React$Component4) {
    _inheritsLoose(FormTextareaInput, _React$Component4);

    function FormTextareaInput(props) {
      var _this5;

      _this5 = _React$Component4.call(this, props) || this;

      _this5.handleChange = function (e) {
        _this5.updateHeight(e.target);

        if (_this5.props.onChange) _this5.props.onChange(e);
      };

      _this5.updateHeight = function (el) {
        var offset = el.offsetHeight - el.clientHeight;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + offset + 'px';
      };

      if (!props.inputRef) _this5.inputRef = React.createRef();
      return _this5;
    }

    var _proto4 = FormTextareaInput.prototype;

    _proto4.componentDidMount = function componentDidMount() {
      if (this.props.inputRef) this.updateHeight(this.props.inputRef.current);else this.updateHeight(this.inputRef.current);
    };

    _proto4.render = function render() {
      var _this$props = this.props,
          label = _this$props.label,
          help_text = _this$props.help_text,
          inputRef = _this$props.inputRef,
          props = _objectWithoutPropertiesLoose(_this$props, _excluded6);

      delete props.type;
      props.ref = inputRef || this.inputRef;
      props.onChange = this.handleChange;
      return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("div", {
        className: "rjf-input-group"
      }, /*#__PURE__*/React.createElement("textarea", props), help_text && /*#__PURE__*/React.createElement("span", {
        className: "rjf-help-text"
      }, help_text)));
    };

    return FormTextareaInput;
  }(React.Component);
  var FormDateTimeInput = /*#__PURE__*/function (_React$Component5) {
    _inheritsLoose(FormDateTimeInput, _React$Component5);

    function FormDateTimeInput(props) {
      var _this6;

      _this6 = _React$Component5.call(this, props) || this; // we maintain this input's state in itself
      // so that we can only pass valid values
      // otherwise keep the value empty if invalid

      _this6.getStateFromProps = function () {
        var date = '';
        var hh = '12';
        var mm = '00';
        var ss = '00';
        var ms = '000';
        var ampm = 'am';

        if (_this6.props.value) {
          var d = new Date(_this6.props.value);
          var year = d.getFullYear().toString().padStart(2, '0');
          var month = (d.getMonth() + 1).toString().padStart(2, '0');
          var day = d.getDate().toString().padStart(2, '0');
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

      _this6.handleClickOutside = function (e) {
        if (_this6.state.showTimePicker) {
          if (_this6.timePickerContainer.current && !_this6.timePickerContainer.current.contains(e.target) && !_this6.timeInput.current.contains(e.target)) _this6.setState({
            showTimePicker: false
          });
        }
      };

      _this6.sendValue = function () {
        // we create a fake event object
        // to send a combined value from two inputs
        var event = {
          target: {
            type: 'text',
            value: '',
            name: _this6.props.name
          }
        };
        if (_this6.state.date === '' || _this6.state.date === null) return _this6.props.onChange(event);
        var hh = parseInt(_this6.state.hh);
        if (hh === 0) hh = NaN; // zero value is invalid for 12 hour clock, but will be valid for 24 hour clock
        // so we set it to NaN to prevent creating a date object

        if (_this6.state.ampm === 'am') {
          if (hh === 12) hh = 0;
        } else if (_this6.state.ampm === 'pm') {
          if (hh !== 12) hh = hh + 12;
        }

        hh = hh.toString().padStart(2, '0');

        var mm = _this6.state.mm.padStart(2, '0');

        var ss = _this6.state.ss.padStart(2, '0');

        try {
          var date = new Date(_this6.state.date + 'T' + hh + ':' + mm + ':' + ss + '.' + _this6.state.ms);
          event['target']['value'] = date.toISOString().replace('Z', '+00:00'); // make compatible to python
        } catch (err) {
          // invalid date
          return _this6.props.onChange(event);
        }

        _this6.props.onChange(event);
      };

      _this6.handleDateChange = function (e) {
        _this6.setState({
          date: e.target.value
        }, _this6.sendValue);
      };

      _this6.handleTimeChange = function (value) {
        _this6.setState(_extends({}, value), _this6.sendValue);
      };

      _this6.showTimePicker = function () {
        _this6.setState({
          showTimePicker: true
        });
      };

      _this6.state = _extends({}, _this6.getStateFromProps(), {
        showTimePicker: false
      });
      _this6.timeInput = React.createRef();
      _this6.timePickerContainer = React.createRef();
      return _this6;
    }

    var _proto5 = FormDateTimeInput.prototype;

    _proto5.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      if (prevProps.value !== this.props.value) {
        if (this.state.hh !== '' && this.state.hh !== '0' && this.state.hh !== '00') {
          var changed = false;
          var newState = this.getStateFromProps();

          for (var key in newState) {
            if (newState[key] !== this.state[key]) {
              changed = true;
              break;
            }
          }

          if (changed) this.setState(_extends({}, newState));
        }
      }
    };

    _proto5.componentDidMount = function componentDidMount() {
      document.addEventListener('mousedown', this.handleClickOutside);
    };

    _proto5.componentWillUnmount = function componentWillUnmount() {
      document.removeEventListener('mousedown', this.handleClickOutside);
    };

    _proto5.render = function render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field"
      }, this.props.label && /*#__PURE__*/React.createElement("label", null, this.props.label), /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field-inner"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field-inputs"
      }, /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field-date"
      }, /*#__PURE__*/React.createElement(FormInput, {
        label: "Date",
        type: "date",
        value: this.state.date,
        onChange: this.handleDateChange
      })), /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field-time"
      }, /*#__PURE__*/React.createElement(FormInput, {
        label: "Time",
        type: "text",
        value: this.state.hh + ':' + this.state.mm + ':' + this.state.ss + ' ' + this.state.ampm,
        onFocus: this.showTimePicker,
        readOnly: true,
        inputRef: this.timeInput
      }), /*#__PURE__*/React.createElement("div", {
        ref: this.timePickerContainer
      }, this.state.showTimePicker && /*#__PURE__*/React.createElement(TimePicker, {
        onChange: this.handleTimeChange,
        hh: this.state.hh,
        mm: this.state.mm,
        ss: this.state.ss,
        ampm: this.state.ampm
      })))), this.props.help_text && /*#__PURE__*/React.createElement("span", {
        className: "rjf-help-text"
      }, this.props.help_text)));
    };

    return FormDateTimeInput;
  }(React.Component);

  function GroupTitle(props) {
    if (!props.children) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-group-title"
    }, props.editable ? /*#__PURE__*/React.createElement("span", null, props.children, " ", /*#__PURE__*/React.createElement(Button, {
      className: "edit",
      onClick: props.onEdit,
      title: "Edit"
    }, "Edit")) : props.children);
  }

  function animate(e, animation, callback) {
    var el = e.target.parentElement.parentElement;
    var prevEl = el.previousElementSibling;
    var nextEl = el.nextElementSibling;
    el.classList.add('rjf-animate', 'rjf-' + animation);

    if (animation === 'move-up') {
      var _prevEl$getBoundingCl = prevEl.getBoundingClientRect(),
          y = _prevEl$getBoundingCl.y;

      var y1 = y;

      var _el$getBoundingClient = el.getBoundingClientRect();

      y = _el$getBoundingClient.y;
      var y2 = y;
      prevEl.classList.add('rjf-animate');
      prevEl.style.opacity = 0;
      prevEl.style.transform = 'translateY(' + (y2 - y1) + 'px)';
      el.style.opacity = 0;
      el.style.transform = 'translateY(-' + (y2 - y1) + 'px)';
    } else if (animation === 'move-down') {
      var _el$getBoundingClient2 = el.getBoundingClientRect(),
          _y = _el$getBoundingClient2.y;

      var _y2 = _y;

      var _nextEl$getBoundingCl = nextEl.getBoundingClientRect();

      _y = _nextEl$getBoundingCl.y;
      var _y3 = _y;
      nextEl.classList.add('rjf-animate');
      nextEl.style.opacity = 0;
      nextEl.style.transform = 'translateY(-' + (_y3 - _y2) + 'px)';
      el.style.opacity = 0;
      el.style.transform = 'translateY(' + (_y3 - _y2) + 'px)';
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
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-row-controls"
    }, props.onMoveUp && /*#__PURE__*/React.createElement(Button, {
      className: "move-up",
      onClick: function onClick(e) {
        return animate(e, 'move-up', props.onMoveUp);
      },
      title: "Move up"
    }, /*#__PURE__*/React.createElement("span", null, "\u2191")), props.onMoveDown && /*#__PURE__*/React.createElement(Button, {
      className: "move-down",
      onClick: function onClick(e) {
        return animate(e, 'move-down', props.onMoveDown);
      },
      title: "Move down"
    }, /*#__PURE__*/React.createElement("span", null, "\u2193")), props.onRemove && /*#__PURE__*/React.createElement(Button, {
      className: "remove",
      onClick: function onClick(e) {
        return animate(e, 'remove', props.onRemove);
      },
      title: "Remove"
    }, /*#__PURE__*/React.createElement("span", null, "\xD7")));
  }
  function FormRow(props) {
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-row"
    }, /*#__PURE__*/React.createElement(FormRowControls, props), /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-row-inner"
    }, props.children));
  }
  function FormGroup(props) {
    var hasChildren = React.Children.count(props.children);
    var innerClassName = props.level === 0 && !hasChildren ? "" : "rjf-form-group-inner";
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-group"
    }, props.level === 0 && /*#__PURE__*/React.createElement(GroupTitle, {
      editable: props.editable,
      onEdit: props.onEdit
    }, props.schema.title), /*#__PURE__*/React.createElement("div", {
      className: innerClassName
    }, props.level > 0 && /*#__PURE__*/React.createElement(GroupTitle, {
      editable: props.editable,
      onEdit: props.onEdit
    }, props.schema.title), props.children, props.addable && /*#__PURE__*/React.createElement(Button, {
      className: "add",
      onClick: function onClick(e) {
        return props.onAdd();
      },
      title: props.schema.type === 'object' ? 'Add new key' : 'Add new item'
    }, props.schema.type === 'object' ? 'Add key' : 'Add item')));
  }

  var _excluded = ["data", "schema", "name", "onChange", "onRemove", "removable", "onEdit", "editable", "onMoveUp", "onMoveDown", "parentType"];

  function handleChange(e, fieldType, callback) {
    var type = e.target.type;
    var value;

    if (type === 'checkbox') {
      value = e.target.checked;
    } else {
      value = e.target.value;
    }

    if (fieldType === 'number' || fieldType === 'integer') {
      value = value.trim();
      if (value === '') value = null;else if (!isNaN(Number(value))) value = Number(value);
    } else if (fieldType === 'boolean') {
      if (value === 'false' || value === false) value = false;else value = true;
    }

    callback(e.target.name, value);
  }

  function FormField(props) {
    var inputProps = {
      name: props.name,
      value: props.data,
      readOnly: props.schema.readOnly || props.schema.readonly,
      help_text: props.schema.help_text || props.schema.helpText
    };
    var type = props.schema.type;

    if (props.schema.choices) {
      inputProps.options = props.schema.choices;
      type = 'select';
    }

    if (props.schema.widget) {
      if (props.schema.widget === 'multiselect' && props.parentType !== 'array') ; else {
        type = props.schema.widget;
      }
    }

    var InputField;

    switch (type) {
      case 'string':
        InputField = FormInput;

        if (props.schema.format) {
          if (props.schema.format === 'data-url' || props.schema.format === 'file-url') {
            InputField = FormFileInput;
          } else if (props.schema.format === 'datetime') {
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
      onChange: function onChange(e) {
        return handleChange(e, props.schema.type, props.onChange);
      }
    }));
  }

  function getStringFormRow(args) {
    var data = args.data,
        schema = args.schema,
        name = args.name,
        onChange = args.onChange,
        onRemove = args.onRemove,
        removable = args.removable,
        onEdit = args.onEdit,
        editable = args.editable,
        onMoveUp = args.onMoveUp,
        onMoveDown = args.onMoveDown,
        parentType = args.parentType,
        fieldProps = _objectWithoutPropertiesLoose(args, _excluded);

    return /*#__PURE__*/React.createElement(FormRow, {
      key: name,
      onRemove: removable ? function (e) {
        return onRemove(name);
      } : null,
      onMoveUp: onMoveUp,
      onMoveDown: onMoveDown
    }, /*#__PURE__*/React.createElement(FormField, _extends({
      data: data,
      schema: schema,
      name: name,
      onChange: onChange,
      onEdit: onEdit,
      editable: editable,
      parentType: parentType
    }, fieldProps)));
  }
  function getArrayFormRow(args) {
    var data = args.data,
        schema = args.schema,
        name = args.name,
        onChange = args.onChange,
        _onAdd = args.onAdd,
        _onRemove = args.onRemove,
        onMove = args.onMove,
        level = args.level;
    var rows = [];
    var groups = [];
    var removable = true;
    var min_items = schema.min_items || schema.minItems || 0;
    if (data.length <= min_items) removable = false;
    var addable = true;
    var max_items = schema.max_items || schema.maxItems || 100;
    if (data.length >= max_items) addable = false;
    var isRef = schema.items.hasOwnProperty('$ref');
    if (isRef) schema.items = args.getRef(schema.items['$ref']);
    var type = schema.items.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    var nextArgs = {
      schema: schema.items,
      onChange: onChange,
      onAdd: _onAdd,
      onRemove: _onRemove,
      level: level + 1,
      removable: removable,
      onMove: onMove,
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
      var _loop = function _loop(i) {
        nextArgs.data = data[i];
        nextArgs.name = name + '-' + i;
        if (i === 0) nextArgs.onMoveUp = null;else nextArgs.onMoveUp = function (e) {
          return onMove(name + '-' + i, name + '-' + (i - 1));
        };
        if (i === data.length - 1) nextArgs.onMoveDown = null;else nextArgs.onMoveDown = function (e) {
          return onMove(name + '-' + i, name + '-' + (i + 1));
        };

        if (type === 'array') {
          groups.push(getArrayFormRow(nextArgs));
        } else if (type === 'object') {
          groups.push(getObjectFormRow(nextArgs));
        } else {
          rows.push(getStringFormRow(nextArgs));
        }
      };

      for (var i = 0; i < data.length; i++) {
        _loop(i);
      }
    }

    var coords = name; // coordinates for insertion and deletion

    if (rows.length || !rows.length && !groups.length) {
      rows = /*#__PURE__*/React.createElement(FormGroup, {
        level: level,
        schema: schema,
        addable: addable,
        onAdd: function onAdd() {
          return _onAdd(getBlankData(schema.items, args.getRef), coords);
        },
        editable: args.editable,
        onEdit: args.onEdit,
        key: 'row_group_' + name
      }, rows);

      if (args.parentType === 'object' && args.removable) {
        rows = /*#__PURE__*/React.createElement("div", {
          className: "rjf-form-group-wrapper",
          key: 'row_group_wrapper_' + name
        }, /*#__PURE__*/React.createElement(FormRowControls, {
          onRemove: function onRemove(e) {
            return _onRemove(name);
          }
        }), rows);
      }
    }

    if (groups.length) {
      var groupTitle = schema.title ? /*#__PURE__*/React.createElement(GroupTitle, {
        editable: args.editable,
        onEdit: args.onEdit
      }, schema.title) : null;
      groups = /*#__PURE__*/React.createElement("div", {
        key: 'group_' + name,
        className: "rjf-form-group-wrapper"
      }, args.parentType === 'object' && args.removable && /*#__PURE__*/React.createElement(FormRowControls, {
        onRemove: function onRemove(e) {
          return _onRemove(name);
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-form-group"
      }, /*#__PURE__*/React.createElement("div", {
        className: level > 0 ? "rjf-form-group-inner" : ""
      }, groupTitle, groups.map(function (i, index) {
        return /*#__PURE__*/React.createElement("div", {
          className: "rjf-form-group-wrapper",
          key: 'group_wrapper_' + name + '_' + index
        }, /*#__PURE__*/React.createElement(FormRowControls, {
          onRemove: removable ? function (e) {
            return _onRemove(name + '-' + index);
          } : null,
          onMoveUp: index > 0 ? function (e) {
            return onMove(name + '-' + index, name + '-' + (index - 1));
          } : null,
          onMoveDown: index < groups.length - 1 ? function (e) {
            return onMove(name + '-' + index, name + '-' + (index + 1));
          } : null
        }), i);
      }), addable && /*#__PURE__*/React.createElement(Button, {
        className: "add",
        onClick: function onClick(e) {
          return _onAdd(getBlankData(schema.items, args.getRef), coords);
        },
        title: "Add new item"
      }, "Add item"))));
    }

    return [].concat(rows, groups);
  }
  function getObjectFormRow(args) {
    var data = args.data,
        schema = args.schema,
        name = args.name,
        onChange = args.onChange,
        _onAdd2 = args.onAdd,
        _onRemove2 = args.onRemove,
        level = args.level,
        onMove = args.onMove;
    var rows = [];
    var schema_keys = schema.keys || schema.properties;
    var keys = [].concat(Object.keys(schema_keys));
    if (schema.additionalProperties) keys = [].concat(keys, Object.keys(data).filter(function (k) {
      return keys.indexOf(k) === -1;
    }));

    var _loop2 = function _loop2(i) {
      var key = keys[i];
      var value = data[key];
      var childName = name + '-' + key;
      var schemaValue = schema_keys[key];

      if (typeof schemaValue === 'undefined') {
        // for keys added through additionalProperties
        if (typeof schema.additionalProperties === 'boolean') schemaValue = {
          type: 'string'
        };else schemaValue = _extends({}, schema.additionalProperties);
      }

      var isRef = schemaValue.hasOwnProperty('$ref');
      if (isRef) schemaValue = args.getRef(schemaValue['$ref']);
      var type = schemaValue.type;
      if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
      if (!schemaValue.title || isRef && schema.additionalProperties) // for additionalProperty refs, use the key as the title
        schemaValue.title = getVerboseName(key);
      var removable = false;
      if (schema_keys[key] === undefined) removable = true;
      var nextArgs = {
        data: value,
        schema: schemaValue,
        name: childName,
        onChange: onChange,
        onAdd: _onAdd2,
        onRemove: _onRemove2,
        level: level + 1,
        removable: removable,
        onMove: onMove,
        parentType: 'object',
        getRef: args.getRef
      };

      nextArgs.onEdit = function () {
        return handleKeyEdit(data, key, value, childName, _onAdd2, _onRemove2);
      };

      nextArgs.editable = removable;

      if (type === 'array') {
        rows.push(getArrayFormRow(nextArgs));
      } else if (type === 'object') {
        rows.push(getObjectFormRow(nextArgs));
      } else {
        rows.push(getStringFormRow(nextArgs));
      }
    };

    for (var i = 0; i < keys.length; i++) {
      _loop2(i);
    }

    if (rows.length || schema.additionalProperties) {
      var coords = name;
      rows = /*#__PURE__*/React.createElement(FormGroup, {
        level: level,
        schema: schema,
        addable: schema.additionalProperties,
        onAdd: function onAdd() {
          return handleKeyValueAdd(data, coords, _onAdd2, schema.additionalProperties, args.getRef);
        },
        editable: args.editable,
        onEdit: args.onEdit,
        key: 'row_group_' + name
      }, rows);

      if (args.parentType === 'object' && args.removable) {
        rows = /*#__PURE__*/React.createElement("div", {
          className: "rjf-form-group-wrapper",
          key: 'row_group_wrapper_' + name
        }, /*#__PURE__*/React.createElement(FormRowControls, {
          onRemove: function onRemove(e) {
            return _onRemove2(name);
          }
        }), rows);
      }
    }

    return rows;
  }

  function handleKeyValueAdd(data, coords, onAdd, newSchema, getRef) {
    var key = prompt("Add new key");
    if (key === null) // clicked cancel
      return;
    if (newSchema === true) newSchema = {
      type: 'string'
    };
    key = key.trim();
    if (!key) alert("(!) Can't add empty key.\r\n\r\n‎");else if (data.hasOwnProperty(key)) alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");else onAdd(getBlankData(newSchema, getRef), coords + '-' + key);
  }

  function handleKeyEdit(data, key, value, coords, onAdd, onRemove) {
    var newKey = prompt("Rename key", key);
    if (newKey === null) // clicked cancel
      return;
    newKey = newKey.trim();
    if (newKey === key) // same keys
      return;
    if (!newKey) return alert("(!) Key name can't be empty.\r\n\r\n‎");else if (data.hasOwnProperty(newKey)) return alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");
    var newCoords = coords.split('-');
    newCoords.pop();
    newCoords.push(newKey);
    newCoords = newCoords.join('-');
    onAdd(value, newCoords);
    onRemove(coords);
  }

  var Form = /*#__PURE__*/function (_React$Component) {
    _inheritsLoose(Form, _React$Component);

    function Form(props) {
      var _this;

      _this = _React$Component.call(this, props) || this;

      _this.populateDataInput = function () {
        _this.dataInput.value = JSON.stringify(_this.state.data);
      };

      _this.handleChange = function (coords, value) {
        /*
            e.target.name is a chain of indices and keys:
            xxx-0-key-1-key2 and so on.
            These can be used as coordinates to locate 
            a particular deeply nested item.
             This first coordinate is not important and should be removed.
        */
        coords = coords.split('-');
        coords.shift(); // remove first coord

        function setDataUsingCoords(coords, data, value) {
          var coord = coords.shift();
          if (!isNaN(Number(coord))) coord = Number(coord);

          if (coords.length) {
            setDataUsingCoords(coords, data[coord], value);
          } else {
            data[coord] = value;
          }
        }

        var _data = JSON.parse(JSON.stringify(_this.state.data));

        setDataUsingCoords(coords, _data, value);

        _this.setState({
          data: _data
        });
      };

      _this.getRef = function (ref) {
        /* Returns schema reference. Nothing to do with React's refs.*/
        var refSchema;
        var tokens = ref.split('/');

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];
          if (token === '#') refSchema = _this.schema;else refSchema = refSchema[token];
        }

        return _extends({}, refSchema);
      };

      _this.getFields = function () {
        var data = _this.state.data;
        var formGroups = [];

        try {
          var type = _this.schema.type;
          if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
          var args = {
            data: data,
            schema: _this.schema,
            name: 'rjf',
            onChange: _this.handleChange,
            onAdd: _this.addFieldset,
            onRemove: _this.removeFieldset,
            onMove: _this.moveFieldset,
            level: 0,
            getRef: _this.getRef
          };

          if (type === 'array') {
            return getArrayFormRow(args);
          } else if (type === 'object') {
            return getObjectFormRow(args);
          }
        } catch (error) {
          formGroups = /*#__PURE__*/React.createElement("p", {
            style: {
              color: '#f00'
            }
          }, /*#__PURE__*/React.createElement("strong", null, "(!) Error:"), " Schema and data structure do not match.");
        }

        return formGroups;
      };

      _this.addFieldset = function (blankData, coords) {
        coords = coords.split('-');
        coords.shift();

        _this.setState(function (state) {
          var _data = JSON.parse(JSON.stringify(state.data));

          addDataUsingCoords(coords, _data, blankData);
          return {
            data: _data
          };
        });
      };

      _this.removeFieldset = function (coords) {
        coords = coords.split('-');
        coords.shift();

        _this.setState(function (state) {
          var _data = JSON.parse(JSON.stringify(state.data));

          removeDataUsingCoords(coords, _data);
          return {
            data: _data
          };
        });
      };

      _this.moveFieldset = function (oldCoords, newCoords) {
        oldCoords = oldCoords.split("-");
        oldCoords.shift();
        newCoords = newCoords.split("-");
        newCoords.shift();

        _this.setState(function (state) {
          var _data = JSON.parse(JSON.stringify(state.data));

          moveDataUsingCoords(oldCoords, newCoords, _data);
          return {
            data: _data
          };
        });
      };

      _this.dataInput = document.getElementById(_this.props.dataInputId);
      _this.schema = props.schema;
      var _data2 = props.data;

      if (!_data2) {
        // create empty data from schema
        _data2 = getBlankData(_this.schema, _this.getRef);
      } else {
        // data might be stale if schema has new keys, so add them to data
        try {
          _data2 = getSyncedData(_data2, _this.schema, _this.getRef);
        } catch (error) {
          console.error("Error: Schema and data structure don't match");
          console.error(error);
        }
      }

      _this.state = {
        value: '',
        data: _data2
      }; // update data in the input

      _this.populateDataInput();

      return _this;
    }

    var _proto = Form.prototype;

    _proto.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      if (this.state.data !== prevState.data) {
        this.populateDataInput();
      }
    };

    _proto.render = function render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "rjf-form-wrapper"
      }, /*#__PURE__*/React.createElement("fieldset", {
        className: "module aligned"
      }, /*#__PURE__*/React.createElement(EditorContext.Provider, {
        value: {
          fileUploadEndpoint: this.props.fileUploadEndpoint,
          fieldName: this.props.fieldName,
          modelName: this.props.modelName
        }
      }, this.getFields())));
    };

    return Form;
  }(React.Component);

  function addDataUsingCoords(coords, data, value) {
    var coord = coords.shift();
    if (!isNaN(Number(coord))) coord = Number(coord);

    if (coords.length) {
      addDataUsingCoords(coords, data[coord], value);
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
  }

  function removeDataUsingCoords(coords, data) {
    var coord = coords.shift();
    if (!isNaN(Number(coord))) coord = Number(coord);

    if (coords.length) {
      removeDataUsingCoords(coords, data[coord]);
    } else {
      if (Array.isArray(data)) data.splice(coord, 1); // in-place mutation
      else delete data[coord];
    }
  }

  function moveDataUsingCoords(oldCoords, newCoords, data) {
    var oldCoord = oldCoords.shift();
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
        var newCoord = newCoords[newCoords.length - 1];
        var item = data[oldCoord];
        data.splice(oldCoord, 1);
        data.splice(newCoord, 0, item);
      }
    }
  }

  function JSONForm(config) {
    this.containerId = config.containerId;
    this.dataInputId = config.dataInputId;
    this.schema = config.schema;
    this.data = config.data;
    this.fileUploadEndpoint = config.fileUploadEndpoint;
    this.fieldName = config.fieldName;
    this.modelName = config.modelName;

    this.render = function () {
      ReactDOM.render( /*#__PURE__*/React.createElement(Form, {
        schema: this.schema,
        dataInputId: this.dataInputId,
        data: this.data,
        fileUploadEndpoint: this.fileUploadEndpoint,
        fieldName: this.fieldName,
        modelName: this.modelName
      }), document.getElementById(this.containerId));
    };
  }

  var index = {
    JSONForm: JSONForm
  };

  return index;

})));
//# sourceMappingURL=react-json-form.js.map
