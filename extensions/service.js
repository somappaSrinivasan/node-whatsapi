// Service submodule
// Includes functions for general interaction with WhatsApp

var common = require('../common.js');
var protocol = require('../protocol.js');
var WhatsApi = module.exports;

WhatsApi.createClearDirtyNode = function(node) {
	var categories = [];

	var children = node.children();
	if(children.length) {
		for (var i = 0; i < children.length; i++) {
			var child = node.child(i);
			if(child.tag() === 'category') {
				categories.push(new protocol.Node('category', {name : child.attribute('name')}));
			}
		};
	}

	var cleanNode = new protocol.Node('clean', {xmlns : 'urn:xmpp:whatsapp:dirty'}, categories);

	var attributes = {
		id   : this.nextMessageId('cleardirty'),
		type : 'set',
		to   : this.config.server
	};

	return new protocol.Node('iq', attributes, [cleanNode]);
};

/**
 * Create a pong node, to be sent in response to ping
 * @param  {String} messageId    The ping message ID
 * @return {Node}       Created node
 */
WhatsApi.createPongNode = function(messageId) {
	var attributes = {
		to   : this.config.server,
		id   : messageId,
		type : 'result'
	};

	return new protocol.Node('iq', attributes);
};

/**
 * Create a 'receipt' node, to be sent when a new message is received/read
 * @param  {Node} node    The received message node
 * @return {Node}         Created node
 */
WhatsApi.createReceiptNode = function(node) {
	var attributes = {
		to   : node.attribute('from'),
		type : 'read',
		id   : node.attribute('id'),
		t    : common.tstamp().toString()
	};
	
	if (node.attribute('participant')) {
		attributes['participant'] = node.attribute('participant');
	}

	return new protocol.Node('receipt', attributes);
};

/**
 * Create a 'ack' node, to be sent when a new notification is received
 * @param  {Node} node    The notification node
 * @return {Node}         Created node
 */
WhatsApi.createNotificationAckNode = function(node) {
	var attributes = {
		to    : node.attribute('from'),
		class : 'notification',
		id    : node.attribute('id'),
		type  : node.attribute('type')
	};
	if (node.attribute('to')) {
		attributes['from'] = node.attribute('to');
	}
	if (node.attribute('participant')) {
		attributes['participant'] = node.attribute('participant');
	}

	return new protocol.Node('ack', attributes);
};

/**
 * Create a 'ack' node, to be sent when a 'receipt' node is received
 * @param  {Node} node     The 'receipt' node
 * @return {Node}          Created node
 */
WhatsApi.createAckNode = function(node) {
	var attributes = {
		to   : node.attribute('from'),
		id   : node.attribute('id'),
		t    : common.tstamp().toString()
	};
	
	// Ack type --> nothing or 'read'
	if (node.attribute('type')) {
		attributes['type'] = node.attribute('type');
	}
	
	var node = new protocol.Node(
		'ack',
		attributes
	);
	
	return node;
};

/**
 * Request WhatsApp server properties
 * @param  {Function} callback Called when the properties are received
 */
WhatsApi.requestServerProperties = function(callback) {
	var messageId = this.nextMessageId('getproperties');
	this.addCallback(messageId, callback);
	
	var node = new protocol.Node(
		'iq',
		{
			id    : messageId,
			type  : 'get',
			xmlns : 'w',
			to    : this.config.server
		},
		[
			new protocol.Node('props')
		]
	);
	
	this.sendNode(node);
};

/**
 * Request WhatsApp service pricing
 * @param {String}    language    Language code (e.g. 'en')
 * @param {String}    country     Country code (e.g. 'us')
 * @param {PricingCallback}  callback    Called when the pricing is recived
 */
WhatsApi.requestServicePricing = function(language, country, callback) {	
	var messageId = this.nextMessageId('get_service_pricing_');
	this.addCallback(messageId, callback);
	
	var node = new protocol.Node(
		'iq',
		{
			id    : messageId,
			xmlns : 'urn:xmpp:whatsapp:account',
			type  : 'get',
			to    : this.config.server
		},
		[
			new protocol.Node('pricing', { lg: language || 'en', lc: country || 'us' })
		]
	);
	
	this.sendNode(node);
};