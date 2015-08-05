/* global $ */
var $$ = React.createElement;

var Substance = require("substance");
var _ = require("substance/helpers");
var ContentPanel = require("../content_panel");
var ReaderControllerMixin = require("./reader_controller_mixin");
// var ContentTools = require("../content_tools");

// The Substance Reader Component
// ----------------

var ReaderMixin = _.extend({}, Substance.EventEmitter.prototype, ReaderControllerMixin, {

  componentDidMount: function() {
    var domNode = React.findDOMNode(this);
    $(domNode).on('click', '.container-annotation', this.handleReferenceToggle);
    $(domNode).on('click', '.annotation', this.handleReferenceToggle);
  },

  handleReferenceToggle: function(e) {
    e.preventDefault();
    var annotationId = e.currentTarget.dataset.id;
    this.extensionManager.handleAnnotationToggle(annotationId);
  },

  render: function() {
    return $$('div', {className: 'reader-component writer-component', onKeyDown: this.handleApplicationKeyCombos},
      $$('div', {className: "main-container"},
        // $$(ContentTools),
        $$(ContentPanel, {containerId: this.props.contentContainer})
      ),
      $$('div', {className: "resource-container"},
        this.createContextToggles(),
        this.createContextPanel(this)
      )
    );
  },

  // return true when you handled a key combo
  handleApplicationKeyCombos: function(e) {
    console.log('Handle keycombos');
    var handled = false;
    
    if (e.keyCode === 90 && (e.metaKey||e.ctrlKey)) {
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      handled = true;
    }

    // Reset to default state
    if (e.keyCode === 27) {
      this.replaceState(this.getInitialState());
      handled = true;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

// Create React class

var Reader = React.createClass({
  mixins: [ReaderMixin],
  displayName: "Reader",
});

module.exports = Reader;