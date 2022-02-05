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

  function getBlankObject(schema) {
    var keys = {};
    var schema_keys = schema.keys || schema.properties;

    for (var key in schema_keys) {
      var value = schema_keys[key];
      var type = value.type;
      if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
      if (type === 'array') keys[key] = getBlankArray(value);else if (type === 'object') keys[key] = getBlankObject(value);else if (type === 'boolean') keys[key] = value["default"] || false;else if (type === 'integer' || type === 'number') keys[key] = value["default"] || null;else // string etc.
        keys[key] = value["default"] || '';
    }

    return keys;
  }
  function getBlankArray(schema) {
    var items = [];
    var type = schema.items.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    if (type === 'array') items.push(getBlankArray(schema.items));else if (type === 'object') items.push(getBlankObject(schema.items));else if (type === 'boolean') items.push(schema.items["default"] || false);else if (type === 'integer' || type === 'number') items.push(schema.items["default"] || null);else // string, etc.
      items.push(schema.items["default"] || '');
    return items;
  }
  function getBlankData(schema) {
    var type = schema.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    if (type === 'array') return getBlankArray(schema);else if (type === 'object') return getBlankObject(schema);else if (type === 'boolean') return schema["default"] || false;else if (type === 'integer' || type === 'number') return schema["default"] || null;else // string, etc.
      return schema["default"] || '';
  }

  function getSyncedArray(data, schema) {
    var newData = JSON.parse(JSON.stringify(data));
    var type = schema.items.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

    for (var i = 0; i < data.length; i++) {
      var item = data[i];

      if (type === 'array') {
        newData[i] = getSyncedArray(item, schema.items);
      } else if (type === 'object') {
        newData[i] = getSyncedObject(item, schema.items);
      } else {
        if ((type === 'integer' || type === 'number') && item === '') newData[i] = null;
      }
    }

    return newData;
  }

  function getSyncedObject(data, schema) {
    var newData = JSON.parse(JSON.stringify(data));
    var schema_keys = schema.keys || schema.properties;
    var keys = [].concat(Object.keys(schema_keys));

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var schemaValue = schema_keys[key];
      var type = schemaValue.type;
      if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

      if (!data.hasOwnProperty(key)) {
        if (type === 'array') newData[key] = getSyncedArray([], schemaValue);else if (type === 'object') newData[key] = getSyncedObject({}, schemaValue);else if (type === 'boolean') newData[key] = false;else if (type === 'integer' || type === 'number') newData[key] = null;else newData[key] = '';
      } else {
        if (type === 'array') newData[key] = getSyncedArray(data[key], schemaValue);else if (type === 'object') newData[key] = getSyncedObject(data[key], schemaValue);else {
          if ((type === 'integer' || type === 'number') && data[key] === '') newData[key] = null;else newData[key] = data[key];
        }
      }
    }

    return newData;
  }

  function getSyncedData(data, schema) {
    // adds those keys to data which are in schema but not in data
    var type = schema.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';

    if (type === 'array') {
      return getSyncedArray(data, schema);
    } else if (type === 'object') {
      return getSyncedObject(data, schema);
    }

    return data;
  }

  var _excluded$1 = ["className"];
  function Button(_ref) {
    var className = _ref.className,
        props = _objectWithoutPropertiesLoose(_ref, _excluded$1);

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

    function TimePicker(props) {
      var _this;

      _this = _React$Component.call(this, props) || this;

      _this.validateValue = function (name, value) {
        if (name === 'hh' && value < 1) return 1;else if (name !== 'hh' && value < 0) return 0;else if (name === 'hh' && value > 12) return 12;else if (name !== 'hh' && value > 59) return 59;
        return value;
      };

      _this.handleChange = function (e) {
        var _this$setState;

        var name = e.target.dataset.name;
        var value = e.target.value;
        if (isNaN(value)) return;

        var validValue = _this.validateValue(name, parseInt(value) || 0);

        if (name === 'hh' && (value === '0' || value === '' || value === '00') && validValue === 1) validValue = 0;

        if (value.startsWith('0') && validValue < 10 && validValue !== 0) {
          validValue = validValue.toString().padStart(2, '0');
        }

        _this.setState((_this$setState = {}, _this$setState[name] = value !== '' ? validValue.toString() : '', _this$setState));
      };

      _this.handleKeyDown = function (e) {
        var _this$setState2;

        if (e.keyCode !== 38 && e.keyCode !== 40) return;
        var name = e.target.dataset.name;
        var value = parseInt(e.target.value) || 0;

        if (e.keyCode === 38) {
          value++;
        } else if (e.keyCode === 40) {
          value--;
        }

        _this.setState((_this$setState2 = {}, _this$setState2[name] = _this.validateValue(name, value).toString().padStart(2, '0'), _this$setState2));
      };

      _this.handleSpin = function (name, type) {
        _this.setState(function (state) {
          var _ref;

          var value = state[name];

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

          return _ref = {}, _ref[name] = value, _ref;
        });
      };

      _this.handleBlur = function (e) {
        var value = _this.validateValue(e.target.dataset.name, parseInt(e.target.value) || 0);

        if (value < 10) {
          var _this$setState3;

          _this.setState((_this$setState3 = {}, _this$setState3[e.target.dataset.name] = value.toString().padStart(2, '0'), _this$setState3));
        }
      };

      _this.state = {
        hh: props.hh || '12',
        mm: props.mm || '00',
        ss: props.ss || '00',
        ampm: props.ampm || 'am'
      };
      return _this;
    }

    var _proto = TimePicker.prototype;

    _proto.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      if (this.state !== prevState) this.props.onChange(this.state);
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
        value: this.state.hh,
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
        value: this.state.mm,
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
        value: this.state.ss,
        onChange: this.handleChange,
        onBlur: this.handleBlur,
        onKeyDown: this.handleKeyDown
      })), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col rjf-time-picker-col-sm"
      }), /*#__PURE__*/React.createElement("div", {
        className: "rjf-time-picker-col"
      }, this.state.ampm)), /*#__PURE__*/React.createElement("div", {
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
    if (document.cookie.split(';').filter(function (item) {
      return item.trim().indexOf('csrftoken=') === 0;
    }).length) {
      return document.cookie.split(';').filter(function (item) {
        return item.trim().indexOf('csrftoken=') === 0;
      })[0].split('=')[1];
    }

    return null;
  }

  var _excluded = ["label", "help_text", "error", "inputRef"],
      _excluded2 = ["label", "help_text", "error", "value"],
      _excluded3 = ["label", "help_text", "error", "value", "options"],
      _excluded4 = ["label", "help_text", "error", "value", "options"],
      _excluded5 = ["label", "value"],
      _excluded6 = ["label", "help_text", "error", "inputRef"];
  function FormInput(_ref) {
    var label = _ref.label,
        inputRef = _ref.inputRef,
        props = _objectWithoutPropertiesLoose(_ref, _excluded);

    if (props.type === 'string') props.type = 'text';
    if (inputRef) props.ref = inputRef;
    if (props.value === null) props.value = '';
    return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("input", props));
  }
  function FormCheckInput(_ref2) {
    var label = _ref2.label,
        value = _ref2.value,
        props = _objectWithoutPropertiesLoose(_ref2, _excluded2);

    if (!label) label = props.name.toUpperCase();
    if (props.type === 'bool') props.type = 'checkbox';
    if (props.checked === undefined) props.checked = value;
    if (props.checked === '' || props.checked === null || props.checked === undefined) props.checked = false;
    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", props), " ", label));
  }
  function FormRadioInput(_ref3) {
    var label = _ref3.label,
        value = _ref3.value,
        options = _ref3.options,
        props = _objectWithoutPropertiesLoose(_ref3, _excluded3);

    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, label), options.map(function (option, i) {
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
    }));
  }
  function FormSelectInput(_ref4) {
    var label = _ref4.label,
        value = _ref4.value,
        options = _ref4.options,
        props = _objectWithoutPropertiesLoose(_ref4, _excluded4);

    if (props.readOnly) props.disabled = true;
    return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("select", _extends({
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
    })));
  }
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
  var FormFileInput = /*#__PURE__*/function (_React$Component) {
    _inheritsLoose(FormFileInput, _React$Component);

    function FormFileInput(props) {
      var _this;

      _this = _React$Component.call(this, props) || this;

      _this.getFileName = function () {
        if (!_this.props.value) return '';

        if (_this.props.type === 'data-url') {
          return _this.extractFileInfo(_this.props.value).name;
        } else if (_this.props.type === 'file-url') {
          return _this.props.value;
        } else {
          return 'Unknown file';
        }
      };

      _this.extractFileInfo = function (dataURL) {
        var _dataURItoBlob = dataURItoBlob(dataURL),
            blob = _dataURItoBlob.blob,
            name = _dataURItoBlob.name;

        return {
          name: name,
          size: blob.size,
          type: blob.type
        };
      };

      _this.addNameToDataURL = function (dataURL, name) {
        return dataURL.replace(';base64', ';name=' + encodeURIComponent(name) + ';base64');
      };

      _this.handleChange = function (e) {
        if (_this.props.type === 'data-url') {
          var file = e.target.files[0];
          var fileName = file.name;
          var reader = new FileReader();

          reader.onload = function () {
            // this.setState({src: reader.result});
            // we create a fake event object
            var event = {
              target: {
                type: 'text',
                value: _this.addNameToDataURL(reader.result, fileName),
                name: _this.props.name
              }
            };

            _this.props.onChange(event);
          };

          reader.readAsDataURL(file);
        } else if (_this.props.type === 'file-url') {
          var endpoint = _this.context.fileUploadEndpoint;

          if (!endpoint) {
            console.error("Error: fileUploadEndpoint option need to be passed " + "while initializing editor for enabling file uploads.");
            alert("Files can't be uploaded.");
            return;
          }

          _this.setState({
            loading: true
          });

          var formData = new FormData();
          formData.append('field_name', _this.context.fieldName);
          formData.append('model_name', _this.context.modelName);
          formData.append('coordinates', JSON.stringify(_this.props.name.split('-').slice(1)));
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
                name: _this.props.name
              }
            };

            _this.props.onChange(event);

            _this.setState({
              loading: false
            });
          })["catch"](function (error) {
            alert('Something went wrong while uploading file');
            console.error('Error:', error);

            _this.setState({
              loading: false
            });
          });
        }
      };

      _this.showFileBrowser = function () {
        _this.inputRef.current.click();
      };

      _this.clearFile = function () {
        var event = {
          target: {
            type: 'text',
            value: '',
            name: _this.props.name
          }
        };

        _this.props.onChange(event);
      };

      _this.state = {
        value: props.value,
        fileName: _this.getFileName(),
        loading: false
      };
      _this.inputRef = React.createRef();
      return _this;
    }

    var _proto = FormFileInput.prototype;

    _proto.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
      if (this.props.value !== prevProps.value) {
        this.setState({
          value: this.props.value,
          fileName: this.getFileName()
        });
      }
    };

    _proto.render = function render() {
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
  var FormTextareaInput = /*#__PURE__*/function (_React$Component2) {
    _inheritsLoose(FormTextareaInput, _React$Component2);

    function FormTextareaInput(props) {
      var _this2;

      _this2 = _React$Component2.call(this, props) || this;

      _this2.handleChange = function (e) {
        _this2.updateHeight(e.target);

        if (_this2.props.onChange) _this2.props.onChange(e);
      };

      _this2.updateHeight = function (el) {
        var offset = el.offsetHeight - el.clientHeight;
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + offset + 'px';
      };

      if (!props.inputRef) _this2.inputRef = React.createRef();
      return _this2;
    }

    var _proto2 = FormTextareaInput.prototype;

    _proto2.componentDidMount = function componentDidMount() {
      if (this.props.inputRef) this.updateHeight(this.props.inputRef.current);else this.updateHeight(this.inputRef.current);
    };

    _proto2.render = function render() {
      var _this$props = this.props,
          label = _this$props.label,
          inputRef = _this$props.inputRef,
          props = _objectWithoutPropertiesLoose(_this$props, _excluded6);

      delete props.type;
      props.ref = inputRef || this.inputRef;
      props.onChange = this.handleChange;
      return /*#__PURE__*/React.createElement("div", null, label && /*#__PURE__*/React.createElement("label", null, label), /*#__PURE__*/React.createElement("textarea", props));
    };

    return FormTextareaInput;
  }(React.Component);
  var FormDateTimeInput = /*#__PURE__*/function (_React$Component3) {
    _inheritsLoose(FormDateTimeInput, _React$Component3);

    function FormDateTimeInput(props) {
      var _this3;

      _this3 = _React$Component3.call(this, props) || this; // we maintain this input's state in itself
      // so that we can only pass valid values
      // otherwise keep the value empty if invalid

      _this3.handleClickOutside = function (e) {
        if (_this3.state.showTimePicker) {
          if (_this3.timePickerContainer.current && !_this3.timePickerContainer.current.contains(e.target) && !_this3.timeInput.current.contains(e.target)) _this3.setState({
            showTimePicker: false
          });
        }
      };

      _this3.sendValue = function () {
        // we create a fake event object
        // to send a combined value from two inputs
        var event = {
          target: {
            type: 'text',
            value: '',
            name: _this3.props.name
          }
        };
        if (_this3.state.date === '' || _this3.state.date === null) return _this3.props.onChange(event);
        var hh = parseInt(_this3.state.hh);

        if (_this3.state.ampm === 'am') {
          if (hh === 12) hh = 0;
        } else if (_this3.state.ampm === 'pm') {
          if (hh !== 12) hh = hh + 12;
        }

        hh = hh.toString().padStart(2, '0');

        var mm = _this3.state.mm.padStart(2, '0');

        var ss = _this3.state.ss.padStart(2, '0');

        var date = new Date(_this3.state.date + 'T' + hh + ':' + mm + ':' + ss + '.' + _this3.state.ms);
        var value = date.toISOString().replace('Z', '+00:00'); // make compatible to python

        event['target']['value'] = value;

        _this3.props.onChange(event);
      };

      _this3.handleDateChange = function (e) {
        _this3.setState({
          date: e.target.value
        }, _this3.sendValue);
      };

      _this3.handleTimeChange = function (value) {
        _this3.setState({
          hh: value.hh,
          mm: value.mm,
          ss: value.ss,
          ampm: value.ampm
        }, _this3.sendValue);
      };

      _this3.showTimePicker = function () {
        _this3.setState({
          showTimePicker: true
        });
      };

      var _date = '';
      var _hh = '12';
      var _mm = '00';
      var _ss = '00';
      var ms = '000';
      var ampm = 'am';

      if (props.value) {
        var d = new Date(props.value);
        var year = d.getFullYear().toString().padStart(2, '0');
        var month = (d.getMonth() + 1).toString().padStart(2, '0');
        var day = d.getDate().toString().padStart(2, '0');
        _date = year + '-' + month + '-' + day;
        _hh = d.getHours();

        if (_hh === 0) {
          _hh = 12;
        } else if (_hh === 12) {
          ampm = 'pm';
        } else if (_hh > 12) {
          _hh = _hh - 12;
          ampm = 'pm';
        }

        _mm = d.getMinutes();
        _ss = d.getSeconds();
        ms = d.getMilliseconds();
        _hh = _hh.toString().padStart(2, '0');
        _mm = _mm.toString().padStart(2, '0');
        _ss = _ss.toString().padStart(2, '0');
      }

      _this3.state = {
        date: _date,
        hh: _hh,
        mm: _mm,
        ss: _ss,
        ms: ms,
        ampm: ampm,
        showTimePicker: false
      };
      _this3.timeInput = React.createRef();
      _this3.timePickerContainer = React.createRef();
      return _this3;
    }

    var _proto3 = FormDateTimeInput.prototype;

    _proto3.componentDidMount = function componentDidMount() {
      document.addEventListener('mousedown', this.handleClickOutside);
    };

    _proto3.componentWillUnmount = function componentWillUnmount() {
      document.removeEventListener('mousedown', this.handleClickOutside);
    };

    _proto3.render = function render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field"
      }, this.props.label && /*#__PURE__*/React.createElement("label", null, this.props.label), /*#__PURE__*/React.createElement("div", {
        className: "rjf-datetime-field-inner"
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
      })))));
    };

    return FormDateTimeInput;
  }(React.Component);

  function GroupTitle(props) {
    if (!props.children) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "rjf-form-group-title"
    }, props.children);
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
    }, props.level === 0 && /*#__PURE__*/React.createElement(GroupTitle, null, props.schema.title), /*#__PURE__*/React.createElement("div", {
      className: innerClassName
    }, props.level > 0 && /*#__PURE__*/React.createElement(GroupTitle, null, props.schema.title), props.children, props.addable && /*#__PURE__*/React.createElement(Button, {
      className: "add",
      onClick: function onClick(e) {
        return props.onAdd();
      },
      title: "Add new"
    }, hasChildren ? 'Add more' : 'Add')));
  }

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
      readOnly: props.schema.readOnly || props.schema.readonly
    };
    var type = props.schema.type;

    if (props.schema.choices) {
      inputProps.options = props.schema.choices;
      type = 'select';
    }

    if (props.schema.widget) type = props.schema.widget;
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
        onMoveDown = args.onMoveDown;
    return /*#__PURE__*/React.createElement(FormRow, {
      key: name,
      onRemove: removable ? function (e) {
        return onRemove(name);
      } : null,
      onMoveUp: onMoveUp,
      onMoveDown: onMoveDown
    }, /*#__PURE__*/React.createElement(FormField, {
      data: data,
      schema: schema,
      name: name,
      onChange: onChange,
      onEdit: onEdit,
      editable: editable
    }));
  }
  function getArrayFormRow(args) {
    var data = args.data,
        schema = args.schema,
        name = args.name,
        onChange = args.onChange,
        _onAdd = args.onAdd,
        onRemove = args.onRemove,
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
    var type = schema.items.type;
    if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
    var nextArgs = {
      schema: schema.items,
      onChange: onChange,
      onAdd: _onAdd,
      onRemove: onRemove,
      level: level + 1,
      removable: removable,
      onMove: onMove
    };

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

    var coords = name; // coordinates for insertion and deletion

    if (rows.length || !rows.length && !groups.length) {
      rows = /*#__PURE__*/React.createElement(FormGroup, {
        level: level,
        schema: schema,
        addable: addable,
        onAdd: function onAdd() {
          return _onAdd(getBlankData(schema.items), coords);
        },
        key: 'row_group_' + name
      }, rows);
    }

    if (groups.length) {
      var groupTitle = schema.title ? /*#__PURE__*/React.createElement("div", {
        className: "rjf-form-group-title"
      }, schema.title) : null;
      groups = /*#__PURE__*/React.createElement("div", {
        key: 'group_' + name
      }, groupTitle, groups.map(function (i, index) {
        return /*#__PURE__*/React.createElement("div", {
          className: "rjf-form-group-wrapper",
          key: 'group_wrapper_' + name + '_' + index
        }, /*#__PURE__*/React.createElement(FormRowControls, {
          onRemove: removable ? function (e) {
            return onRemove(name + '-' + index);
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
          return _onAdd(getBlankData(schema.items), coords);
        },
        title: "Add new"
      }, "Add item"));
    }

    return [].concat(rows, groups);
  }
  function getObjectFormRow(args) {
    var data = args.data,
        schema = args.schema,
        name = args.name,
        onChange = args.onChange,
        _onAdd2 = args.onAdd,
        onRemove = args.onRemove,
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
      var schemaValue = schema_keys[key] || {
        type: 'string'
      };
      var type = schemaValue.type;
      if (type === 'list') type = 'array';else if (type === 'dict') type = 'object';
      if (!schemaValue.title) schemaValue.title = getVerboseName(key);
      var removable = false;
      if (schema_keys[key] === undefined) removable = true;
      var nextArgs = {
        data: value,
        schema: schemaValue,
        name: childName,
        onChange: onChange,
        onAdd: _onAdd2,
        onRemove: onRemove,
        level: level + 1,
        removable: removable,
        onMove: onMove
      };

      if (type === 'array') {
        rows.push(getArrayFormRow(nextArgs));
      } else if (type === 'object') {
        rows.push(getObjectFormRow(nextArgs));
      } else {
        nextArgs.onEdit = function () {
          return handleKeyEdit(data, key, value, childName, _onAdd2, onRemove);
        };

        nextArgs.editable = removable;
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
          return handleKeyValueAdd(data, coords, _onAdd2);
        },
        key: 'row_group_' + name
      }, rows);
    }

    return rows;
  }

  function handleKeyValueAdd(data, coords, onAdd) {
    var key = prompt("Add new key");
    if (key === null) // clicked cancel
      return;
    key = key.trim();
    if (!key) alert("(!) Can't add empty key.\r\n\r\n‎");else if (data.hasOwnProperty(key)) alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");else onAdd("", coords + '-' + key);
  }

  function handleKeyEdit(data, key, value, coords, onAdd, onRemove) {
    var newKey = prompt("Rename key", key);
    if (newKey === null) // clicked cancel
      return;
    newKey = newKey.trim();
    if (newKey === key) // same keys
      return;
    if (!newKey) return alert("(!) Key name can't be empty.\r\n\r\n‎");else if (data.hasOwnProperty(newKey)) return alert("(!) Duplicate keys not allowed. This key already exists.\r\n\r\n‎");
    onAdd(value, name + '-' + newKey);
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
            level: 0
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
        _data2 = getBlankData(_this.schema);
      } else {
        // data might be stale if schema has new keys, so add them to data
        try {
          _data2 = getSyncedData(_data2, _this.schema);
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
