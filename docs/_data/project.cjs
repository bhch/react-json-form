var pjson = require('../../package.json');


module.exports = function() {
    return {
        node_env: process.env.NODE_ENV || 'development',
        version: pjson.version,
        title: 'React JSON Form',
        name: pjson.name,
        url: 'https://bhch.github.io/react-json-form/',
        github: pjson.repository.url.replace('.git', ''),
        topNav: [
            {title: 'Home', url: '/'},
            {title: 'Docs', url: '/docs/', isBase: true},
            {title: 'Install', url: '/docs/install/', className: 'd-sm-none'},
            {title: 'Using in Node', url: '/docs/usage/node/', className: 'd-sm-none'},
            {title: 'Using in Browser', url: '/docs/usage/browser/', className: 'd-sm-none'},
            {title: 'Schema', url: '/docs/schema/', className: 'd-sm-none'},
            {title: 'Developing', url: '/docs/developing/', className: 'd-sm-none'},
            {title: 'Playground', url: '/playground/'},
            {title: 'Github', url: pjson.repository.url.replace('.git', ''), icon: 'github'},
        ],
        footerNav: [
            {title: 'View on Github', url: pjson.repository.url.replace('.git', ''), icon: 'github'},
        ],
    };
};
