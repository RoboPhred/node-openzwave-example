
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var ZWaveNode = require('./zwave-node').ZWaveNode;

/**
 * Manages the discovery and creation of zwave nodes for a zwave device.
 * @constructor
 * @param {OZW} zwaveDevice - The openzwave device to track nodes for.
 */
function ZWaveNodeManager(zwaveDevice) {
	var self = this;
	
	this._discoveryCallbacks = {};
	this._nodes = {};
	this._zwaveDevice = zwaveDevice;
	
	EventEmitter.call(this);
	zwaveDevice.on('node added', function(nodeid){ self._nodeAdded(nodeid); });
	
	// TODO: Need a node removed event
}

util.inherits(ZWaveNodeManager, EventEmitter);


ZWaveNodeManager.prototype.getNodes = function getNodes() {
	return Object.keys(this._nodes).map(function(k){ return this._nodes[k]; });
};

ZWaveNodeManager.prototype.getNode = function getNode(id) {
	return this._nodes[id] || null;
};

ZWaveNodeManager.prototype.findNodes = function findNodes(options) {
	return this.getNodes()
		.filter(function(node) {
			return nodeMatchesFindOptions(node, options);
		});
};


function nodeMatchesFindOptions(node, options) {
	var name = options.name;
	var location = options.location;
	var type = options.type;
	var classes = options.classes;
	
	if (name && node.name != name) {
			return false;
		}
		if (location && node.location != location) {
			return false;
		}
		if (type && node.type != type) {
			return false;
		}
		if (classes) {
			for(var i = 0; i < classes.length; i++) {
				if (!node.getClass(classes[i])) {
					return false;
				}
			}
		}
		return true;
}

ZWaveNodeManager.prototype._nodeAdded = function _nodeAdded(nodeid) {
	var self = this;

	var node = new ZWaveNode(nodeid, this._zwaveDevice);
	node.once('ready', function() { self._nodeReady(node); });
		
	this.emit('discovered', node);
};

ZWaveNodeManager.prototype._nodeReady = function _nodeReady(node) {
	this._nodes[node.id] = node;
	this.emit('added', node);
};

exports.ZWaveNodeManager = ZWaveNodeManager;