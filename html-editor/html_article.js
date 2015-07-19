"use strict";

var Substance = require('substance');
var Document = Substance.Document;
var Paragraph = Document.Paragraph;
var Heading = Document.Heading;
var Emphasis = Document.Emphasis;
var Strong = Document.Strong;

var HtmlImporter = Substance.Document.HtmlImporter;
var HtmlExporter = Substance.Document.HtmlExporter;

// Schema
// ----------------

var schema = new Document.Schema("html-article", "1.0.0");

schema.getDefaultTextType = function() {
  return "paragraph";
};

schema.addNodes([
  Paragraph,
  Heading,
  Emphasis,
  Strong
]);

// Importer
// ----------------

function Importer() {
  Importer.super.call(this, { schema: schema });
}

Importer.Prototype = function() {
  this.convert = function($rootEl, doc) {
    this.initialize(doc, $rootEl);
    this.convertContainer($rootEl, 'body');
    this.finish();
  };
};

Substance.inherit(Importer, HtmlImporter);

// Exporter
// ----------------

function Exporter() {
  Exporter.super.call(this, { schema: schema });
}

Exporter.Prototype = function() {

  this.convert = function(doc, options) {
    this.initialize(doc, options);

    var doc = this.state.doc;
    var body = doc.get('body');
    var bodyNodes = this.convertContainer(body);
    var $el = $('<div>');
    $el.append(bodyNodes);
    return $el.html();
    return 'foo';
  };
};

Substance.inherit(Exporter, HtmlExporter);

// Article Class
// ----------------

var HtmlArticle = function() {
  HtmlArticle.super.call(this, schema);
};

HtmlArticle.Prototype = function() {
  this.initialize = function() {
    this.super.initialize.apply(this, arguments);

    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };

  this.toHtml = function() {
    return new Exporter().convert(this);
  };
};

Substance.inherit(HtmlArticle, Document);

HtmlArticle.schema = schema;

HtmlArticle.fromJson = function(json) {
  var doc = new HtmlArticle();
  doc.loadSeed(json);
  return doc;
};

HtmlArticle.fromHtml = function(html) {
  var $root = $('<div>'+html+'</div>');
  var doc = new HtmlArticle();
  new Importer().convert($root, doc);
  doc.documentDidLoad();
  return doc;
};

HtmlArticle.Importer = Importer;

module.exports = HtmlArticle;