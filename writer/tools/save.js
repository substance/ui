var Substance = require('substance');

var SaveTool = Substance.Surface.Tool.extend({

  name: "save",

  init: function(props) {
    this.app = props.app;
    this.doc = props.doc;
    this.doc.connect(this, {
      'document:changed': this.handleDocumentChange,
      'document:saved': this.handleDocumentSaved
    });
  },

  dispose: function() {
    this.doc.disconnect(this);
  },

  handleDocumentChange: function() {
    this.setEnabled();
  },

  handleDocumentSaved: function() {
    this.setDisabled();
  },

  performAction: function() {
    this.app.requestSave();
  },

});

module.exports = SaveTool;
