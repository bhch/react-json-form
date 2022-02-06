import Button from './buttons';
import Icon from './icons';


export class TimePicker extends React.Component {
    componentWillUnmount() {
        let data = {
            hh: this.validateValue('hh', this.props.hh).toString().padStart(2, '0'),
            mm: this.validateValue('mm', this.props.mm).toString().padStart(2, '0'),
            ss: this.validateValue('ss', this.props.ss).toString().padStart(2, '0')
        }
        this.sendValue(data);
    }

    sendValue = (data) => {
        this.props.onChange(data);
    }

    validateValue = (name, value) => {
        if (name === 'hh' && value < 1)
            return 1;
        else if (name !== 'hh' && value < 0)
            return 0;
        else if (name === 'hh' && value > 12)
            return 12;
        else if (name !== 'hh' && value > 59)
            return 59;

        return value;
    }

    handleChange = (e) => {
        let name = e.target.dataset.name;
        let value = e.target.value;

        if (isNaN(value))
            return;

        let validValue = this.validateValue(name, parseInt(value) || 0);

        if (name === 'hh' && (value === '0' || value === '' || value === '00') && validValue === 1)
            validValue = 0;

        if (value.startsWith('0') && validValue < 10 && validValue !== 0) {
            validValue = validValue.toString().padStart(2, '0');
        }

        this.sendValue({[name]: value !== '' ? validValue.toString() : ''});
    }

    handleKeyDown = (e) => {
        if (e.keyCode !== 38 && e.keyCode !== 40)
            return;

        let name = e.target.dataset.name;
        let value = parseInt(e.target.value) || 0;

        if (e.keyCode === 38) {
            value++;
        } else if (e.keyCode === 40) {
            value--;
        }

        this.sendValue({[name]: this.validateValue(name, value).toString().padStart(2, '0')});
    }

    handleSpin = (name, type) => {
        let value = this.props[name];

        if (name === 'ampm') {
            value = value === 'am' ? 'pm': 'am';
        } else {
            value = parseInt(value) || 0;
            if (type === 'up') {
                value++;
            } else {
                value--;
            }
            value = this.validateValue(name, value).toString().padStart(2, '0');
        }

        this.sendValue({[name]: value});
    }

    handleBlur = (e) => {
        let value = this.validateValue(e.target.dataset.name, parseInt(e.target.value) || 0);

        if (value < 10) {
            this.sendValue({[e.target.dataset.name]: value.toString().padStart(2, '0')});
        }
    }

    render() {
        return (
            <div className="rjf-time-picker">
                <div className="rjf-time-picker-row rjf-time-picker-labels">
                    <div className="rjf-time-picker-col">Hrs</div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col">Min</div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col">Sec</div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col">am/pm</div>
                </div>

                <div className="rjf-time-picker-row">
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('hh', 'up')}><Icon name="chevron-up"/></Button></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('mm', 'up')}><Icon name="chevron-up"/></Button></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('ss', 'up')}><Icon name="chevron-up"/></Button></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('ampm', 'up')}><Icon name="chevron-up"/></Button></div> 
                </div>

                <div className="rjf-time-picker-row rjf-time-picker-values">
                    <div className="rjf-time-picker-col"><input type="text" data-name="hh" value={this.props.hh} onChange={this.handleChange} onBlur={this.handleBlur} onKeyDown={this.handleKeyDown} /></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm">:</div>
                    <div className="rjf-time-picker-col"><input type="text" data-name="mm" value={this.props.mm} onChange={this.handleChange} onBlur={this.handleBlur} onKeyDown={this.handleKeyDown} /></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm">:</div>
                    <div className="rjf-time-picker-col"><input type="text" data-name="ss" value={this.props.ss} onChange={this.handleChange} onBlur={this.handleBlur} onKeyDown={this.handleKeyDown} /></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col">{this.props.ampm}</div>
                </div>

                <div className="rjf-time-picker-row">
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('hh', 'down')}><Icon name="chevron-down"/></Button></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('mm', 'down')}><Icon name="chevron-down"/></Button></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('ss', 'down')}><Icon name="chevron-down"/></Button></div>
                    <div className="rjf-time-picker-col rjf-time-picker-col-sm"></div>
                    <div className="rjf-time-picker-col"><Button onClick={() => this.handleSpin('ampm', 'down')}><Icon name="chevron-down"/></Button></div> 
                </div>
            </div>
        );
    }
}
