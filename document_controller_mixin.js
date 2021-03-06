var Substance = require("substance");
var _ = require("substance/helpers");
var Highlight = require("./text_property").Highlight;
var ExtensionManager = require("./extension_manager");
var Modal = require("./modal");

var Document = Substance.Document;
var Selection = Document.Selection;
var Surface = Substance.Surface;
var Clipboard = Surface.Clipboard;
var SurfaceManager = Surface.SurfaceManager;

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

    this._onSelectionChangedDebounced = _.debounce(this._onSelectionChanged, 50);

    // Note: we are treating basics as extension internally
    var basics = {
      name: "_basics",
      components: config.components || {},
      stateHandlers: config.stateHandlers || {},
      tools: config.tools || []
    };
    var extensions = [basics];
    if (config.extensions) {
      extensions = extensions.concat(config.extensions);
    }

    this.extensionManager = new ExtensionManager(extensions, this);

    var componentRegistry = new Substance.Registry();
    _.each(extensions, function(extension) {
      _.each(extension.components, function(ComponentClass, name) {
        componentRegistry.add(name, ComponentClass);
      });
    });
    this.componentRegistry = componentRegistry;

    var toolRegistry = new Substance.Surface.ToolRegistry();
    _.each(extensions, function(extension) {
      _.each(extension.tools, function(ToolClass, name) {
        // WARN: this could potentially get problematic, if React derives
        // the current context differently.
        var context = _.extend({}, this.context, this.getChildContext());
        toolRegistry.add(name, new ToolClass(context));
      }, this);
    }, this);
    this.toolRegistry = toolRegistry;

    this.surfaceManager = new SurfaceManager(doc);
    this.clipboard = new Clipboard(this.surfaceManager, this.doc.getClipboardImporter(), this.doc.getClipboardExporter());
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
    notifications.addMessage({
      type: "info",
      message: "Unsaved changes"
    });
    // This is the undo/redo case
    if (info.replay) {
      this.replaceState(change.after.state);
    }
  },

  _onSelectionChanged: function(sel, surface) {
    this.updateSurface(surface);
    // var modules = this.getModules();
    this.extensionManager.handleSelectionChange(sel);
    this.toolRegistry.each(function(tool) {
      // console.log('Updating tool', tool.constructor.static.name, surface, sel);
      tool.update(surface, sel);
    }, this);
    this.emit('selection:changed', sel);
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

  registerSurface: function(surface, options) {
    options = options || {};
    var name = surface.getName();
    this.surfaces[name] = surface;
    // HACK: we store enabled tools on the surface instance for later lookup
    surface.enabledTools = options.enabledTools || [];

    surface.connect(this, {
      'selection:changed': this._onSelectionChangedDebounced
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

  executeAction: function(actionName) {
    return this.extensionManager.handleAction(actionName);
  },

  closeModal: function() {
    var newState = _.cloneDeep(this.state);
    delete newState.modal;
    this.replaceState(newState);
  },


  _panelPropsFromState: function (state) {
    var props = _.omit(state, 'contextId');
    props.doc = this.doc;
    // Legacy: panels should only access the app using this.context.app
    props.app = this;
    return props;
  },



  getActiveModalPanelElement: function() {
    var state = this.state;

    if (state.modal) {
      var modalPanelComponent = this.componentRegistry.get(state.modal.contextId);
      if (modalPanelComponent) {
        return $$(modalPanelComponent, this._panelPropsFromState(state.modal));
      } else {
        console.warn("Could not find component for contextId:", state.modal.contextId);
      }
    }
  },

  getActiveContainerAnnotations: function() {
    return this.extensionManager.getActiveContainerAnnotations();
  },

  getHighlightedNodes: function() {
    return this.extensionManager.getHighlightedNodes();
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
  },

  childContextTypes: {
    // used by text properties to render 'active' annotations
    // For active container annotations annotation fragments are inserted
    // which can be used to highlight the associated range
    doc: React.PropTypes.object,
    app: React.PropTypes.object,
    getHighlightedNodes: React.PropTypes.func,
    getHighlightsForTextProperty: React.PropTypes.func,
    componentRegistry: React.PropTypes.object,
    toolRegistry: React.PropTypes.object,
    surfaceManager: React.PropTypes.object,
  },

  getChildContext: function() {
    var context = {
      app: this,
      doc: this.doc,
      getHighlightedNodes: this.getHighlightedNodes,
      getHighlightsForTextProperty: this.getHighlightsForTextProperty,
      componentRegistry: this.componentRegistry,
      toolRegistry: this.toolRegistry,
      surfaceManager: this.surfaceManager
    };
    return context;
  },

  getInitialState: function() {
    // var defaultContextId = this.props.contextId;
    // return {"contextId": defaultContextId || "toc"};

    var initState = this.getStateFromRoute(this.props.route);
    return initState;
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
    this.extensionManager.handleStateChange(this.state);
  },

  componentWillUnmount: function() {
    // some tools might need to get disposed
    this.toolRegistry.dispose();
    this.clipboard.detach(React.findDOMNode(this));
    this.surfaceManager.dispose();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    var sprevState = JSON.stringify(this.state);
    var snextState = JSON.stringify(nextState);
    if (Substance.isEqual(sprevState, snextState)) {
      return false;
    }
    return true;
  },

  componentWillUpdate: function(nextProps, nextState) {
    var oldState = this.state;
    this.extensionManager.handleStateChange(nextState, oldState);

    var route = this.getRouteFromState(nextState);
    window.history.replaceState({} , '', '#'+route);
  },

  componentDidMount: function() {
    if (!window.devMode) {
      setInterval(function() {
        this.requestSave();
      }.bind(this), 30000);
    }
    var rootElement = React.findDOMNode(this);
    this.clipboard.attach(rootElement);
  },

  handleAction: function(actionName) {
    this.extensionManager.handleAction(actionName);
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
    var panelOrder = this.props.config.panelOrder;
    var contextId = this.state.contextId;
    var toggleComps = [];

    _.each(panelOrder, function(panelId) {
      var panelClass = this.componentRegistry.get(panelId);
      var className = ["toggle-context"];
      if (panelClass.contextId === contextId) {
        className.push("active");
      }

      toggleComps.push($$('a', {
        className: className.join(" "),
        href: "#",
        key: panelClass.contextId,
        "data-id": panelClass.contextId,
        onClick: this.handleContextToggle,
        dangerouslySetInnerHTML: {__html: '<i class="fa '+panelClass.icon+'"></i> <span class="label">'+panelClass.displayName+'</span>'}
      }));
    }, this);

    return $$('div', {className: "context-toggles"}, toggleComps);
  },

  createModalPanel: function() {
    var modalPanelElement = this.getActiveModalPanelElement();
    if (!modalPanelElement) {
      // Just render an empty div if no modal active available
      return $$('div');
    }
    return $$(Modal, {
      panelElement: modalPanelElement
    });
  },


  getPanelElement: function(panelName) {
    var panelComponent = this.componentRegistry.get(panelName);

    if (panelComponent) {
      return $$(panelComponent, this._panelPropsFromState(this.state));
    } else {
      console.warn("Could not find component for contextId:", this.state.contextId);
    }
  },

  // Create a new panel based on current writer state (contextId)
  createContextPanel: function() {
    var contextId = this.state.contextId;
    // Iterate over all available panels and show persistent ones and currently active ones

    // var persistentPanels = this.getPersistentPanels();
    var panelOrder = this.props.config.panelOrder;
    var panelEls = [];

    // TODO: we need to ensure persistent panels come first, so when a state switch happens the 
    // markup does not change for those
    _.each(panelOrder, function(panelName) {
      // Get panel component
      var panelComponent = this.componentRegistry.get(panelName);
      if (panelComponent.persistent || panelComponent.contextId === contextId) {
        panelEls.push($$(panelComponent, this._panelPropsFromState(this.state)));
      }
    }, this);

    // Check for dialog panels also
    if (panelEls.length === 0) {
      var panelComponent = this.componentRegistry.get(contextId);
      if (panelComponent) {
        panelEls.push($$(panelComponent, this._panelPropsFromState(this.state)));  
      }
    }


    if (panelEls.length === 0) {
      console.warn("Could not find component for contextId:", contextId);
    }

    return $$('div', {className: 'panels '+contextId}, panelEls);
  },


  getStateFromRoute: function(route) {
    var defaultContextId = this.props.contextId;
    var state = {};

    if (route) {
      var parts = route.split(";");
      _.each(parts, function(part) {
        var keyVal = part.split("=");

        var stateValue;
        try {
          var decodedString =  window.decodeURIComponent(keyVal[1]);
          stateValue = JSON.parse(decodedString);
        } catch(e) {
          stateValue = keyVal[1];
        }
        
        state[keyVal[0]] = stateValue; // keyVal[1];
      });      
    } else {
      state.contextId = defaultContextId || "toc";
    }
    return state;
  },

  getRouteFromState: function(state) {
    var routeParts = [];
    _.each(state, function(value, key) {
      // Serialize as JSON
      if (typeof value === 'object') {
        // console.log('###', value);
        value = window.encodeURIComponent(JSON.stringify(value));

      }
      routeParts.push([key, value].join("="));
    });

    return routeParts.join(";");
  }

};


module.exports = DocumentControllerMixin;
