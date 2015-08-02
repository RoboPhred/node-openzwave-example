
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var ZWaveClass = require('./zwave-class').ZWaveClass;

/**
 * Represents a node in a zwave network.
 * The node will subscribe to the zwave device and
 * update itself as information becomes available.
 * @constructor
 * @param {number} nodeid - The zwave node id of this node.
 * @param {OZW} zwaveDevice - The openzwave device that provides this node.
 */
function ZWaveNode(id, zwaveDevice) {
	var self = this;
	
	EventEmitter.call(this);

	this._zwaveDevice = zwaveDevice;
	
	this._nodeinfo = null;
    this._classes = {};
    this._ready = false;
	
	Object.defineProperty(
		this,
		'id',
		{
			value: id,
			configurable: false,
			enumerable: true,
			writable: false
		});
	
	
	// TODO: Remove these subscriptions when node is removed.
	//  Doesnt seem to be a node-openzwave event for this...
	
	// This is called until we find our ready signal, then remove the listener.
	var readyCallback = function(nodeid, nodeinfo) {
		if (nodeid != id) {
			return;
		}
		zwaveDevice.removeListener('node ready', readyCallback);
		self._nodeReady(nodeinfo);
	};
	zwaveDevice.on('node ready', readyCallback);
	
	zwaveDevice.on('value added', function(nodeid, comclass, value) {
		if (nodeid != id) {
			return;
		}
		self._valueAdded(value);
	});
		
	zwaveDevice.on('value removed', function(nodeid, comclass, index) {
		if (nodeid != id) {
			return;
		}
		self._valueRemoved( index);
	});
}

util.inherits(ZWaveNode, EventEmitter);


ZWaveNode.prototype.getClass = function getClass(comclass, instance) {
	if (!instance) {
		instance = 1;
	}
	
	if (!this._classes[comclass] || !this._classes[comclass][instance]) {
		return null;
	}
	
	return this._classes[comclass][instance];
};

ZWaveNode.prototype._nodeReady = function _nodeReady(nodeinfo) {
    this._nodeinfo = nodeinfo;
    this._ready = true;
    
    this.emit('ready');
};

ZWaveNode.prototype._valueAdded = function _valueAdded(value) {
	var comClass = this._getOrCreateComClass(value.class_id, value.instance);
	
	// Since the first added value to a class wont get seen by the class.
	//	Need to make this code more sane...
	comClass._valueAdded(value);
};

ZWaveNode.prototype._valueRemoved = function _valueRemoved(comclass, index) {	
	if (!this._classes[comclass] || !this._classes[comclass][index]) {
		return;
	}
	
	delete this._classes[comclass][index];
	this.emit('value removed', comclass, index);
};

ZWaveNode.prototype._getOrCreateComClass = function _getOrCreateComClass(comclass, instance) {
	var comClassInstances = this._classes[comclass];
	if (!comClassInstances) {
		comClassInstances = this._classes[comclass] = {};
	}
	
	var comClassObj = comClassInstances[instance];
	if (!comClassObj) {
		comClassObj = new ZWaveClass(this.id, comclass, instance, this._zwaveDevice);
		comClassInstances[instance] = comClassObj;
		this.emit('class added', comclass, comClassObj);
	}
	
	return comClassObj;
};

exports.ZWaveNode = ZWaveNode;