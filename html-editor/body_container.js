'use strict';

var $$ = React.createElement;

// Body container
// ----------------
// 
// A simple rich text editor implementation based on Substance

class BodyContainer extends React.Component {

  // before it will be mounted the first time
  componentWillMount() {
    var doc = this.props.doc;
    doc.connect(this, {
      'document:changed': this.onDocumentChanged
    });
  }

  // new doc arriving (bind change events again to new document)
  componentWillReceiveProps(props) {
    this.props.doc.disconnect(this);

    var doc = props.doc;
    doc.connect(this, {
      'document:changed': this.onDocumentChanged
    });
  }

  // unbind event handlers before component gets unmounted
  componentWillUnmount() {
    this.props.doc.disconnect(this);
  }

  onDocumentChanged(change) {
    if (change.isAffected(['body', 'nodes'])) {
      this.forceUpdate();
    }
  }

  render() {
    var doc = this.props.doc;
    var containerNode = doc.get('body');
    var componentRegistry = this.context.componentRegistry;

    // Prepare container components (aka nodes)
    // ---------

    var components = [];
    components = components.concat(containerNode.nodes.map(function(nodeId) {
      var node = doc.get(nodeId);
      var ComponentClass = componentRegistry.get(node.type);
      return $$(ComponentClass, { key: node.id, doc: doc, node: node });
    }.bind(this)));

    return $$('div', {className: 'body-nodes', contentEditable: true, spellCheck: false},
      components
    );
  }
}

BodyContainer.contextTypes = {
  componentRegistry: React.PropTypes.object.isRequired
};


module.exports = BodyContainer;