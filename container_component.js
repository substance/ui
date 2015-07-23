'use strict';

var $$ = React.createElement;

// Container Component
// ----------------
// 
// Markup for a Substance Container
//
// Listens to document updates to the container

class ContainerComponent extends React.Component {

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

  // We will leave this unmanaged by react and instead use our own
  // event mechanism to update only what needs an update
  shouldComponentUpdate() {
    return false;
  }

  // unbind event handlers before component gets unmounted
  componentWillUnmount() {
    this.props.doc.disconnect(this);
  }

  onDocumentChanged(change) {
    if (change.isAffected([this.props.containerId, 'nodes'])) {
      this.forceUpdate();
    }
  }

  render() {
    var doc = this.props.doc;
    var containerNode = doc.get(this.props.containerId);
    var componentRegistry = this.context.componentRegistry;

    // Prepare container components (aka nodes)
    // ---------

    var components = [];
    components = components.concat(containerNode.nodes.map(function(nodeId) {
      var node = doc.get(nodeId);
      var ComponentClass = componentRegistry.get(node.type);
      return $$(ComponentClass, { key: node.id, doc: doc, node: node });
    }.bind(this)));

    return $$('div', {className: 'container-nodes', contentEditable: true, spellCheck: false},
      components
    );
  }
}

ContainerComponent.contextTypes = {
  componentRegistry: React.PropTypes.object.isRequired
};


module.exports = ContainerComponent;