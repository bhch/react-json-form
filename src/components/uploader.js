import React from 'react';
import ReactModal from 'react-modal';
import Button from './buttons';
import Loader from './loaders';
import {EditorContext, capitalize, getCsrfCookie} from '../util';
import {FormFileInput} from './form.js';
import Icon from './icons';

export default class FileUploader extends React.Component {
    static contextType = EditorContext;

    constructor(props) {
        super(props);

        this.state = {
            value: props.value,
            //fileName: this.getFileName(),
            loading: false,
            open: false,
            pane: 'upload'
        };

        this.hiddenInputRef = React.createRef();

        this.newFiles = []; // track new uploaded files to send DELETE request
                             // on page exit if unsaved
        this.exitListenersAdded = false;
    }

    openModal = (e) => {
        this.setState({open: true});
    }

    closeModal = (e) => {
        this.setState({open: false, pane: 'upload'});
    }

    togglePane = (name) => {
        this.setState({pane: name});
    }

    handleFileSelect = (value) => {
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
    }

    handleFileUpload = (e) => {
        this.newFiles.push(e.target.value);
        this.addExitEventListeners();

        this.props.onChange(e);
        this.closeModal();
    }

    addExitEventListeners = () => {
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

        if (this.exitListenersAdded)
            return;

        if (!this.hiddenInputRef.current)
            return;

        if (!this.hiddenInputRef.current.form)
            return;

        window.addEventListener('beforeunload', this.promptOnExit);
        window.addEventListener('unload', this.sendDeleteRequestOnExit);

        this.hiddenInputRef.current.form.addEventListener('submit', (e) => {
            window.removeEventListener('beforeunload', this.promptOnExit);
            window.removeEventListener('unload', this.sendDeleteRequestOnExit);
        });

        this.exitListenersAdded = true;
    }

    promptOnExit = (e) => {
        if (!this.newFiles.length)
            return;

        e.preventDefault();
        e.returnValue = '';
    }

    sendDeleteRequestOnExit = (e) => {
        if (!this.newFiles.length)
            return;

        this.sendDeleteRequest([this.newFiles], 'unsaved_form_page_exit', true);
    }

    clearFile = () => {
        if (window.confirm('Do you want to remove this file?')) {
            let event = {
                target: {
                    type: 'text',
                    value: '',
                    name: this.props.name
                }
            };

            this.sendDeleteRequest([this.props.value], 'clear_button');

            this.props.onChange(event);
        }
    }

    sendDeleteRequest = (values, trigger, keepalive) => {
        /* Sends DELETE request to file handler endpoint.
         *
         * Prams:
         *   values: (array) names of files to delete
         *   trigger: (string) the action which triggered the deletion
         *   keepalive: (bool) whether to use keepalive flag or not
        */

        let endpoint = this.props.handler || this.context.fileHandler;

        let querystring = new URLSearchParams({
            field_name: this.context.fieldName,
            model_name: this.context.modelName,
            // coordinates: JSON.stringify(this.props.name.split('-').slice(1)),
            trigger: trigger
        });

        for (let i = 0; i < values.length; i++) {
            querystring.append('value', values[i]);
        }

        let url = endpoint + '?' + querystring;

        let options = {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfCookie(),
            },
        };
        if (keepalive)
            options['keepalive'] = true;

        return fetch(url, options);
    }

    render() {
        if (!this.props.handler && !this.context.fileHandler) {
            return <FormFileInput {...this.props} />;
        }

        return (
            <div>
                {this.props.label && <label>{this.props.label}</label>}
                <div className="rjf-file-field">
                {this.props.value && 
                    <div className="rjf-current-file-name">
                        Current file: <span>{this.props.value}</span> {' '}
                        <Button className="remove-file" onClick={this.clearFile}>Clear</Button>
                    </div>
                }
                <Button onClick={this.openModal} className="upload-modal__open">
                    {this.props.value ? 'Change file' : 'Select file'}
                </Button>
                {this.props.error && this.props.error.map((error, i) => <span className="rjf-error-text" key={i}>{error}</span>)}
                {this.props.help_text && <span className="rjf-help-text">{this.props.help_text}</span>}
                </div>

                <input type="hidden" ref={this.hiddenInputRef} />

                <ReactModal
                    isOpen={this.state.open}
                    onRequestClose={this.closeModal}
                    contentLabel="Select file"
                    portalClassName="rjf-modal-portal"
                    overlayClassName="rjf-modal__overlay"
                    className="rjf-modal__dialog"
                    bodyOpenClassName="rjf-modal__main-body--open"
                    closeTimeoutMS={150}
                    ariaHideApp={false}
                >
                    <div className="rjf-modal__content">
                        <div className="rjf-modal__header">
                            <TabButton
                                onClick={this.togglePane}
                                tabName="upload"
                                active={this.state.pane === "upload"}
                            >
                                Upload new
                            </TabButton>{' '}
                            <TabButton
                                onClick={this.togglePane}
                                tabName="library"
                                active={this.state.pane === "library"}
                            >
                                Choose from library
                            </TabButton>
                            
                            <Button className="modal__close" onClick={this.closeModal} title="Close (Esc)">
                                <Icon name="x-lg" />
                            </Button>
                        </div>
                        <div className="rjf-modal__body">

                            {this.state.pane === 'upload' &&
                                <UploadPane
                                    {...this.props}
                                    onChange={this.handleFileUpload}
                                    label=''
                                    value=''
                                    help_text=''
                                />
                            }
                            {this.state.pane === 'library' &&
                                <LibraryPane
                                    fileHandler={this.props.handler || this.context.fileHandler}
                                    fileHandlerArgs={{
                                        field_name: this.context.fieldName,
                                        model_name: this.context.modelName,
                                        coordinates: JSON.stringify(this.props.name.split('-').slice(1)),
                                    }}
                                    onFileSelect={this.handleFileSelect}
                                    sendDeleteRequest={this.sendDeleteRequest}
                                />
                            }

                        </div>
                        <div className="rjf-modal__footer">
                            <Button className="modal__footer-close" onClick={this.closeModal}>Cancel</Button>
                        </div>
                    </div>
                </ReactModal>
            </div>
        );
    }
}
    

function TabButton(props) {
    let className = 'rjf-upload-modal__tab-button';
    if (props.active)
        className += ' rjf-upload-modal__tab-button--active';

    return (
        <button
            onClick={() => props.onClick(props.tabName)}
            className={className}
        >
            {props.children}
        </button>
    );
}


function UploadPane(props) {
    return (
        <div className="rjf-upload-modal__pane">
            <h3>Upload new</h3>
            <br/>
            <FormFileInput {...props} />
        </div>
    );
}


class LibraryPane extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            files: [],
            page: 0, // current page
            hasMore: true,
        };
    }

    componentDidMount() {
        //setTimeout(() => this.setState({loading: false}), 1000);
        this.fetchList();
    }

    fetchList = () => {
        let endpoint = this.props.fileHandler;

        if (!endpoint) {
            console.error(
                "Error: fileHandler option need to be passed "
                + "while initializing editor for enabling file listing.");
            this.setState({loading: false, hasMore: false});
            return;
        }

        let url = endpoint + '?' + new URLSearchParams({
            ...this.props.fileHandlerArgs,
            page: this.state.page + 1
        });

        fetch(url, {method: 'GET'})
        .then((response) => response.json())
        .then((result) => {
            if (!Array.isArray(result.results))
                result.results = [];

            this.setState((state) => ({
                loading: false,
                files: [...state.files, ...result.results],
                page: result.results.length > 0 ? state.page + 1 : state.page,
                hasMore: result.results.length > 0,
            })
            );
        })
        .catch((error) => {
            alert('Something went wrong while retrieving media files');
            console.error('Error:', error);
            this.setState({loading: false});
        });
    }

    onLoadMore = (e) => {
        this.setState({loading: true}, this.fetchList);
    }

    onFileDelete = () => {
        this.setState({page: 0, files: []}, this.onLoadMore);
    }

    render() {
        return (
            <div className="rjf-upload-modal__pane">
                <h3>Media library</h3>

                <div className="rjf-upload-modal__media-container">
                {this.state.files.map((i) => {
                    return (
                        <MediaTile
                            {...i}
                            onClick={this.props.onFileSelect}
                            sendDeleteRequest={this.props.sendDeleteRequest}
                            onFileDelete={this.onFileDelete}
                        />
                    );
                })}
                </div>

                {this.state.loading && <Loader className="rjf-upload-modal__media-loader" />}

                {!this.state.loading && this.state.hasMore  &&
                    <div>
                        <Button onClick={this.onLoadMore} className="upload-modal__media-load">
                            <Icon name="arrow-down" /> View more
                        </Button>
                    </div>
                }
                {!this.state.hasMore && 
                    <div className="rjf-upload-modal__media-end-message">
                        {this.state.files.length ? 'End of list' : 'No files found'}
                    </div>
                }
            </div>
        );
    }
}


const DEFAULT_THUBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23999999' viewBox='0 0 16 16'%3E%3Cpath d='M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z'/%3E%3C/svg%3E";


function MediaTile(props) {
    let metadata = props.metadata || {};

    return (
        <div className="rjf-upload-modal__media-tile">
            <MediaTileMenu
                value={props.value}
                sendDeleteRequest={props.sendDeleteRequest}
                onFileDelete={props.onFileDelete}
            />
            <div className="rjf-upload-modal__media-tile-inner" tabIndex="0" onClick={() => props.onClick(props.value)}>
                <img src={props.thumbnail ? props.thumbnail : DEFAULT_THUBNAIL} />
                {props.metadata &&
                    <div className="rjf-upload-modal__media-tile-metadata">
                        {Object.getOwnPropertyNames(metadata).map((key) => {
                            return <span>{metadata[key]}</span>;
                        })}
                    </div>
                }
            </div>
        </div>
    );
}


class MediaTileMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            loading: false
        };
    }

    toggleMenu = (e) => {
        this.setState((state) => ({open: !state.open}));
    }

    handleDeleteClick = (e) => {
        if (window.confirm('Do you want to delete this file?')) {
            this.setState({loading: true});
            this.props.sendDeleteRequest([this.props.value], 'delete_button')
            .then((response) => {
                let status = response.status;
                let msg;

                if (status === 200) {
                    // success
                } else if (status === 400)
                    msg = 'Bad request';
                else if (status === 401 || status === 403)
                    msg = "You don't have permission to delete this file";
                else if (status === 404)
                    msg = 'This file does not exist on server';
                else if (status === 405)
                    msg = 'This operation is not permitted';
                else if (status > 405)
                    msg = 'Something went wrong while deleting file';

                this.setState({loading: false, open: false});

                if (msg)
                    alert(msg);
                else
                    this.props.onFileDelete();
            })
            .catch((error) => {
                alert('Something went wrong while deleting file');
                console.error('Error:', error);
                this.setState({loading: false});
            });
        }
    }

    render() {
        return (
            <div className={this.state.open ? 'rjf-dropdown open' : 'rjf-dropdown'}>
                <Button
                    className="rjf-dropdown-toggler"
                    alterClassName={false}
                    title={this.state.open ? 'Close menu' : 'Open menu'}
                    onClick={this.toggleMenu}
                >
                    <Icon name={this.state.open ? 'x-lg' : 'three-dots-vertical'} />
                </Button>
                {this.state.open &&
                <div className="rjf-dropdown-items">
                    <Button
                        className="rjf-dropdown-item rjf-text-danger"
                        alterClassName={false}
                        onClick={this.handleDeleteClick}
                    >
                        {this.state.loading && <Loader />}
                        {this.state.loading ? ' Deleting...' : 'Delete'}
                    </Button>
                </div>
                }
            </div>
        );
    }
}
