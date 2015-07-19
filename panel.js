'use strict';

var $$ = React.createElement;

// This is an abstract class
class Panel extends React.Component {


  getDocument() {
    var app = this.context.app;
    return app.doc;
  }

  getPanelContentElement() {
    return React.findDOMNode(this.refs.panelContent);
  }

  getScrollableContainer() {
    return React.findDOMNode(this.refs.panelContent);
  }

  // Returns the cumulated height of a panel's content
  getContentHeight() {
    // initialized lazily as this element is not accessible earlier (e.g. during construction)
    // get the new dimensions
    // TODO: better use outerheight for contentheight determination?
    var contentHeight = 0;
    var panelContentEl = this.getPanelContentElement();

    $(panelContentEl).children().each(function() {
     contentHeight += $(this).outerHeight();
    });
    return contentHeight;
  }

  // Returns the height of panel (inner content overflows)
  getPanelHeight() {
    var panelContentEl = this.getPanelContentElement();
    return $(panelContentEl).height();
  }

  getScrollPosition() {
    var panelContentEl = this.getPanelContentElement();
    return $(panelContentEl).scrollTop();
  }

  // This method must be overriden with your panel implementation
  render() {
    return $$("div", {className: "panel"},
      $$('div', {className: 'panel-content'}, 'YOUR_PANEL_CONTENT')
    );
  }

}

Panel.displayName = "Panel";

module.exports = Panel;
