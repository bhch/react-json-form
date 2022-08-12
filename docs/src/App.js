import React from 'react';
import {Tabs, TabContent} from './tabs.js';


export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTabIndex: 0,
        };
    }

    onTabClick = (index) => {
        this.setState({activeTabIndex: index});
    }

    render() {
        return (
            <div className="playground">
                <Tabs
                    activeTabIndex={this.state.activeTabIndex}
                    onClick={this.onTabClick}
                />

                <TabContent
                    activeTabIndex={this.state.activeTabIndex}
                />
            </div>
        );
    }
}
