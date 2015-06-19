var _ = require("substance/helpers");
var $$ = React.createElement;

var ModalPanel = React.createClass({
  contextTypes: {
    app: React.PropTypes.object.isRequired
  },

  displayName: "ManageBibItemsPanel",

  handleCloseModal: function(e) {
    this.context.app.closeModal();
    e.preventDefault();
  },

  // setTimeout(function() {
  //   $(window).one('mousedown', function(e) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     self.close();
  //   });
  // }, 0);

  preventBubbling: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },

  render: function() {
    return $$('div', {className: 'modal', onClick: this.handleCloseModal},
      $$('div', {className: 'body', onClick: this.preventBubbling},
        this.props.panelElement
      )
    );
  }
});


// $$(ModalPanel, {
//   content: $$(MyPanel, {})
// })

module.exports = ModalPanel;