var $$ = React.createElement;
var _ = require("substance/helpers");
var PanelMixin = require("substance-ui/panel_mixin");

// TOC Panel extension
// ----------------

var TOCPanelMixin = _.extend({}, PanelMixin, {

  // State relevant things
  // ------------

  contextTypes: {
    app: React.PropTypes.object.isRequired
  },

  componentDidMount: function() {
    var doc = this.getDocument();
    doc.connect(this, {
      'app:toc-entry:changed': this.setActiveTOCEntry,
      'document:changed': this.handleDocumentChange
    });
  },

  componentWillUnmount: function() {
    var doc = this.getDocument();
    doc.disconnect(this);
  },

  getInitialState: function() {
    var doc = this.props.doc;
    var tocNodes = doc.getTOCNodes();
    return {
      doc: doc,
      tocNodes: tocNodes,
      activeNode: tocNodes.length > 0 ? tocNodes[0].id : null
    };
  },

  handleDocumentChange: function(change/*, info*/) {
    var doc = this.getDocument();
    var needsUpdate = false;
    var tocTypes = doc.getSchema().getTocTypes();
    // HACK: this is not totally correct but works.
    // Actually, the TOC should be updated if tocType nodes
    // get inserted or removed from the container, plus any property changes
    // This implementation just checks for changes of the node type
    // not the container, but as we usually create and show in
    // a single transaction this works.
    for (var i = 0; i < change.ops.length; i++) {
      var op = change.ops[i];
      var nodeType;
      if (op.isCreate() || op.isDelete()) {
        var nodeData = op.getValue();
        nodeType = nodeData.type;
        if (_.includes(tocTypes, nodeType)) {
          needsUpdate = true;
          break;
        }
      } else {
        var id = op.path[0];
        var node = doc.get(id);
        if (_.includes(tocTypes, node.type)) {
          needsUpdate = true;
          break;
        }
      }
    }
    if (needsUpdate) {
      return this.setState({
       tocNodes: doc.getTOCNodes()
      });
    }
  },

  setActiveTOCEntry: function(nodeId) {
    this.setState({
      activeNode: nodeId
    });
  },

  handleClick: function(e) {
    var nodeId = e.currentTarget.dataset.id;
    console.log('clicked', nodeId);
    e.preventDefault();
    var doc = this.getDocument();
    doc.emit("app:toc-entry-selected", nodeId);
  },

  // Rendering
  // -------------------

  render: function() {
    var state = this.state;

    var tocEntries = _.map(state.tocNodes, function(node) {
      var level = node.level;
      var classNames = ["toc-entry", "level-"+level];

      if (state.activeNode === node.id) {
        classNames.push("active");
      }

      return $$('a', {
        className: classNames.join(" "),
        href: "#",
        key: node.id,
        "data-id": node.id,
        onClick: this.handleClick
      }, node.content);
    }, this);

    return $$("div", {className: "panel toc-panel-component"},
      $$("div", {className: "toc-entries"}, tocEntries)
    );
  }
});

var TOCPanel = React.createClass({
  mixins: [TOCPanelMixin],
  displayName: "Contents",
});

// Panel Configuration
// -----------------

TOCPanel.contextId = "toc";
TOCPanel.icon = "fa-align-left";

module.exports = TOCPanel;