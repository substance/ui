var Substance = require("substance");
var Document = Substance.Document;
var Selection = Document.Selection;
var _ = require("substance/helpers");

var ToolManager = require("substance").Surface.ToolManager;
var Highlight = require("./text_property").Highlight;
var ExtensionManager = require("./extension_manager");

var $$ = React.createElement;

// Mixin with helpers to implement a DocumentController
// ----------------

var DocumentControllerMixin = {

  getDefaultProps: function() {
    return {
      contentContainer: 'content'
    };
  },

  // Internal Methods
  // ----------------------

  _initializeController: function() {

    // We need to do this manually since we can't call the EventEmitter constructor function
    this.__events__ = {};

    // Initialize doc
    var doc = this.getDocument();

    // For compatibility with extensions which rely on the app.doc instance
    this.doc = doc;

    var config = this.getConfig();

    // Initialize surface registry
    this.surfaces = {};

    doc.connect(this, {
      'transaction:started': this._transactionStarted,
      'document:changed': this._onDocumentChanged
    });

    this.toolManager = new ToolManager(this.doc, {
      isToolEnabled: this.isToolEnabled
    });

    this.extensionManager = new ExtensionManager(config.extensions, this);
  },

  _transactionStarted: function(tx) {
    // store the state so that it can be recovered when undo/redo
    tx.before.state = this.state;
    tx.before.selection = this.getSelection();
    if (this.activeSurface) {
      tx.before.surfaceName = this.activeSurface.name;
    }
  },

  _onDocumentChanged: function(change, info) {
    this.doc.__dirty = true;
    var notifications = this.context.notifications;

    window.myChange = change;

    notifications.addMessage({
      type: "info",
      message: "Unsaved changes"
    });

    // This is the undo/redo case
    if (info.replay) {
      this.replaceState(change.after.state);
      var self = this;
      window.setTimeout(function() {
        if (change.after.surfaceName) {
          var surface = self.surfaces[change.after.surfaceName];
          surface.setSelection(change.after.selection);
        }
      });
    }
  },

  _onSelectionChanged: function(sel) {
    // var modules = this.getModules();
    this.extensionManager.handleSelectionChange(sel);
    // Notify all registered tools about the selection change (if enabled)
    this.toolManager.updateTools(sel, this.getSurface());
  },

  requestSave: function() {
    var doc = this.props.doc;
    var backend = this.context.backend;
    var notifications = this.context.notifications;

    if (doc.__dirty && !doc.__isSaving) {
      notifications.addMessage({
        type: "info",
        message: "Saving ..."
      });

      doc.__isSaving = true;
      backend.saveDocument(doc, function(err) {
        doc.__isSaving = false;
        if (err) {
          notifications.addMessage({
            type: "error",
            message: err.message || err.toString()
          });
        } else {
          doc.emit('document:saved');
          notifications.addMessage({
            type: "info",
            message: "No changes"
          });
          doc.__dirty = false;
        }
      });
    }
  },

  // Surface related
  // ----------------------

  registerSurface: function(surface, name, options) {
    name = name || Substance.uuid();
    options = options || {};
    this.surfaces[name] = surface;
    if (surface.name) {
      throw new Error("Surface has already been attached");
    }
    // HACK: we store a name on the surface for later decision making
    surface.name = name;

    // HACK: we store enabled tools on the surface instance for later lookup
    surface.enabledTools = options.enabledTools || [];

    surface.connect(this, {
      'selection:changed': function(sel) {
        this.updateSurface(surface);
        this._onSelectionChanged(sel);
        this.emit('selection:changed', sel);
      }
    });
  },

  unregisterSurface: function(surface) {
    Substance.each(this.surfaces, function(s, name) {
      if (surface === s) {
        delete this.surfaces[name];
      }
    }, this);
    surface.disconnect(this);
  },

  updateSurface: function(surface) {
    this.activeSurface = surface;
  },

  getSurface: function() {
    return this.activeSurface;
  },

  getSelection: function() {
    if (!this.activeSurface) return Document.nullSelection;
    return this.activeSurface.getSelection();
  },

  // Checks based on the surface registry if a certain tool is enabled
  isToolEnabled: function(toolName) {
    var activeSurface = this.getSurface();
    var enabledTools = activeSurface.enabledTools;
    return _.includes(enabledTools, toolName);
  },

  getPanels: function() {
    return this.extensionManager.getPanels();
  },

  getActivePanelElement: function() {
    return this.extensionManager.getActivePanelElement();
  },

  getActiveContainerAnnotations: function() {
    return this.extensionManager.getActiveContainerAnnotations();
  },

  getHighlightedNodes: function() {
    return this.extensionManager.getHighlightedNodes();
  },

  // This belongs to container annotations
  // A higlight is a container annotations fragment
  getHighlightsForTextProperty: function(textProperty) {
    var doc = this.doc;
    var container = textProperty.getContainer();

    var highlightsIndex = new Substance.PathAdapter.Arrays();
    if (container) {
      var activeContainerAnnotations = this.getActiveContainerAnnotations();

      _.each(activeContainerAnnotations, function(annoId) {
        var anno = doc.get(annoId);
        if (!anno) return;
        var fragments = container.getAnnotationFragments(anno);
        _.each(fragments, function(frag) {
          highlightsIndex.add(frag.path, new Highlight(frag.path, frag.startOffset, frag.endOffset, {
            id: anno.id, classNames: anno.getClassNames().replace(/_/g, "-")+" annotation-fragment"
          }));
        });
      });

      return highlightsIndex.get(textProperty.props.path) || [];
    } else {
      return [];
    }
  },

  deleteAnnotation: function(annotationId) {
    var anno = this.doc.get(annotationId);
    var tx = this.doc.startTransaction({ selection: this.getSelection() });
    tx.delete(annotationId);
    tx.save({ selection: Selection.create(anno.path, anno.startOffset, anno.endOffset) });
  },

  annotate: function(annoSpec) {
    var sel = this.getSelection();
    var path = annoSpec.path;
    var startOffset = annoSpec.startOffset;
    var endOffset = annoSpec.endOffset;

    // Use active selection for retrieving path and range
    if (!path) {
      if (sel.isNull()) throw new Error("Selection is null");
      if (!sel.isPropertySelection()) throw new Error("Selection is not a PropertySelection");
      path = sel.getPath();
      startOffset = sel.getStartOffset();
      endOffset = sel.getEndOffset();
    }

    var annotation = Substance.extend({}, annoSpec);
    annotation.id = annoSpec.id || annoSpec.type+"_" + Substance.uuid();
    annotation.path = path;
    annotation.startOffset = startOffset;
    annotation.endOffset = endOffset;

    // Start the transaction with an initial selection
    var tx = this.doc.startTransaction({ selection: this.getSelection() });
    annotation = tx.create(annotation);
    tx.save({ selection: sel });

    return annotation;
  },

  undo: function() {
    if (this.doc.done.length > 0) {
      this.doc.undo();
    }
  },

  redo: function() {
    if (this.doc.undone.length > 0) {
      this.doc.redo();
    }
  },

  // React.js specific
  // ----------------------

  contextTypes: {
    backend: React.PropTypes.object.isRequired,
    notifications: React.PropTypes.object.isRequired,
    htmlImporter: React.PropTypes.object.isRequired,
    htmlExporter: React.PropTypes.object.isRequired
  },

  childContextTypes: {
    // used by text properties to render 'active' annotations
    // For active container annotations annotation fragments are inserted
    // which can be used to highlight the associated range
    app: React.PropTypes.object,
    getHighlightedNodes: React.PropTypes.func,
    getHighlightsForTextProperty: React.PropTypes.func
  },

  getChildContext: function() {
    var context = {
      app: this,
      getHighlightedNodes: this.getHighlightedNodes,
      getHighlightsForTextProperty: this.getHighlightsForTextProperty,
    };
    return context;
  },

  getInitialState: function() {
    return {"contextId": "toc"};
  },

  // Internal methods
  // ----------------

  getDocument: function() {
    return this.props.doc;
  },

  getConfig: function() {
    return this.props.config;
  },

  // Events
  // ----------------

  componentWillMount: function() {
    this._initializeController();
  },

  componentWillUnmount: function() {
    this.clipboard.detach(this.getDOMNode());
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    var sprevState = JSON.stringify(this.state);
    var snextState = JSON.stringify(nextState);
    if (Substance.isEqual(sprevState, snextState)) {
      console.log('skipped update');
      return false;
    }
    return true;
  },

  componentDidMount: function() {
    // if (!window.devMode) {
    //   setInterval(function() {
    //     this.requestAutoSave();
    //   }.bind(this), 10000);
    // }
    var rootElement = this.getDOMNode();
    var $clipboard = $(rootElement).find('.clipboard');
    this.clipboard = new Substance.Surface.Clipboard(this, $clipboard[0],
      this.context.htmlImporter, this.context.htmlExporter);
    this.clipboard.attach(rootElement);
  },


  // E.g. when a tool requests a context switch
  handleContextSwitch: function(contextId) {
    this.replaceState({
      contextId: contextId
    });
  },

  handleCloseDialog: function(e) {
    e.preventDefault();
    console.log('handling close');
    this.replaceState(this.getInitialState());
  },

  // Triggered by Writer UI
  handleContextToggle: function(e) {
    e.preventDefault();
    var newContext = $(e.currentTarget).attr("data-id");
    this.handleContextSwitch(newContext);
  },

  // Rendering
  // ----------------

  // Toggles for explicitly switching between context panels
  createContextToggles: function() {
    var panels = this.getPanels();

    var contextId = this.state.contextId;
    var self = this;

    var panelComps = panels.map(function(panelClass) {
      // We don't show inactive stuff here
      if (panelClass.isDialog && panelClass.contextId !== contextId) return null;

      var className = ["toggle-context"];
      if (panelClass.contextId === contextId) {
        className.push("active");
      }

      if (panelClass.isDialog) {
        return $$('div');
      } else {
        return $$('a', {
          className: className.join(" "),
          href: "#",
          key: panelClass.contextId,
          "data-id": panelClass.contextId,
          onClick: self.handleContextToggle,
          dangerouslySetInnerHTML: {__html: '<i class="fa '+panelClass.icon+'"></i> <span class="label">'+panelClass.displayName+'</span>'}
        });
      }
    });

    return $$('div', {className: "context-toggles"},
      Substance.compact(panelComps)
    );
  },

  // Create a new panel based on current writer state (contextId)
  createContextPanel: function() {
    var panelElement = this.getActivePanelElement();
    if (!panelElement) {
      return $$('div', null, "No panels are registered");
    }
    return panelElement;
  }

};


module.exports = DocumentControllerMixin;
