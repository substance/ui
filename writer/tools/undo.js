var Substance = require('substance');

var UndoTool = Substance.Surface.Tool.extend({

  name: "undo",

  update: function(surface) {
    this.surface = surface;
    var doc = surface.getDocument();
    if (!surface.isEnabled() || doc.done.length===0) {
      this.setDisabled();
    } else {
      this.setEnabled();
    }
  },

  performAction: function() {
    var state = this.getToolState();
    var doc = this.getDocument();
    if (state.enabled && doc.done.length>0) {
      doc.undo();
    }
  }

});

module.exports = UndoTool;
