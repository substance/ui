var Substance = require("substance");
var Document = Substance.Document;
var _ = require("substance/helpers");

var ToolManager = require("substance").Surface.ToolManager;
var Highlight = require("../text_property").Highlight;
var ExtensionManager = require("../extension_manager");

var coreTools = require("./tools");


// Mixin with helpers to implement a ReaderController
// ----------------

function WriterController() {}

WriterController.Prototype = function() {

  this.getDocument = function() {
    throw new Error('Contract: A Writer must implement getDocument()');
  };

  this.getWriterState = function() {
    throw new Error('Contract: A Writer must implement getWriterState()');
  };

  // Internal Methods
  // ----------------------

  this._initializeController = function(doc, config) {
    
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
  };

  this._transactionStarted = function(tx) {
    // store the state so that it can be recovered when undo/redo
    tx.before.state = this.state;
    tx.before.selection = this.getSelection();
    if (this.activeSurface) {
      tx.before.surfaceName = this.activeSurface.name;
    }
  };

  this._onDocumentChanged = function(change, info) {

  };

  this._onSelectionChanged = function(sel) {
    // var modules = this.getModules();
    this.extensionManager.handleSelectionChange(sel);
    // Notify all registered tools about the selection change (if enabled)
    this.toolManager.updateTools(sel, this.getSurface());
  };

  // Surface related
  // ----------------------

  this.registerSurface = function(surface, name, options) {
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
  };

  this.unregisterSurface = function(surface) {
    Substance.each(this.surfaces, function(s, name) {
      if (surface === s) {
        delete this.surfaces[name];
      }
    }, this);
    surface.disconnect(this);
  };

  this.updateSurface = function(surface) {
    this.activeSurface = surface;
  };

  this.getSurface = function() {
    return this.activeSurface;
  };

  this.getSelection = function() {
    if (!this.activeSurface) return Document.nullSelection;
    return this.activeSurface.getSelection();
  };

  // Checks based on the surface registry if a certain tool is enabled
  this.isToolEnabled = function(toolName) {
    var activeSurface = this.getSurface();
    var enabledTools = activeSurface.enabledTools;
    return _.includes(enabledTools, toolName);
  };


  this.getPanels = function() {
    return this.extensionManager.getPanels();
  };

  this.getActivePanelElement = function() {
    return this.extensionManager.getActivePanelElement();
  };

  // Get all available tools from core and extensions
  this.getTools = function() {
    return coreTools.concat(this.extensionManager.getTools());
  };

  this.getActiveContainerAnnotations = function() {
    return this.extensionManager.getActiveContainerAnnotations();
  };

  this.getHighlightedNodes = function() {
    return this.extensionManager.getHighlightedNodes();
  };

  // This belongs to container annotations
  // A higlight is a container annotations fragment
  this.getHighlightsForTextProperty = function(textProperty) {
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
  };

};


Substance.initClass(WriterController);
module.exports = WriterController;
