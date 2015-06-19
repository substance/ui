var $$ = React.createElement;
var Substance = require('substance');

// ToolComponent
// -------------

var ToolComponent = React.createClass({

  displayName: "ToolComponent",

  contextTypes: {
    toolRegistry: React.PropTypes.object.isRequired
  },

  componentDidMount: function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }
    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.warn('No tool registered with name %s', toolName);
      this.tool = new ToolComponent.StubTool(toolName);
    }
    this.tool.connect(this, {
      'toolstate:changed': this.onToolstateChanged
    });
  },

  onToolstateChanged: function(toolState, tool, oldState) {
    this.replaceState(toolState);
  },

  handleClick: function(e) {
    e.preventDefault();
  },

  handleMouseDown: function(e) {
    e.preventDefault();
    if (this.state.disabled) {
      return;
    }
    this.tool.performAction();
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.state.disabled !== nextState.disabled ||
      this.state.active !== nextState.active);
  },

  getInitialState: function() {
    return {
      disabled: true,
      active: false
    };
  },

  render: function() {
    var classNames = ['tool'];
    if (this.state.disabled) {
      classNames.push('disabled');
    }
    if (this.state.active) {
      classNames.push("active");
    }
    return $$("button", {
      className: classNames.join(' '),
      dangerouslySetInnerHTML: {__html: '<i class="fa ' + this.props.icon + '"></i>'},
      title: this.props.title,
      onMouseDown: this.handleMouseDown,
      onClick: this.handleClick
    });
  }
});

ToolComponent.StubTool = Substance.Surface.Tool.extend({

  init: function(name) {
    this.name = name;
  },

  performAction: function() {
    console.log('Stub-Tool %s', this.name);
  }

});

module.exports = ToolComponent;