var $$ = React.createElement;
var _ = require("substance/helpers");


// Text Tool
// ----------------

var TextTool = React.createClass({
  displayName: "TextToolComponent",

  contextTypes: {
    toolRegistry: React.PropTypes.object.isRequired
  },

  componentWillMount: function() {
    var toolName = this.props.tool;
    if (!toolName) {
      throw new Error('Prop "tool" is mandatory.');
    }

    this.tool = this.context.toolRegistry.get(toolName);
    if (!this.tool) {
      console.error('No tool registered with name %s', toolName);
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

    this.tool.switchTextType(e.currentTarget.dataset.type)
  },

  getInitialState: function() {
    return {
      enabled: false,
      open: false
    };
  },

  toggleAvailableTextTypes: function(e) {
    e.preventDefault();
    if (!this.state.enabled) return;
    this.setState({
      open: !this.state.open
    });
  },

  render: function() {
    var classNames = ['text-tool-component', 'select'];
    var textTypes = this.tool.getAvailableTextTypes();

    // TODO: how is this used?
    if (this.state.open) classNames.push('open');

    var isTextContext = textTypes[this.state.currentTextType];
    var label;
    if (isTextContext) {
      label = textTypes[this.state.currentTextType].label;
      classNames.push('active');
    } else if (this.state.currentContext) {
      // TODO: we should play with some i18n framework to retrieve labels
      label = this.state.currentContext;
    } else {
      label = "No Selection"
    }
    var currentTextTypeEl = $$('button', {
        href: "#",
        className: "toggle",
        onMouseDown: this.toggleAvailableTextTypes,
        onClick: this.handleClick
      }, label, $$('span', { className: "caret" }));

    var availableTextTypes = [];
    availableTextTypes = _.map(textTypes, function(textType, textTypeId) {
      return $$('button', {
        className: 'option '+textTypeId,
        "data-type": textTypeId,
        onMouseDown: this.handleMouseDown,
        onClick: this.handleClick
      }, textType.label);
    }.bind(this));

    return $$("div", { className: classNames.join(' ')},
      currentTextTypeEl,
      $$('div', {className: "options shadow border fill-white"}, availableTextTypes)
    );
  }
});

module.exports = TextTool;
