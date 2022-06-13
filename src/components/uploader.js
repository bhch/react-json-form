import Button from './buttons';
import Loader from './loaders';
import {EditorContext, capitalize} from '../util';
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

        this.inputRef = React.createRef();
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
        this.props.onChange(e);
        this.closeModal();
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

            this.props.onChange(event);
        }
    }

    render() {
        if (!this.context.fileListEndpoint) {
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
                </div>

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
                                    fileListEndpoint={this.context.fileListEndpoint}
                                    onFileSelect={this.handleFileSelect}
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
        <div class="rjf-upload-modal__pane">
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
        let endpoint = this.props.fileListEndpoint;

        if (!endpoint) {
            console.error(
                "Error: fileListEndpoint option need to be passed "
                + "while initializing editor for enabling file listing.");
            this.setState({loading: false, hasMore: false});
            return;
        }

        fetch(endpoint + '?page=' + (this.state.page + 1), {method: 'GET'})
        .then((response) => response.json())
        .then((result) => {
            this.setState((state) => ({
                loading: false,
                files: [...state.files, ...result.file_list],
                page: result.file_list.length > 0 ? state.page + 1 : state.page,
                hasMore: result.file_list.length > 0,
            })
            );
        })
        .catch((error) => {
            alert('Something went wrong while uploading file');
            console.error('Error:', error);
            this.setState({loading: false});
        });
    }

    onLoadMore = (e) => {
        this.setState({loading: true}, this.fetchList);
    }

    render() {
        return (
            <div className="rjf-upload-modal__pane">
                <h3>Media library</h3>

                <div className="rjf-upload-modal__media-container">
                {this.state.files.map((i) => {
                    return <MediaTile {...i} onClick={this.props.onFileSelect} />
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


const DEFAULT_THUBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23999999' class='bi bi-file-earmark' viewBox='0 0 16 16'%3E%3Cpath d='M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z'/%3E%3C/svg%3E";


function MediaTile(props) {
    let metadata = props.metadata || {};

    return (
        <div className="rjf-upload-modal__media-tile">
            <div className="rjf-upload-modal__media-tile-inner" tabIndex="0" onClick={() => props.onClick(props.value)}>
                <img src={props.thumbnail ? props.thumbnail : DEFAULT_THUBNAIL} />
                <div className="rjf-upload-modal__media-tile-metadata">
                    {Object.getOwnPropertyNames(metadata).map((key) => {
                        return <span>{metadata[key]}</span>;
                    })}
                </div>
            </div>
        </div>
    );
}
