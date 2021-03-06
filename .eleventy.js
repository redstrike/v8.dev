// Copyright 2018 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// <https://apache.org/licenses/LICENSE-2.0>.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { DateTime } = require('luxon');
const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItFootnote = require('markdown-it-footnote');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');

const markdownItConfig = {
  html: true,
  breaks: true,
  linkify: true,
};
const markdownItAnchorConfig = {
  permalink: true,
  permalinkClass: 'bookmark',
  permalinkSymbol: '#',
};

const md = markdownIt(markdownItConfig)
  .use(markdownItFootnote)
  .use(markdownItAnchor, markdownItAnchorConfig);

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);

  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');

  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('dd LLLL yyyy');
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter('markdown', (string) => {
    return md.renderInline(string);
  });

  // Match Firebase’s `cleanUrls` setting.
  eleventyConfig.addFilter('clean', (path) => {
    if (path === '/') return path;
    if (path === 'https://v8.dev/') return path;
    if (path.endsWith('/')) return path.slice(0, -1);
    return path;
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    return array.slice(0, n);
  });

  // Create a collection for blog posts only.
  eleventyConfig.addCollection('posts', (collection) => {
    return collection.getFilteredByGlob('src/blog/*.md')
                     .sort((a, b) => b.date - a.date);
  });

  // Treat `*.md` files as Markdown.
  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addCollection('tagList', (collection) => {
    const set = new Set();
    for (const item of collection.getAllSorted()) {
      if ('tags' in item.data) {
        const tags = item.data.tags;
        if (typeof tags === 'string') {
          tags = [tags];
        }
        for (const tag of tags) {
          set.add(tag);
        }
      }
    }
    return [...set].sort();
  });

  // Copy assets that don’t require a build step.
  eleventyConfig.addPassthroughCopy('src/.webmanifest');
  eleventyConfig.addPassthroughCopy('src/favicon.ico');
  eleventyConfig.addPassthroughCopy('src/robots.txt');
  eleventyConfig.addPassthroughCopy('src/_img');

  return {
    templateFormats: [
      'md',
      'njk',
      'html',
    ],

    pathPrefix: '/',

    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: 'dist',
    },
  };
};
