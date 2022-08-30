import React from 'react';
import {EditorState} from "@codemirror/state";
import {EditorView} from "@codemirror/view";
import {lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
    drawSelection, highlightActiveLine, keymap
} from '@codemirror/view';
import {indentOnInput, syntaxHighlighting, defaultHighlightStyle,bracketMatching} from '@codemirror/language';
import {history, defaultKeymap, historyKeymap, indentWithTab} from '@codemirror/commands';
import {closeBrackets, completionKeymap} from '@codemirror/autocomplete';
import {lintKeymap, lintGutter, linter} from '@codemirror/lint';
import {json, jsonParseLinter} from "@codemirror/lang-json";

import {ReactJSONForm, EditorState as RJFEditorState} from 'react-json-form';

import DEMOS from './demos.js';

export function Tabs(props) {
    return (
        <div className="tabs py-4">
            <div className="row">
                <div className="col-12">
                    <nav className="nav nav-pills">
                        {
                            DEMOS.map((item, index) => {
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        className={props.activeTabIndex === index ? "nav-link active" : "nav-link"}
                                        onClick={(e) => props.onClick(index, item.slug)}
                                    >
                                        {item.name}
                                    </button>
                                );
                            })
                        }
                    </nav>
                </div>
            </div>
        </div>
    );
}


export class TabContent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            rjf_state: RJFEditorState.create(this.getActiveTabSchema(), this.getActiveTabData()),
            schemaHasError: false,
        };

        this.schemaEditorParentRef = React.createRef();
        this.dataEditorParentRef = React.createRef();
    }
    
    componentDidMount() {
        this.schemaEditorView = new EditorView({
            state: this.getSchemaEditorNewState(),
            parent: this.schemaEditorParentRef.current
        });

        this.dataEditorView = new EditorView({
            state: this.getDataEditorNewState(),
            parent: this.dataEditorParentRef.current
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.activeTabIndex !== prevProps.activeTabIndex) {
            this.setState({
                rjf_state: RJFEditorState.create(this.getActiveTabSchema(), this.getActiveTabData()),
                schemaHasError: false
            }, (state) => {

                this.schemaEditorView.setState(this.getSchemaEditorNewState());
                this.updateDataEditor(this.getEditorData());
            });
        }
    }

    getSchemaEditorNewState = () => {
        return EditorState.create({
            doc: this.getEditorSchema(),
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                drawSelection(),
                history(),
                lintGutter(),
                indentOnInput(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                bracketMatching(),
                closeBrackets(),
                highlightActiveLine(),
                keymap.of([
                    ...indentWithTab,
                    ...defaultKeymap,
                    ...historyKeymap
                ]),
                json(),
                linter(jsonParseLinter()),

                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        // only update form state if the schema is valid JSON
                        try {
                            let newSchema = JSON.parse(update.state.doc.toString());

                            let newState = RJFEditorState.create(update.state.doc.toString());

                            this.setState({rjf_state: newState, schemaHasError: false}, (state) => {
                                this.updateDataEditor(this.getEditorData());
                            });
                        } catch (error) {
                            // schema didn't validate
                            if (!this.state.schemaHasError)
                                this.setState({schemaHasError: true});

                            return;
                        }
                    }
                })
            ]
        });
    }

    getDataEditorNewState = () => {
        return EditorState.create({
            doc: this.getEditorData(),
            extensions: [
                lineNumbers(),
                highlightSpecialChars(),
                drawSelection(),
                lintGutter(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                json(),
                EditorState.readOnly.of(true)
            ]
        });
    }

    updateDataEditor(data) {
        this.dataEditorView.dispatch({
            changes: {
                from: 0,
                to: this.dataEditorView.state.doc.length,
                insert: data
            }
        });
    }

    getActiveTabSchema() {
        return DEMOS[this.props.activeTabIndex].schema;
    }
    
    getActiveTabData() {
        return DEMOS[this.props.activeTabIndex].data;
    }
    
    getEditorSchema() {
        /* Returns schema for the editor */
        return JSON.stringify(this.state.rjf_state.getSchema(), null, 2);
    }

    getEditorData() {
        /* Returns data for the editor */
        return JSON.stringify(this.state.rjf_state.getData(), null, 2);
    }

    handleFormChange = (rjf_state) => {
        this.setState({rjf_state: rjf_state}, (state) => {
            if (!this.dataEditorView)
                return;

            this.updateDataEditor(this.getEditorData());
        });
    }

    render() {
        return (
            <div className="tab-content mt-5">
                <div className="row">
                    
                    <Description activeTabIndex={this.props.activeTabIndex} />

                    <div className="col-12 col-sm-6 order-2 order-md-1">
                        <div className="mb-4">
                            <p><strong>Schema</strong></p>
                            <div ref={this.schemaEditorParentRef} className="cm-container"></div>
                            {this.state.schemaHasError && <small className="text-danger">(!) Schema is not valid</small>}
                        </div>
                        <div className="mb-4">
                            <p><strong>Output data</strong></p>
                            <div ref={this.dataEditorParentRef} className="cm-container cm-readonly"></div>
                            <small className="text-muted">Read-only</small>
                        </div>
                    </div>
                    <div className="col-12 col-sm-6 order-1 order-md-2">
                        <p><strong>Form</strong></p>
                        <div className="mb-4">
                            <ReactJSONForm
                                editorState={this.state.rjf_state}
                                onChange={this.handleFormChange}
                                fileHandler='/none/'
                                fieldName='test_field'
                                modelName='TestModel'
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function Description(props) {
    let description = DEMOS[props.activeTabIndex].description;

    if (!description)
        return null;

    return (
        <div className="col-12 mt-n4">
            <div className="alert alert-info d-flex flex-row">
                <div className="alert--icon flex-shrink-1 flex-grow-0 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className="bi bi-info-square" viewBox="0 0 16 16">
                      <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                      <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                    </svg>
                </div>
                <div className="alert--content">
                    {description()}
                </div>
            </div>
        </div>
    );
}