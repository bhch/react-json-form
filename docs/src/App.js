import React from 'react';
import {Tabs, TabContent} from './tabs.js';


export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTabIndex: this.getActiveTabIndexFromHash() || 0,
        };
    }

    getActiveTabIndexFromHash() {
        if (!window.location.hash)
            return 0;

        try {
            let index = window.location.hash.split('-')[0].split('#')[1];
            if (isNaN(index))
                index = 0;
            else
                index = Number(index);
            return index;
        } catch (error) {
            return 0;
        }
    }

    onTabClick = (index, slug) => {
        window.location.hash = index + '-' + slug;
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
