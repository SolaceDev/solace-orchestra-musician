import solace from "../lib/solclient.js";

export default class Messaging {

	constructor(opts) {
		this.solace = solace;
		this.isConnected = false;
		this.WILDCARD = "*"; // Wildcard for topic subscriptions in SMF
		this.msgId = 1;
		this.myId = Math.random().toString().substr(2);

		this.callbacks = opts.callbacks;
		this.pendingReplies = {};

		this.sessionProps = {
			url: "wss://mrlq2f85angxr.messaging.solace.cloud:443",
			vpnName: "msgvpn-lq2f85angx7",
			userName: "solace-cloud-client",
			password: "j63bfrgm2i0v309bee9s62o093"
		};

		var factoryProps = new this.solace.SolclientFactoryProperties();
		factoryProps.profile = this.solace.SolclientFactoryProfiles.version10;
		this.solace.SolclientFactory.init(factoryProps);

		try {
			this.client = this.solace.SolclientFactory.createSession( this.sessionProps );
		} catch (error) {
			console.log(error);
			throw error;
		}

		this.client.on(this.solace.SessionEventCode.UP_NOTICE, this._connected.bind(this));

//		this.client.on(this.solace.SessionEventCode.SUBSCRIPTION_OK, function(sessionEvent) {
//			self._subscribed.apply(self, sessionEvent.correlationKey);
//		});

		this.client.on(this.solace.SessionEventCode.MESSAGE, (message) => {
			this._processRxMessage(message.getDestination().getName(), message.getBinaryAttachment());
		});

		this.client.connect();
	}

	disconnect() {
		this.client.disconnect();
	}

	// Inject a list of subscriptions for this client
	subscribe(...topics) {
		topics.forEach(topic => {
			this.client.subscribe(this.solace.SolclientFactory.createTopicDestination(topic),
				false, // request confirmation
				topic, // correlation key so we know which subscription suceedes
				1000 // subscribe timeout
			);
		});
	}

	// Remove a list of subscriptions for this client
	unsubscribe(...topics) {
		topics.forEach(topic => {
			this.client.unsubscribe(this.solace.SolclientFactory.createTopicDestination(topic),
				false, // request confirmation
				topic, // correlation key so we know which subscription suceedes
				1000 // subscribe timeout
			);
		});
	}

	// Send a response to a previously received message
	sendResponse(rxMessage, txMessage) {
		let replyToTopic = `orchestra/p2p/${rxMessage.client_id}`;
		txMessage.msg_type = `${rxMessage.msg_type}_response`;
		txMessage.msg_id = rxMessage.msg_id;
		this.sendMessage(replyToTopic, txMessage);
	}

	// Send a message to the specified topic
	//
	// This function will:
	//	 * fill in the client_id
	//	 * fill in the current_time
	//	 * fill in the msg_id
	//
	// If a callback is specified, the message will be considered to be
	// a request reply. In this case it will:
	//	 * Set the specified timeout for the message (default 5s)
	//	 * Store the sent message and callback against the msg_id of the sent message
	//	 * On reception of the response, it will call the callback with the
	//		 sent message and received response.
	//	 * On timeout, it will call the timeout with the received response set
	//		 to {status: 'timeout'}
	//
	sendMessage(topic, message, callback, timeout, retries) {
		let txMsg = Object.assign({}, message);
		txMsg.client_id		= this.myId;
		txMsg.current_time = this.getTime();

		if (!txMsg.msg_id) {
			txMsg.msg_id = this.msgId++;
		}

		if (!this.isConnected) {
			console.error("Not yet connected");
			return;
		}

		if (callback) {
			// Request-reply message
			if (!timeout) {
				timeout = 5000;
			}
			this.pendingReplies[txMsg.msg_id] = {
				txMessage: txMsg,
				callback: callback,
				retries: retries,
				timer: setTimeout(() => {
					if (this.pendingReplies[txMsg.msg_id].retries) {
						this._publishText(topic, JSON.stringify(txMsg));
						this.pendingReplies[txMsg.msg_id].retries--;
					} else {
						clearTimeout(this.pendingReplies[txMsg.msg_id].timer);
						delete this.pendingReplies[txMsg.msg_id];
						callback(message, {status: "timeout"});
					}
				}, timeout)
			};
		}
		this._publishText(topic, JSON.stringify(txMsg));
	}

	_publishText(topic, text) {
		var message = solace.SolclientFactory.createMessage();
		message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
		message.setBinaryAttachment(text);
		message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
		this.client.send(message);
	}

	// Are we connected right now
	getIsConnected() {
		return this.isConnected;
	}

	getTime() {
		// TODO: Fill in syched time offset here
		return (new Date()).getTime();
	}

	/**
	 * Returns the offset in milliseconds to be added to local time
	 * to get the synchronized reference time
	 */
	getTimeOffset() {
		return this.timeoffset;
	}

	/**
	 * Returns the synchronized reference time
	 */
	getSyncedTime() {
		return (new Date()).getTime() + this.timeoffset;
	}

	/**
	 * Returns the suggested latency to symphony (assuming the same as conductor)
	 */
	getLatency() {
		return this.lowestLat * 1.2;
	}

	// Private methods

	_connected() {
		this.isConnected = true;
		this.subscribe(`orchestra/p2p/${this.myId}`);
		this.subscribe(`orchestra/broadcast`);
		if (this.callbacks.connected) {
			this.callbacks.connected();
		}
	}

	_processRxMessage(topic, messageText) {
		let message;
		try {
			message = JSON.parse(messageText);
		} catch(e) {
			console.warn("Failed to parse message:", message, e);
			return;
		}

		let msgType = message.msg_type;

		if (!msgType) {
			console.warn("Received message is missing msg_type");
			return;
		}

		let msgId = message.msg_id;

		// Auto resend pings
		if (msgType === "ping") {
			this.sendResponse(message, {});
		} else if (msgType === "start_song") {
			// start time sync first, passing the start-song trigger topic and message
			this.syncRetries = 5;	 // sync time sample size
			this.lowestLat = 500; // lowest latency starting point
			this.timeoffset = 0;
			this._sendTimeRequest(topic, message);
		} else if (msgType.endsWith("_response") && this.pendingReplies[msgId]) {
			let info = this.pendingReplies[msgId];
			clearTimeout(info.timer);
			info.callback(info.txMessage, message);
		} else {
			if (this.callbacks[msgType]) {
				this.callbacks[msgType](topic, message);
			} else {
				console.log("Unhandled message. Message type: ", msgType, topic, "Full message:", message);
			}
		}

	}

	_sendTimeRequest(startSongTopic, startSongMessage) {
		const pingMessage = {
			msg_type: 'ping'
		};
		this.sendMessage(startSongMessage.time_server_topic, pingMessage, (txMessage, rxMessage) => {
			this._handleTimeResponse(txMessage, rxMessage, startSongTopic, startSongMessage);
		});
	}

	_handleTimeResponse(txMessage, rxMessage, startSongTopic, startSongMessage) {
		let latency = ((new Date()).getTime() - txMessage.current_time) / 2;
		console.log('Got ping response! Latency:' + latency + ', Reference time:' + rxMessage.current_time);
		if (latency < this.lowestLat) {
			this.timeoffset = rxMessage.current_time - ((new Date()).getTime() + txMessage.current_time) / 2;
			this.lowestLat = latency;
			console.log('Updating time offset:', this.timeoffset, latency);
		}
		// iterate or call callback when ready
		if (--this.syncRetries > 0) {
				this._sendTimeRequest(startSongTopic, startSongMessage);
		} else {
			if (this.callbacks.start_song) {
				this.callbacks.start_song(startSongTopic, startSongMessage);
			}
		}
	}
}

