/// <reference path="typings/tsd.d.ts"/>

var OpenZWave = require('openzwave-shared');

var adapterDiscovery = require('./lib/zwave/zwave-adapter-discovery');
var ZWaveNodeManager = require('./lib/zwave/zwave-node-manager').ZWaveNodeManager;

var readline = require('readline');

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});


var zwave;
var nodeManager;
var nodes = [];


adapterDiscovery.findAdapter().then(function(result) {
	initZWave(result);
});


function initZWave(port) {
	if (!port) {
		rl.question('Port not found.  Enter zwave serial port: ', initZWave);
		return;
	}
	
	console.log('Connecting on', port);
	zwave = new OpenZWave(port);
	
	zwave.on('driver ready', zwaveDriverReady);
	zwave.on('driver failed', zwaveDriverFailed);
	
	nodeManager = new ZWaveNodeManager(zwave);
	nodeManager.on('added', nodeAdded);
	
	zwave.connect();
}

function nodeAdded(node) {
	console.log('Node added', node.id);
	
	var switchClass = node.getClass(0x25);
	if (switchClass) {
		console.log('Switch found at ID', node.id);
		zwave.addon.enablePoll(node.id, 0x25);
		switchClass.on('value changed', switchValueChanged.bind(this, node));
	}
	if (node.getClass(0x26)) {
		zwave.addon.enablePoll(node.id, 0x26);
	}
}

function switchValueChanged(node, valueIndex, value) {
	if (valueIndex == 0) {
		console.log('node', node.id, 'switched', value ? 'on' : 'off');
	}
}

function zwaveDriverReady(homeid) {
	console.log('Connected to home 0x%s', homeid);
}

function zwaveDriverFailed() {
	console.log('Failed to start driver');
	zwave.disconnect();
	process.exit();
}

process.on('SIGINT', function() {
	if (zwave) {
	    console.log('disconnecting...');
	    zwave.disconnect();
	}
    process.exit();
});