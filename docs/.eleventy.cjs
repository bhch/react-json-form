const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy('static');
    eleventyConfig.addPassthroughCopy('apple-touch-icon.png');
    eleventyConfig.addPassthroughCopy('favicon.ico');

    eleventyConfig.addPlugin(syntaxHighlight);

    eleventyConfig.setLibrary(
        'md',
        markdownIt({html: true}).use(markdownItAnchor, {
            permalink: markdownItAnchor.permalink.linkInsideHeader()
        })
    );

    eleventyConfig.addLiquidFilter('navLinkIsActive', function(item, pageUrl) {
        if (item.isBase && item.url !== '/')
            return pageUrl.startsWith(item.url);
        return item.url === pageUrl;
    });

    return {
        pathPrefix: '/react-json-form/'
    };
};
