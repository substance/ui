var $$ = React.createElement;

// Navigate Tool Component
// ----------------
//
// Just used to trigger app state changes

var TableToolComponent = React.createClass({
  displayName: "TableToolComponent",

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

  getInitialState: function() { return { disabled: true }; },

  render: function() {
    var classNames = [];
    if (this.props.classNames) {
      classNames = this.props.classNames.slice();
    }
    if (this.state.disabled) {
      classNames.push('disabled');
    }
    var label, sel;
    switch(this.props.tool) {
      case "insert_columns":
        if (this.state.disabled) {
          label = i18n.t('menu.insert_column');
        } else {
          sel = this.tool.getToolState().sel;
          var colCount = sel.endCol - sel.startCol + 1;
          label = i18n.t('menu.insert_k_columns', { smart_count: colCount });
        }
        break;
      case "insert_rows": {
        if (this.state.disabled) {
          label = i18n.t('menu.insert_row');
        } else {
          sel = this.tool.getToolState().sel;
          var rowCount = sel.endRow - sel.startRow + 1;
          label = i18n.t('menu.insert_k_rows', { smart_count: rowCount });
        }
        break;
      }
    }
    return $$("button", {
      className: classNames.join(' '),
      title: this.props.title,
      onMouseDown: this.handleMouseDown,
      onClick: this.handleClick
    }, label);
  },

  onToolstateChanged: function(toolState) {
    this.setState({
      disabled: toolState.disabled
    });
  },

  handleClick: function(e) {
    e.preventDefault();
    if (!this.state.disabled) {
      this.tool.performAction();
    }
  },

});

module.exports = TableToolComponent;
