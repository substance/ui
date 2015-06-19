var _ = require("substance/helpers");
var $$ = React.createElement;


var ActionGroupComponent = React.createClass({

  handleAction: function(e) {
    var actionName = e.currentTarget.dataset.id;
    console.log('handling action', actionName);
  },

  // Prevent click behavior as we want to preserve the text selection in the doc
  handleClick: function(e) {
    e.preventDefault();
  },

  handleDropdownToggle: function(e) {
    this.setState({open: !this.state.open});
    e.preventDefault();
  },

  getInitialState: function() {
    return {
      open: false
    };
  },

  render: function() {
    var classNames = ['dropdown'];
    var actionEls = [];

    if (this.state.open) {
      classNames.push('open');
      _.each(this.props.actions, function(action) {
        actionEls.push($$('button', {
          className: 'option',
          "data-id": action.name,
          onMouseDown: this.handleAction,
          onClick: this.handleClick
        }, action.label));
      }, this);
    }

    return $$('div', {className: classNames.join(' ')},
      $$('button', {
        className: 'toggle',
        onMouseDown: this.handleDropdownToggle,
        onClick: this.handleClick
      }, i18n.t('menu.manage')),
      $$('div', {className: 'options shadow border fill-white'}, actionEls)
    );
  }
});

module.exports = ActionGroupComponent;