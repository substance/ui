'use strict';

var Substance = require('substance');
var $$ = React.createElement;
var Surface = Substance.Surface;
var _ = require("substance/helpers");

var HtmlArticle = require("./html_article");
var ContainerEditor = Surface.ContainerEditor;

var Clipboard = Surface.Clipboard;
var SurfaceManager = Surface.SurfaceManager;
var ToolComponent = require('substance-ui/tool_component');
var TextToolComponent = require('substance-ui/text_tool_component');
var BodyContainer = require('./body_container');

var components = {
  "paragraph": require('substance-ui/paragraph_component'),
  "heading": require('substance-ui/heading_component')
};

var tools = Surface.Tools;

// HtmlEditor
// ----------------
// 
// A simple rich text editor implementation based on Substance

class HtmlEditor extends React.Component {

  computeStateFromProps(props) {
    var doc = HtmlArticle.fromHtml(props.content);

    var surfaceManager = new SurfaceManager(doc);
    var clipboard = new Clipboard(surfaceManager, doc.getClipboardImporter(), doc.getClipboardExporter());
    var editor = new ContainerEditor('body');
    var surface = new Surface(surfaceManager, doc, editor);

    var debouncedOnContentChanged;

    if (props.onContentChanged) {
      debouncedOnContentChanged = _.debounce(props.onContentChanged, 1000);
    }

    return {
      doc: doc,
      surfaceManager: surfaceManager,
      clipboard: clipboard,
      editor: editor,
      surface: surface,
      debouncedOnContentChanged: debouncedOnContentChanged
    };
  }

  initializeComponent() {
    // We may have already initialized the stuff
    var doc = this.state.doc;
    var surfaceManager = this.state.surfaceManager;
    var surface = this.state.surface;
    var clipboard = this.state.clipboard;
    var bodyContainerEl = React.findDOMNode(this.refs.bodyContainer);


    surfaceManager.registerSurface(surface, {
      enabledTools: this.props.enabledTools
    });

    surface.attach(bodyContainerEl);
    surface.connect(this, {
      'selection:changed': this.onSelectionChanged
    });

    clipboard.attach(React.findDOMNode(this));

    // Needed?
    // this.forceUpdate(function() {
    //   this.surface.rerenderDomSelection();
    // }.bind(this));
  }

  constructor(props) {
    super(props);

    // Component registry
    this.componentRegistry = new Substance.Registry();
    _.each(components, function(ComponentClass, name) {
      this.componentRegistry.add(name, ComponentClass);
    }, this);

    // Tool registry
    this.toolRegistry = new Substance.Registry();
    _.each(tools, function(ToolClass) {
      this.toolRegistry.add(ToolClass.static.name, new ToolClass());
    }, this);
  }

  // Lifecycle
  // -------------

  // Creation

  componentWillMount() {
    this.setState(this.computeStateFromProps(this.props));
  }

  componentDidMount() {
    this.initializeComponent();
  }

  // Updating

  componentWillReceiveProps(nextProps) {
    this.dispose(); // clean up before setting up new state
    this.setState(this.computeStateFromProps(nextProps));
  }

  // a new doc has arrived
  componentDidUpdate() {
    this.initializeComponent();
  }

  getContent() {
    return this.state.doc.toHtml();
  }

  onSelectionChanged(sel, surface) {
    this.toolRegistry.each(function(tool) {
      tool.update(surface, sel);
    }, this);
  }

  getChildContext() {
    return {
      surface: this.state.surface,
      componentRegistry: this.componentRegistry,
      toolRegistry: this.toolRegistry
    };
  }

  render() {
    var doc = this.state.doc;

    return $$('div', {className: 'editor-component'},
      this.props.toolbar ? $$(this.props.toolbar) : $$('div'),
      $$(BodyContainer, {
        ref: 'bodyContainer',
        doc: doc
      })
    );
  }

  componentWillUnmount() {
    this.dispose();
  }

  dispose() {
    var surface = this.state.surface;
    var clipboard = this.state.clipboard;
    var surfaceManager = this.state.surfaceManager;

    if (surface) {
      surface.disconnect(this);
      surface.dispose();
    }
    if (clipboard) clipboard.detach(React.findDOMNode(this));
    if (surfaceManager) surfaceManager.dispose();
  }
}

HtmlEditor.displayName = "HtmlEditor";

// child context signature provided to editor components
HtmlEditor.childContextTypes = {
  surface: React.PropTypes.object,
  componentRegistry: React.PropTypes.object,
  toolRegistry: React.PropTypes.object
};


// Expose some more useful components
HtmlEditor.ToolComponent = ToolComponent;
HtmlEditor.TextToolComponent = TextToolComponent;

module.exports = HtmlEditor;