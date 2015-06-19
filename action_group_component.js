var _ = require("substance/helpers");
var $$ = React.createElement;


var ActionGroupComponent = React.createClass({
  contextTypes: {
    app: React.PropTypes.object.isRequired
  },

  handleAction: function(e) {
    var app = this.context.app;
    var actionName = e.currentTarget.dataset.id;
    app.executeAction(actionName);
  },

  // Prevent click behavior as we want to preserve the text selection in the doc
  handleClick: function(e) {
    e.preventDefault();
  },

  handleDropdownToggle: function(e) {
    e.preventDefault();

    var open = this.state.open;
    var self = this;

    if (open) return;
    this.setState({open: !this.state.open});

    setTimeout(function() {
      $(window).one('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.close();
      });
    }, 0);
  },

  close: function() {
    this.setState({
      open: false
    });
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
      }, this.props.label),
      $$('div', {className: 'options shadow border fill-white'}, actionEls)
    );
  }
});

module.exports = ActionGroupComponent;