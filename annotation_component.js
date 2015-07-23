var $$ = React.createElement;

var AnnotationComponent = React.createClass({
  name: "annotation-component",
  displayName: "AnnotationComponent",
  getClassName: function() {
    var typeNames = this.props.node.getTypeNames();
    var classNames = typeNames.join(' ');
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames.replace(/_/g, '-');
  },
  render: function() {
    var className = this.getClassName();
    if (this.props.node.active) {
      className += " active";
    }
    return $$('span', {
      className: className,
      "data-id": this.props.node.id},
      this.props.children
    );
  },
  componentDidMount: function() {
    var node = this.props.node;
    node.connect(this, {
      'active': this.onActiveChanged
    });
  },
  componentWillUnmount: function() {
    var node = this.props.node;
    node.disconnect(this);
  },
  onActiveChanged: function() {
    this.forceUpdate();
  },

});

module.exports = AnnotationComponent;
