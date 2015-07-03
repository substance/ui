var Substance = require('substance');
var _ = require('substance/helpers');
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

  shouldComponentUpdate: function() {
    var textAnnotations = _.pluck(this.getAnnotations(), 'id');
    var textHighlights = _.intersection(textAnnotations, this.getHighlights());
    var shouldUpdate = true;
    if (this._prevTextAnnotations) {
      if (_.isEqual(textAnnotations, this._prevTextAnnotations) &&
          _.isEqual(textHighlights, this._prevTextHighlights)) {
        shouldUpdate = false;
      }
    }
    // Remember so we can check the next update
    this._prevTextAnnotations = textAnnotations;
    this._prevTextHighlights = textHighlights;
    return shouldUpdate;
  },

  componentDidMount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').add(this.props.path, this, this.textPropertyDidChange);
  },

  componentWillUnmount: function() {
    var doc = this.props.doc;
    doc.getEventProxy('path').remove(this.props.path, this);
  },

  render: function() {
    return $$((this.props.tagName || 'span'), {
      className: "text-property " + (this.props.className || ""),
      spellCheck: false,
      style: {
        whiteSpace: "pre-wrap"
      },
      "data-path": this.props.path.join('.')
    }, this.renderChildren());
  },

  renderChildren: function() {
    var componentRegistry = this.context.componentRegistry;
    var doc = this.getDocument();
    var path = this.getPath();
    var text = doc.get(path) || "";
    var annotations = this.getAnnotations();
    var highlightedAnnotations = [];
    if (this.context.getHighlightedNodes) {
      this.context.getHighlightedNodes();
    }
    var annotator = new Annotator();
    var fragmentCounters = {};
    // for debugging
    // var _level = 0;
    // var _logIndent = function(level) {
    //   var prefix = "";
    //   for (var i = 0; i < level; i++) {
    //     prefix = prefix.concat("  ");
    //   }
    //   return prefix;
    // };
    // var _logPrefix = "";
    annotator.onText = function(context, text) {
      // console.log(_logPrefix+text);
      context.children.push(text);
    };
    annotator.onEnter = function(entry) {
      // for debugging
      // _logPrefix = _logIndent(++_level);
      var node = entry.node;
      var id = node.id;
      if (!fragmentCounters[id]) {
        fragmentCounters[id] = 0;
      }
      fragmentCounters[id] = fragmentCounters[id]+1;
      var key = id + "_" + fragmentCounters[id];
      // for debugging
      // console.log(_logPrefix+"<"+node.type+" key="+key+">");

      var hightlighted = (highlightedAnnotations.indexOf(node.id) >= 0);
      // TODO: we need a component factory, so that we can create the appropriate component
      var ViewClass;

      if (componentRegistry.contains(node.type)) {
        ViewClass = componentRegistry.get(node.type);
      } else {
        ViewClass = AnnotationComponent;
      }

      var classNames = [];
      if (hightlighted) {
        classNames.push('active');
      }
      return {
        ViewClass: ViewClass,
        props: {
          key: key,
          doc: doc,
          node: node,
          classNames: classNames,
        },
        children: []
      };
    };
    annotator.onExit = function(entry, context, parentContext) {
      // for debugging
      // _logPrefix = _logIndent(_level--);
      // console.log(_logPrefix+"</"+entry.node.type+">");
      var args = [context.ViewClass, context.props].concat(context.children);
      var view = $$.apply(React, args);
      parentContext.children.push(view);
    };
    var root = { children: [] };
    annotator.start(root, text, annotations);
    // NOTE: this is particularly necessary for text-properties of
    // block level text nodes. Otherwise, the element will not y-expand
    // as desired, and soft-breaks are not visible.
    // TODO: sometimes we do not want to do this. Make it configurable.
    root.children.push($$('br', {key : 'br'}));
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

  textPropertyDidChange: function() {
    this.forceUpdate();
  },

  getContainer: function() {
    return this.getSurface().getContainer();
  },

  getDocument: function() {
    return this.props.doc;
  },

  getPath: function() {
    return this.props.path;
  },

  getElement: function() {
    return React.findDOMNode(this);
  },

  getSurface: function() {
    return this.context.surface;
  },

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
