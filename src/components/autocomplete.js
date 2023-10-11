import React from 'react';
import {FormInput, FormMultiSelectInputField} from './form';
import Loader from './loaders';
import Button from './buttons';
import Icon from './icons';
import {EditorContext, debounce, getCoordsFromName} from '../util';


export default class AutoCompleteInput extends React.Component {
    static contextType = EditorContext;

    constructor(props) {
        super(props);

        this.state = {
            searchInputValue: '',
            showOptions: false,
            options: [],
            loading: false,
        };

        this.optionsContainer = React.createRef();
        this.searchInputRef = React.createRef();
        this.input = React.createRef();

        this.debouncedFetchOptions = debounce(this.fetchOptions, 500);

        this.defaultEmptyValue = props.multiselect ? [] : '';
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.showOptions && this.state.showOptions !== prevState.showOptions) {
            if (this.searchInputRef.current)
                this.searchInputRef.current.focus();
        }
    }

    handleSelect = (value) => {
        if (this.props.multiselect) {
            if (Array.isArray(this.props.value))
                value = this.props.value.concat([value]);
            else
                value = [value];
        }

        let event = {
            target: {
                type: this.props.type,
                value: value,
                name: this.props.name
            }
        };

        if (!this.props.multiselect)
            this.hideOptions();

        this.props.onChange(event);
    }

    handleMultiselectRemove = (val) => {
        let value = this.props.value.filter((item) => {
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
    }

    clearValue = (e) => {
        this.handleSelect(this.defaultEmptyValue);
    }

    hasValue = () => {
        if (Array.isArray(this.props.value) && !this.props.value.length)
            return false;

        if (this.props.value === '' || this.props.value === null)
            return false;

        return true;
    }

    handleSearchInputChange = (e) => {
        let value = e.target.value;
        if (value) {
            this.setState({searchInputValue: value, loading: true}, this.debouncedFetchOptions);
        } else {
            this.setState({searchInputValue: value, loading: false, options: []});
        }
    }

    fetchOptions = () => {
        if (this.state.searchInputValue === '')
            return;

        // :TODO: cache results

        let endpoint = this.props.handler;

        if (!endpoint) {
            console.error(
                "Error: No 'handler' endpoint provided for autocomplete input."
            );

            this.setState({loading: false});
            return;
        }

        let url = endpoint + '?' + new URLSearchParams({
            field_name: this.context.fieldName,
            model_name: this.context.modelName,
            coords: getCoordsFromName(this.props.name),
            query: this.state.searchInputValue
        });

        fetch(url, {method: 'GET'})
        .then((response) => response.json())
        .then((result) => {
            if (!Array.isArray(result.results))
                result.results = [];

            this.setState((state) => ({
                loading: false,
                options: [...result.results],
            }));
        })
        .catch((error) => {
            alert('Something went wrong while fetching options');
            console.error('Error:', error);
            this.setState({loading: false});
        });
    }

    showOptions = (e) => {
        if (!this.state.showOptions)
            this.setState({showOptions: true});
    }

    hideOptions = (e) => {
        this.setState({showOptions: false, searchInputValue: '', options: [], loading: false});
    }

    toggleOptions = (e) => {
        this.setState((state) => {
            if (state.showOptions) {
                return {showOptions: false, searchInputValue: '', options: [], loading: false};
            } else {
                return {showOptions: true};
            }
        });
    }

    render() {
        return (
            <div className={this.props.label ? 'rjf-autocomplete-field has-label' : 'rjf-autocomplete-field'}>
                {this.props.multiselect ?
                    <FormInput
                        label={this.props.label}
                        help_text={this.props.help_text}
                        error={this.props.error}
                    >
                        <FormMultiSelectInputField
                            inputRef={this.input}
                            onClick={this.toggleOptions}
                            onChange={(e) => this.handleMultiselectRemove(e.target.value)}
                            value={this.props.value}
                            placeholder={this.props.placeholder || ' '}
                            disabled={this.props.readOnly || false}
                        />
                    </FormInput>
                    :
                    <React.Fragment>
                    <FormInput
                        label={this.props.label}
                        type="text"
                        value={this.props.value}
                        help_text={this.props.help_text}
                        error={this.props.error}
                        readOnly={true}
                        disabled={this.props.readOnly || false}
                        onClick={this.toggleOptions}
                        inputRef={this.input}
                        placeholder={this.props.placeholder}
                        name={this.props.name}
                        className="rjf-autocomplete-field-input"
                    />
                    {this.hasValue() && !this.props.readOnly &&
                    <Button
                        className="autocomplete-field-clear"
                        title="Clear"
                        onClick={this.clearValue}
                    >
                        <Icon name="x-circle" /> <span>Clear</span>
                    </Button>
                    }
                    </React.Fragment>
                }

                {this.state.showOptions && !this.props.readOnly &&
                    <AutoCompletePopup
                        options={this.state.options}
                        value={this.props.value}
                        hideOptions={this.hideOptions}
                        onSelect={this.handleSelect}
                        onSearchInputChange={this.handleSearchInputChange}
                        searchInputValue={this.state.searchInputValue}
                        containerRef={this.optionsContainer}
                        searchInputRef={this.searchInputRef}
                        inputRef={this.input}
                        loading={this.state.loading}
                        hasHelpText={(this.props.help_text || this.props.error) && 1}
                        multiselect={this.props.multiselect}
                    />
                }
            </div>
        )
    }
}

class AutoCompletePopup extends React.Component {
    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
      document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside = (e) => {
        if (this.props.containerRef.current &&
            !this.props.containerRef.current.contains(e.target) &&
            !this.props.inputRef.current.contains(e.target)
        )
            this.props.hideOptions();
    };

    render() {
        return (
            <div ref={this.props.containerRef}>
                <div
                    className="rjf-autocomplete-field-popup"
                    style={this.props.hasHelpText ? {marginTop: '-15px'} : {}}
                >

                    <AutocompleteSearchBox
                        inputRef={this.props.searchInputRef}
                        onChange={this.props.onSearchInputChange}
                        value={this.props.searchInputValue}
                        loading={this.props.loading}
                    />

                    {this.props.searchInputValue && 
                        <AutocompleteOptions
                            options={this.props.options}
                            value={this.props.value}
                            onSelect={this.props.onSelect}
                            loading={this.props.loading}
                            hasHelpText={this.props.hasHelpText}
                            multiselect={this.props.multiselect}
                        />
                    }
                </div>
            </div>
        );
    }
}


function AutocompleteSearchBox(props) {
    return (
        <div className="rjf-autocomplete-field-search">
            <FormInput
                type="text"
                placeholder="Search..."
                inputRef={props.inputRef}
                onChange={props.onChange}
                value={props.value}
                form={""}
            />
            {props.loading && <Loader />}
        </div>
    );
}


function AutocompleteOptions(props) {
    return (
        <div className="rjf-autocomplete-field-options">
            {!props.options.length && !props.loading &&
                <div className="rjf-autocomplete-field-option disabled">No options</div>
            }

            {props.options.map((option, i) => {
                let title, inputValue;
                if (typeof option === 'object') {
                    title = option.title || option.label;
                    inputValue = option.value;
                } else {
                    title = option;
                    if (typeof title === 'boolean')
                        title = capitalize(title.toString());
                    inputValue = option;
                }

                let selected = false;

                if (Array.isArray(props.value))
                    selected = props.value.indexOf(inputValue) > -1;
                else
                    selected = props.value === inputValue;

                let optionClassName = 'rjf-autocomplete-field-option';
                if (selected)
                    optionClassName += ' selected';

                return (
                    <div
                        key={title + '_' + inputValue + '_' + i}
                        className={optionClassName}
                        tabIndex={0}
                        role="button"
                        onClick={() => props.multiselect && selected ? null : props.onSelect(inputValue)}
                    >
                        {title}
                    </div>
                );
            })}
        </div>
    );
}
