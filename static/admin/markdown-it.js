(function () {
  'use strict';

  if (!window.CMS || !window.markdownit || !window.markdownitFootnote) {
    console.error('The Markdown editor dependencies could not be loaded.');
    return;
  }

  var textField = CMS.getFieldType('text');

  if (!textField) {
    console.error('The built-in text field is unavailable.');
    return;
  }

  var renderer = window
    .markdownit({
      html: false,
      linkify: true,
      typographer: true,
    })
    .use(window.markdownitFootnote);

  var MarkdownControl = createClass({
    render: function () {
      return h(textField.control, this.props);
    },
  });

  var MarkdownPreview = createClass({
    render: function () {
      return h('div', {
        className: 'markdown-body',
        dangerouslySetInnerHTML: {
          __html: renderer.render(this.props.value || ''),
        },
      });
    },
  });

  CMS.registerFieldType('markdown-it', MarkdownControl, MarkdownPreview);
})();
