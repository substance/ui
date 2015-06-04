/* global $ */
var $$ = React.createElement;

var Substance = require("substance");
var _ = require("substance/helpers");
var ContentPanel = require("../content_panel");
var ReaderControllerMixin = require("./reader_controller_mixin");


// The Substance Reader Component
// ----------------

var ReaderMixin = _.extend({}, Substance.EventEmitter.prototype, ReaderControllerMixin, {

  componentDidMount: function() {
    var domNode = this.getDOMNode();

    $(domNode).on('click', '.container-annotation', this.handleReferenceToggle);
    $(domNode).on('click', '.annotation', this.handleReferenceToggle);
  },

  handleReferenceToggle: function(e) {
    e.preventDefault();
    var annotationId = e.currentTarget.dataset.id;
    console.log('yay');
    this.extensionManager.handleAnnotationToggle(annotationId);
  },

  render: function() {
    return $$('div', { className: 'reader-component', onKeyDown: this.handleApplicationKeyCombos},
      $$('div', {className: "main-container"},
        $$(ContentPanel)
      ),
      $$('div', {className: "resource-container"},
        this.createContextToggles(),
        this.createContextPanel(this)
      )
    );
  },

  // return true when you handled a key combo
  handleApplicationKeyCombos: function(e) {
    var handled = false;
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