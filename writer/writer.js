/* global $ */
var $$ = React.createElement;

var Substance = require("substance");
var _ = require("substance/helpers");
var ContentTools = require("../content_tools");
var ContentPanel = require("../content_panel");
var WriterControllerMixin = require("./writer_controller_mixin");
var StatusBar = require("./status_bar");


// The Substance Writer Component
// ----------------

var WriterMixin = _.extend({}, WriterControllerMixin, Substance.EventEmitter.prototype, {

  handleCloseModal: function(e) {
    e.preventDefault();
    console.log('handleclose dialog')
    $('.modal').toggleClass('active');
  },

  preventBubbling: function(e) {
    console.log('preventing...');
    e.stopPropagation();
  },  

  render: function() {
    var ContentToolbar = this.componentRegistry.get('content_toolbar') || ContentTools;
    return $$('div', { className: 'writer-component', onKeyDown: this.handleApplicationKeyCombos},
      $$('div', {className: "main-container"},
        $$(ContentToolbar),
        $$(ContentPanel, {containerId: this.props.contentContainer})
      ),
      $$('div', {className: "resource-container"},
        this.createContextToggles(),
        this.createContextPanel(this)
      ),
      $$('div', {className: 'modal', onClick: this.handleCloseModal},
        $$('div', {className: 'body', onClick: this.preventBubbling},
          $$('h1', null, "Reference manager"),
          $$('p', null, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue dui, congue at pharetra eleifend, ullamcorper tempus lorem. Aenean ipsum risus, lobortis ut lobortis ac, dapibus nec mauris. Aliquam sed nulla ut arcu viverra rutrum viverra eget urna. Nulla accumsan leo neque, a rhoncus nunc malesuada ac. Curabitur diam nisi, maximus in dolor sit amet, ultrices semper elit. Aenean ac venenatis velit, et porttitor lectus. Sed quis urna id tortor sagittis dignissim ut vitae orci. Donec suscipit ante id facilisis sagittis. Curabitur auctor tortor ut enim hendrerit, id posuere magna facilisis. Quisque a tristique felis. Duis aliquam turpis ex, eget finibus leo egestas nec. Nunc sed magna neque. Cras quis turpis sit amet massa rhoncus euismod. Praesent quis magna nibh. Nunc efficitur venenatis leo non ullamcorper. Aenean gravida a dui ut sagittis.'),
          $$('p', null, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue dui, congue at pharetra eleifend, ullamcorper tempus lorem. Aenean ipsum risus, lobortis ut lobortis ac, dapibus nec mauris. Aliquam sed nulla ut arcu viverra rutrum viverra eget urna. Nulla accumsan leo neque, a rhoncus nunc malesuada ac. Curabitur diam nisi, maximus in dolor sit amet, ultrices semper elit. Aenean ac venenatis velit, et porttitor lectus. Sed quis urna id tortor sagittis dignissim ut vitae orci. Donec suscipit ante id facilisis sagittis. Curabitur auctor tortor ut enim hendrerit, id posuere magna facilisis. Quisque a tristique felis. Duis aliquam turpis ex, eget finibus leo egestas nec. Nunc sed magna neque. Cras quis turpis sit amet massa rhoncus euismod. Praesent quis magna nibh. Nunc efficitur venenatis leo non ullamcorper. Aenean gravida a dui ut sagittis.'),
          $$('p', null, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue dui, congue at pharetra eleifend, ullamcorper tempus lorem. Aenean ipsum risus, lobortis ut lobortis ac, dapibus nec mauris. Aliquam sed nulla ut arcu viverra rutrum viverra eget urna. Nulla accumsan leo neque, a rhoncus nunc malesuada ac. Curabitur diam nisi, maximus in dolor sit amet, ultrices semper elit. Aenean ac venenatis velit, et porttitor lectus. Sed quis urna id tortor sagittis dignissim ut vitae orci. Donec suscipit ante id facilisis sagittis. Curabitur auctor tortor ut enim hendrerit, id posuere magna facilisis. Quisque a tristique felis. Duis aliquam turpis ex, eget finibus leo egestas nec. Nunc sed magna neque. Cras quis turpis sit amet massa rhoncus euismod. Praesent quis magna nibh. Nunc efficitur venenatis leo non ullamcorper. Aenean gravida a dui ut sagittis.')
        )
      ),
      $$(StatusBar, {
        doc: this.props.doc
      }),
      $$('div', {className: "clipboard"})
    );
  },

  // return true when you handled a key combo
  handleApplicationKeyCombos: function(e) {
    // console.log('####', e.keyCode, e.metaKey, e.ctrlKey, e.shiftKey);
    var handled = false;
    // TODO: we could make this configurable via extensions
    // Undo/Redo: cmd+z, cmd+shift+z
    if (e.keyCode === 90 && (e.metaKey||e.ctrlKey)) {
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
      handled = true;
    }
    // Reset to default state
    else if (e.keyCode === 27) {
      this.replaceState(this.getInitialState());
      handled = true;
    }
    // Save: cmd+s
    else if (e.keyCode === 83 && (e.metaKey||e.ctrlKey)) {
      this.requestSave();
      handled = true;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
});

// Create React class
var Writer = React.createClass({
  mixins: [WriterMixin],
  displayName: "Writer",
});

module.exports = Writer;