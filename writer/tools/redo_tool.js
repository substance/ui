var $$ = React.createElement;

// Redo Tool
// ----------------

var RedoTool = React.createClass({
  displayName: "SaveTool",

  contextTypes: {
    app: React.PropTypes.object.isRequired,
    backend: React.PropTypes.object.isRequired
  },

  getDocument: function() {
    var app = this.context.app;
    return app.doc;
  },

  componentDidMount: function() {
    var doc = this.getDocument();
    doc.connect(this, {
      'document:changed': this.handleDocumentChange
    });
  },

  handleClick: function(e) {
    e.preventDefault();
  },

  handleMouseDown: function(e) {
    e.preventDefault();
    if (!this.state.active) {
      return;
    }
    var doc = this.getDocument();
    doc.redo();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return this.state.active !== nextState.active;
  },

  handleDocumentChange: function() {
    this.setState({
      active: (this.getDocument().undone.length > 0)
    });
  },

  getInitialState: function() {
    return {
      active: false
    };
  },

  render: function() {
    var classNames = ['redo-tool-component', 'tool'];
    if (this.state.active) classNames.push('active');

    return $$("a", {
      className: classNames.join(' '),
      href: "#",
      dangerouslySetInnerHTML: {__html: '<i class="fa fa-rotate-right"></i>'},
      title: 'Redo',
      onMouseDown: this.handleMouseDown,
      onClick: this.handleClick
    });
  }
});

module.exports = RedoTool;