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

    // if (!this.state.active) return;
    // var textType = TEXT_TYPES[e.currentTarget.dataset.type];
    // var surface = this.state.surface;
    // var editor = surface.getEditor();

    // editor.switchType(this.state.sel, textType.data);
    // this.setState({
    //   expanded: false
    // });
  },

  getInitialState: function() {
    return {
      enabled: false,
      open: false
    };
  },

  toggleAvailableTextTypes: function(e) {
    e.preventDefault();
    this.setState({
      open: !this.state.open
    });
  },

  render: function() {
    var classNames = ['text-tool-component', 'select'];
    var textTypes = this.tool.getAvailableTextTypes();

    if (!this.state.enabled) classNames.push('active');
    if (this.state.open) classNames.push('open');

    var currentTextTypeEl;
    if (this.state.currentTextType) {
      var currentTextType = textTypes[this.state.currentTextType].label;
      currentTextTypeEl = $$('button', {
        className: "toggle",
        onMouseDown: this.toggleAvailableTextTypes,
        onClick: this.handleClick
      }, currentTextType);
    } else {
      currentTextTypeEl = $$('button', {
        href: "#",
        className: "toggle",
        onMouseDown: this.toggleAvailableTextTypes,
        onClick: this.handleClick
      }, "No selection");
    }
      
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
