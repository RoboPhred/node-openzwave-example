
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Represents a class in a zwave node.
 * @constructor
 * @param {number} nodeid - The id of the node to track.
 * @param {number} comclass - The comclass id to represent.
 * @param {number} instance - The class instance to represent.
 * @param {OZW} zwaveDevice - The zwave device that owns the node.
 */
function ZWaveClass(nodeid, comclass, instance, zwaveDevice) {
	var self = this;
	
	EventEmitter.call(this);
	
	this._nodeid = nodeid;
	this._comclass = comclass;
	this._instance = instance;
	this._zwaveDevice = zwaveDevice;
	
	// Maps value index to values
	this._values = {};
	
	zwaveDevice.on('value added', function(valueNodeid, valueComclass, value) {
		if (valueNodeid != nodeid || valueComclass != comclass) {
			return;
		}
		self._valueAdded(value);
	});
	
	zwaveDevice.on('value changed', function(valueNodeid, valueComclass, value) {
		if (valueNodeid != nodeid || valueComclass != comclass || value.instance != instance) {
			return;
		}
		self._valueChanged(value);
	});
}

util.inherits(ZWaveClass, EventEmitter);


/**
 * Gets a value from the class for the node.
 * @param {index} - The value index.
 * @returns {any} - The current value for the index. 
 */
ZWaveClass.prototype.getValue = function getValue(index) {
	if (!this._values[index]) {
		return null;
	}
	
	return this._values[index].value;
};

/**
 * Sets a value from the class for the node.
 * @param {index} The index of the value to set.
 * @param {any} The new value.
 */
ZWaveClass.prototype.setValue = function setValue(index, value) {
	if (!this._values[index]) {
		return null;
	}
	
	var oldValue = this._values[index].value;
	
	this._values[index].value = value;
	this._zwaveDevice.addon.setValue(this._nodeid, this._comclass, this._instance, index);
	return oldValue;
};

ZWaveClass.prototype._valueAdded = function(value) {
	this._values[value.index] = value;
	this.emit('value added', value.index, value.Label, value.value);
}

ZWaveClass.prototype._valueChanged = function _valueChanged(value) {
	if (!this._values[value.index]) {
		return;
	}
	
	if (this._values[value.index].value === value.value) {
		return;
	}
	
	this._values[value.index] = value;
	this.emit('value changed', value.index, value.value);
};

exports.ZWaveClass = ZWaveClass;
