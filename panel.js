'use strict';

var $$ = React.createElement;

// This is an abstract class
class Panel extends React.Component {


  // We need to duplicate this from surface/panel.js
  // -------------------
  // DUPLICATED CODE START

  getPanelOffsetForElement(el) {
    var offsetTop = $(el).position().top;
    return offsetTop;
  }

  scrollToNode(nodeId) {
    // TODO make this generic
    var panelContentEl = this.getScrollableContainer();

    // Node we want to scroll to
    var targetNode = $(panelContentEl).find("*[data-id="+nodeId+"]")[0];
    if (targetNode) {
      var offset = this.getPanelOffsetForElement(targetNode);
      console.log(offset);
      $(panelContentEl).scrollTop(offset);
    } else {
      console.warn(nodeId, 'not found in scrollable container');
    }
  }

  // END
  // -------------------

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
