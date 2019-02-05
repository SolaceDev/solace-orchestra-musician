<template>
	<section>
		<welcome v-if="!loggedIn" :name.sync="name" @connect-pressed="connect"></welcome>
		<game v-if="loggedIn" @note-played="playNote" ref="game" :hits.sync="hits" :misses.sync="misses"></game>
	</section>
</template>

<script>
import Welcome from "./components/Welcome.vue";
import Game from "./components/Game.vue";
import Messaging from "./messaging/Messaging";

export default {

	components: {
		welcome: Welcome,
		game: Game
	},

	data() {
		console.log("data")
		return {
			name: null,
			loggedIn: false,
			enabled: true,
			songPlaying: false,
			hits: 0,
			misses: 0,
			theatreId: "default",
			selectedInstrument: {
				value: 0
			},
			channelId: 0
		};
	},

	created() {
		this.messaging = new Messaging();
		console.log("created");
		this.messaging.on("connected", this.connected.bind(this));
		this.messaging.on("start_song", this.startSong.bind(this));
		this.messaging.on("stop_song", this.stopSong.bind(this));
		this.messaging.on("complete_song", this.stopSong.bind(this));
		this.messaging.on("note_list", this.receiveMusicScore.bind(this));
		this.messaging.on("enable", this.enableMusician.bind(this));
		this.messaging.on("disable", this.disableMusician.bind(this));
		this.messaging.on("register_response", this.registerResponse.bind(this));
		this.messaging.on("reregister", this.reregister.bind(this));
	},

	mounted() {
		console.log("mounted")
	},

	update() {
		console.log("update")
	},

	destroyed() {
		console.log("destroy")
		this.messaging.disconnect();
	},

	methods: {
		connect: function(instrument) {
			if (!this.name) {
				return;
			}
			this.selectedInstrument = instrument;
			this.messaging.connect();
		},
		connected: function() {
			this.messaging.subscribe("orchestra/theatre/default");
			this.registerMusician(this.name);
		},
		registerMusician: function(musicianName) {
			var publisherTopic = "orchestra/registration";
			var messageJson = {
				msg_type: "register",
				component_type: "musician",
				name: musicianName
			};
			this.messaging.sendMessageAsync(publisherTopic, messageJson).then(() => {
				console.log("Musician Registered");
				this.loggedIn = true;
			});
		},
		resetScore: function() {
			this.hits = 0;
			this.misses = 0;
		},
		receiveMusicScore: function(topic, message) {
			var timeOffset = this.messaging.getTimeOffset();
			this.$refs.game.playSong(message, timeOffset, this.songName);
		},
		startSong: function(topic, message) {
			console.log("Start song ", topic, message);
			this.resetScore();
			this.channelId = message.channel_id;
			var subscriberTopic = `orchestra/theatre/default/${this.channelId}`;
			this.messaging.subscribe(subscriberTopic);
			this.songPlaying = true;
			this.songName = message.song_name;

			this.messaging.sendMessage(`orchestra/theatre/default`, {
				'msg_type': 'player_start',
				'channel_id': this.channelId,
				'name': this.name
			});

			if (this.scoreUpdater) {
				clearInterval(this.scoreUpdater);
			}

			this.scoreUpdater = setInterval(() => {
				this.sendScoreMessage();
			}, 2500);

			this.messaging.sendResponse(message, {});

			// Show the countdown
			// this.startCountdown();
		},
		stopSong: function(message) {
			this.songPlaying = false;
			this.songName = null;

			clearInterval(this.scoreUpdater);
			this.scoreUpdater = undefined;

			var subscriberTopic = `orchestra/theatre/${this.theatreId}/${this.channelId}`;
			this.messaging.unsubscribe(subscriberTopic);
			this.messaging.sendResponse(message, {});

			// Reset to original channel
			this.channelId = "0";
		},
		playNote: function(button) {
			let currentTime = Date.now();
			if (!this.messaging || !this.enabled) {
				console.log("no play", this.messaging, this.enabled);
				return;
			}
			if (this.songPlaying) {
				let nextNote = button.notes[0];
				if (!nextNote) {
					this.misses++;
					return;
				}
				if (currentTime > nextNote.minTime && currentTime < nextNote.maxTime) {
					nextNote.hit = true;
					button.notes.shift();
				}
				return;
			}
			let message = {
				current_time: currentTime,
				msg_type: 'note',
				note_list: [
					{
						program: this.selectedInstrument.value,
						note: button.value,
						channel: 0,
						duration: 750,
						play_time: currentTime
					}
				]
			};
			var publisherTopic = `orchestra/theatre/default/${this.channelId}`;
			this.messaging.sendMessage(publisherTopic, message);
		},
		enableMusician: function() {
			this.enabled = true;
		},
		disableMusician: function() {
			console.log("disbaled");
			this.enabled = false;
		},
		registerResponse: function() {
			console.log('Received register_response');
		},
		reregister: function() {
			this.loggedIn = false;
			this.registerMusician(this.name);
			console.log("reregister")
		},
		sendScoreMessage: function() {
			let notes = this.hits + this.misses;
			let percent = 0;
			if (notes !== 0) {
				percent = Math.floor((this.hits / notes) * 100);
			}
			this.messaging.sendMessage(`orchestra/theatre/${this.theatreId}/score_update`, {
				'msg_type':         'score_update',
				'channel_id':       this.channelId,
				'name':             this.name,
				'hits':             this.hits,
				'misses':           this.misses,
				'spontaneousNotes': 0,
				'percent':          percent
			});
		}
	},
};
</script>

<style>
body,
html {
	height: 100%;
	font-family: "Roboto", sans-serif;
	font-size: 24px;
}

body {
	margin: 0;
	background: #121716;
}

.flex {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}
.flex-center {
	flex: 1;
}
.flex-row {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
}
</style>

