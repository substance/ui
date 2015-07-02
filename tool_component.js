var $$ = React.createElement;
var Substance = require('substance');

// ToolComponent
// -------------

var ToolComponent = React.createClass({

  displayName: "ToolComponent",

  contextTypes: {
    toolRegistry: React.PropTypes.object.isRequired,
    app: React.PropTypes.object.isRequired
  },

  componentWillMount: function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }

    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.warn('No tool registered with name %s', toolName);
      this.tool = new ToolComponent.StubTool(toolName);
    }

    // Derive initial state from tool
    this.state = this.tool.state;

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
    this.tool.performAction(this.context.app);
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return (this.state.disabled !== nextState.disabled ||
      this.state.active !== nextState.active);
  },

  render: function() {
    var classNames = [];

    if (this.props.classNames) {
      classNames = this.props.classNames.slice();
    }

    if (this.state.disabled) {
      classNames.push('disabled');
    }
    if (this.state.active) {
      classNames.push("active");
    }

    return $$("button", {
      className: classNames.join(' '),
      title: this.props.title,
      onMouseDown: this.handleMouseDown,
      onClick: this.handleClick
    }, this.props.children);
  }
});

ToolComponent.StubTool = Substance.Surface.Tool.extend({

  init: function(name) {
    this.name = name;
  },

  performAction: function(/*app*/) {
    console.log('Stub-Tool %s', this.name);
  }
});

module.exports = ToolComponent;