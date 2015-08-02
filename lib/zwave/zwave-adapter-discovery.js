
var serialport = require('serialport');
var Promise = require('bluebird');

// Look up relative to cwd?
var adapters = require('../../config/zwave-adapters.json');

function enumerateSerialPorts() {
	return new Promise(function(accept, reject) {
		serialport.list(function(err, ports) {
			if (err) {
				return reject(err);
			}
			
			accept(ports);
		});
	});
}

function findSerialPortByIDs(ports, vendor, product) {
	for(var i = 0; i < ports.length; i++) {
		var port = ports[i];
		
		var pVendor = parseInt(port.vendorId);
		var pProduct = parseInt(port.productId);
		if (isNaN(vendor) || isNaN(product)) {
			continue;
		}
		
		if (vendor == pVendor && product == pProduct) {
			return port;
		}
	}
	
	return null;
}

function pickUsbSerialPort(ports) {
	var usbAdapters = adapters['usb-serial'];
	
	for(var i = 0; i < usbAdapters.length; i++) {
		var adapter = usbAdapters[i];
		
		var vendor = parseInt(adapter.usbVendor);
		var product = parseInt(adapter.usbProduct);
		if (isNaN(vendor) || isNaN(product)) {
			continue;
		}
		
		var port = findSerialPortByIDs(ports, vendor, product);
		if (port) {
			return port.comName;
		}
	}
	
	return null;
}


function findAdapter() {
	return enumerateSerialPorts()
		.then(function (ports) { 
			return pickUsbSerialPort(ports);
		});
}

exports.findAdapter = findAdapter;
