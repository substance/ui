var Substance = require('substance');
var $$ = React.createElement;
var TextProperty = Substance.Surface.TextProperty;
var Annotator = Substance.Document.Annotator;
var AnnotationComponent = require('./annotation_component');


// TextPropertyComponent
// ----------------
//

var TextPropertyComponent = React.createClass(Substance.extend({}, TextProperty.prototype, {
  displayName: "TextProperty",

  contextTypes: {
    surface: React.PropTypes.object.isRequired,
    componentRegistry: React.PropTypes.object.isRequired,
    getHighlightedNodes: React.PropTypes.func.isRequired,
    getHighlightsForTextProperty: React.PropTypes.func.isRequired
  },

  getInitialState: function() {
    return { highlights: [] };
  },

  // Really?
  shouldComponentUpdate: function() {
    this.renderManually();
    this.updateHighlights();
    return false;
  },

  componentDidMount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').add(this.props.path, this, this.textPropertyDidChange);
    // HACK: a guard so that we do not render manually when this is unmounted
    this.__mounted__ = true;
    // Note: even if we don't need to render in surfaces with container (~two-pass rendering)
    // we still need to render this in the context of fornm-editors.
    this.renderManually();
  },

  componentWillUnmount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').remove(this.props.path, this);
    this.__mounted__ = false;
  },

  render: function() {
    return $$((this.props.tagName || 'span'), {
      className: "text-property " + (this.props.className || ""),
      // contentEditable: true,
      spellCheck: false,
      style: {
        whiteSpace: "pre-wrap"
      },
      "data-path": this.props.path.join('.')
    });
  },

  renderManually: function() {
    // HACK: it happened that this is called even after this component had been mounted.
    // We need to track these situations and fix them in the right place.
    // However, we leave it here for a while to increase stability,
    // as these occasions are not critical for the overall functionality.
    if(!this.__mounted__) {
      console.warn('Tried to render an unmounted TextPropertyComponent.');
      return;
    }
    this.renderContent();
    this.updateHighlights();
  },

  renderContent: function() {
    var domNode = this.getDOMNode();
    if (!domNode) { return; }
    React.render($$("span", null, this.renderChildren()), domNode);
  },

  renderChildren: function() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";
    var annotations = this.getAnnotations();
    var annotator = new Annotator();
    annotator.onText = function(context, text) {
      context.children.push(text);
    };
    annotator.onEnter = function(entry) {
      var node = entry.node;
      // TODO: we need a component factory, so that we can create the appropriate component
      var ViewClass = componentRegistry.get(node.type) || AnnotationComponent;
      var classNames = [];
      return {
        ViewClass: ViewClass,
        props: {
          doc: doc,
          node: node,
          classNames: classNames,
        },
        children: []
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      var view = $$(context.ViewClass, context.props, context.children);
      parentContext.children.push(view);
    };
    var root = { children: [] };
    annotator.start(root, text, annotations);
    return root.children;
  },

  getAnnotations: function() {
    var doc = this.props.doc;
    var surface = this.context.surface;
    var path = this.props.path;
    var annotations = doc.getIndex('annotations').get(path);

    var containerName = surface.getContainerName();
    if (containerName) {
      var anchors = doc.getIndex('container-annotations').get(path, containerName);
      annotations = annotations.concat(anchors);
    }

    var highlights = this.context.getHighlightsForTextProperty(this);
    annotations = annotations.concat(highlights);

    return annotations;
  },

  // Annotations that are active (not just visible)
  // The ones that have will get an .active class
  getHighlights: function() {
    return this.context.getHighlightedNodes();
  },

  updateHighlights: function() {
    if (!this.context.getHighlightedNodes) return;
    var highlightedAnnotations = this.context.getHighlightedNodes();
    var domNode = this.getDOMNode();
    var els = $(domNode).find('.annotation, .container-annotation');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var activate = highlightedAnnotations.indexOf(el.dataset.id) >= 0;
      if (activate) {
        $(el).addClass('active');
      } else {
        $(el).removeClass('active');
      }
    }
  },

  _rerenderAndRecoverSelection: function() {
    this.renderManually();
    this.context.surface.rerenderDomSelection();
  },

  textPropertyDidChange: function() {
    this.renderManually();
  },

  getContainer: function() {
    return this.context.surface.getContainer();
  },

  getDocument: function() {
    return this.props.doc;
  },

  getPath: function() {
    return this.props.path;
  },

  getElement: function() {
    return this.getDOMNode();
  }
}));

TextPropertyComponent.Highlight = function(path, startOffset, endOffset, options) {
  options = options || {};
  this.id = options.id;
  this.path = path;
  this.startOffset = startOffset;
  this.endOffset = endOffset;
  this.classNames = options.classNames;
};

Substance.initClass(TextPropertyComponent.Highlight);

TextPropertyComponent.Highlight.prototype.getClassNames = function() {
  return this.classNames;
};

TextPropertyComponent.Highlight.static.level = Number.MAX_VALUE;

module.exports = TextPropertyComponent;