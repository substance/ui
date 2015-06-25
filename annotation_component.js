var $$ = React.createElement;

var AnnotationComponent = React.createClass({
  name: "annotation-component",
  displayName: "AnnotationComponent",
  getClassName: function() {
    var classNames = this.props.node.getClassNames();
    if (this.props.classNames) {
      classNames += " " + this.props.classNames.join(' ');
    }
    return classNames.replace(/_/g, '-');
  },
  render: function() {
    return $$('span', {
      className: this.getClassName(),
      "data-id": this.props.node.id},
      this.props.children
    );
  },
});

module.exports = AnnotationComponent;
