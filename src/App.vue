<template>
	<section>
		<div class="container">
			<div class="lines">
				<div v-for="(button, index) in buttons" :key="button.value" class="line" :class="'line' + index">
					<div v-for="note in button.notes" :key="note.id" class="note" :class="note.hide" :style="{background: button.color}"></div>
					<div class="button" :class="button.pressed" :style="{background: button.color}"></div>
				</div>
			</div>
		</div>
		<div class="buttons flex">
			<a class="flex-center flex button-space" v-for="button in buttons" :key="button.index" @click="buttonClicked(button)" @mouseUp="updateButtonState(button, true)" @mouseDown="updateButtonState(button, false)"></a>
		</div>
		<score-board :hits="score.hits" :misses="score.misses" style="position: absolute; right: 0; top: 0px;"></score-board>
		<div id="instruments">
			<label>Current Instrument</label>
			<select v-model="selectedInstrument">
				<option v-for="instrument in instruments" :key="instrument.id" :value="instrument">{{instrument.name}}</option>
			</select>
		</div>
	</section>
</template>

<script>
import ScoreBoard from "./components/ScoreBoard.vue";
import Messaging from "./messaging/Messaging";

export default {

	// Knobs for difficulty
	hitThreshold: 200,
	notesTooCloseThreshold: 200,

	components: {
		ScoreBoard
	},

	data() {
		return {
			score: {
				hits: 0,
				misses: 0,
				streak: 0
			},
			instruments: [
				{
					id: "acoustic_grand_piano",
					name: "Piano",
					value: 0
				}, {
					id: "harpsichord",
					name: "Harpsichord",
					value: 4
				}, {
					id: "xylophone",
					name: "Xylophone",
					value: 9
				}, {
					id: "accordian",
					name: "Accordian",
					value: 22
				}, {
					id: "harmonica",
					name: "Harmonica",
					value: 24
				}, {
					id: "acoustic_guitar_nylon",
					name: "Guitar",
					value: 25
				}, {
					id: "violin",
					name: "Violin",
					value: 41
				}, {
					id: "flute",
					name: "Flute",
					value: 42
				}
			],
			buttons: [
				{
					color: "#63f4de",
					value: 60,
					notes: [],
					pressed: ''
				}, {
					color: "#d83439",
					value: 62,
					notes: [],
					pressed: ''
				}, {
					color: "#38b439",
					value: 64,
					notes: [],
					pressed: ''
				}, {
					color: "#e9cd54",
					value: 65,
					notes: [],
					pressed: ''
				}, {
					color: "#811ed1",
					value: 67,
					notes: [],
					pressed: ''
				}, {
					color: "#e66224",
					value: 69,
					notes: [],
					pressed: ''
				}, {
					color: "#e041ab",
					value: 71,
					notes: [],
					pressed: ''
				}
			],
			selectedInstrument: null,
			notesTooCloseThreshold: 200,
			sliderTimeSecs: 1.5,
			sliderTimeouts: [],
			notes: [],
			nextNoteId: 0,
			theatreId: "default",
			channelId: 0,
			musicianName: 'kevin',
			enabled: true,
			scoreUpdater: null
		};
	},

	mounted() {
		window.scrollTo(0, 1);
	},

	created() {
		let index = 0;
		// Remove address bar
		this.selectedInstrument = this.instruments[Math.floor(Math.random() * this.instruments.length + 1)];
		console.log(this.selectedInstrument);

		this.messaging = new Messaging({
			callbacks: {
				connected: (...args)         => this.connected(...args),
				note_list: (...args)         => this.receiveMusicScore(...args),
				start_song: (...args)        => this.startSong(...args),
				stop_song: (...args)         => this.stopSong(...args),
				complete_song: (...args)     => this.stopSong(...args),
				enable: (...args)            => this.enableMusician(...args),
				disable: (...args)           => this.disableMusician(...args),
				register_response: (...args) => this.registerResponse(...args),
				reregister: (...args)        => this.reregister(...args),
			}
		});

    // // Start the demo
    // this.addDemoSliders();

	},

	destroyed() {
		this.messaging.disconnect();
	},

	methods: {
		resetScore: function() {
			this.score.hits = 0;
			this.score.misses = 0;
			this.score.streak = 0;
		},
		connected: function() {
			console.log("Connected");
			this.messaging.subscribe("orchestra/theatre/default");
			this.registerMusician(this.musicianName);
		},
		receiveMusicScore: function(topic, message) {
			console.log("Music");
			if (message.note_list) {

				let lastTime = -9999;
				let highChannel = true;

				// Go over each received note
				message.note_list.forEach(noteMessage => {

					// Add the slider 1.5 seconds ahead of time
					var currentTime = this.messaging.getSyncedTime();
					var latencyToSymphony = 200;
					var timeoutSeconds = noteMessage.play_time - currentTime - (this.sliderTimeSecs * 1000) - latencyToSymphony;

					// If the note isn't too close to the last note, add it
					if (this.songName === 'super-mario-underwater-nintendo-piano-level-6' || (timeoutSeconds > 0 && (timeoutSeconds - lastTime) > this.notesTooCloseThreshold)) {
						lastTime = timeoutSeconds;
						let noteType = noteMessage.note % 12;
						if (this.songName === 'super-mario-underwater-nintendo-piano-level-6') {
							if (highChannel && noteMessage.note <= 60) {
								console.log("Dropping ", noteMessage.note);
								return;
							} else if (!highChannel && noteMessage.note > 60) {
								console.log("Dropping ", noteMessage.note);
								return;
							}
						}
						let track = 0;
						if (noteType === 0 || noteType === 1) {
							track = 0; // C, C# map to first track
						} else if (noteType === 2 || noteType === 3) {
							track = 1; // D, D# map to seond track
						} else if (noteType === 4) {
							track = 2; // E maps to third track
						} else if (noteType === 5 || noteType == 6) {
							track = 3; // F, F# map to fourth track
						} else if (noteType === 7 || noteType == 8) {
							track = 4; // G, G# map to fifth track
						} else if (noteType === 9 || noteType == 10) {
							track = 5; // A, A# map to sixth track
						} else if (noteType === 11) {
							track = 6; // B maps to seventh track
						}
						let realTime = noteMessage.play_time;
						this.sliderTimeouts.push(setTimeout(() => {
							this.addNote(noteMessage.note_id, track, noteMessage, realTime - 300, realTime + 300);
						}, timeoutSeconds));

					}
				});
			}
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
				'name': this.musicianName
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

			// Cleanup existing notes
			this.sliderTimeouts.forEach(timeout => clearTimeout(timeout));
			this.sliderTimeouts = [];

			// Reset to original channel
			this.channelId = "0";
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
			this.registerMusician(this.musicianName);
			console.log("reregister")
		},
		addNote: function(id, buttonIndex, noteMessage, minTime, maxTime) {
			let notes = this.buttons[buttonIndex].notes;
			let note = {
				id: id,
				message: noteMessage,
				hide: false,
				hit: false,
				minTime: minTime,
				maxTime: maxTime
			};
			notes.push(note);
			setTimeout(() => {
				note.hide = "hide";
			}, 1500);
			setTimeout(() => {
				if (note.hit) {
					this.score.hits++;
				} else {
					notes.shift();
					this.score.misses++;
				}
			}, 2000);
		},
		buttonClicked: function(button) {
			let currentTime = Date.now();
			if (!this.messaging || !this.enabled) {
				console.log("no play", this.messaging, this.enabled);
				return;
			}
			if (this.songPlaying) {
				let nextNote = button.notes[0];
				if (!nextNote) {
					this.score.misses++;
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
		registerMusician: function(musicianName) {
			var publisherTopic = `orchestra/registration`;
			var messageJson = {
				msg_type: 'register',
				component_type: 'musician',
				name: this.musicianName
			};
			this.messaging.sendMessage(publisherTopic, messageJson);
		},
		sendScoreMessage: function() {
			let total = this.score.hits + this.score.misses;
			let percent = total ? (100.0 * this.score.hits / total).toFixed(0) : "";
			this.messaging.sendMessage(`orchestra/theatre/${this.theatreId}/score_update`, {
				'msg_type':         'score_update',
				'channel_id':       this.channelId,
				'name':             this.musicianName,
				'hits':             this.score.hits,
				'misses':           this.score.misses,
				'spontaneousNotes': this.score.spontaneousNotes,
				'percent':          percent
			});
		},
		updateButtonState(button, pressed) {
			console.log(button, pressed);
			if (pressed) {
				button.pressed = "pressed";
			} else {
				button.pressed = "";
			}
		}
	}
};
</script>

<style>
.flex {
	display: flex;
	flex-direction: row;
	justify-content: center;
}
.flex-center {
	flex: 1;
}

@keyframes slide-anim1 {
	0% {
		transform: translateX(-50%) translateY(0);
	}
	100% {
		transform: translateX(-50%) translateY(100vh);
	}
}

body,
html {
	height: 100%;
	font-family: "Roboto", sans-serif;
	font-size: 24px;
	background: black;
}
body {
	margin: 0;
}

body::before {
	background-image: url(../static/bg.png);
	background-size: cover;
	content: "";
	display: block;
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	opacity: 0.4;
}

.container {
	height: 100vh;
	width: 100vw;
	position: fixed;
	top: -10vh;
	left: 0;
	perspective: 100vh;
	pointer-events: none;
	z-index:10;
}

.lines {
	width: 60vw;
	height: 105vh;
	position: relative;
	transform: rotateX(60deg);
	display: flex;
	flex-direction: row;
	justify-content: center;
	margin: 0 auto;
	border-left: 3px solid #63f4de;
	border-right: 3px solid #63f4de;
}

.line {
	width: 2px;
	height: 100%;
	margin: 0 4vw;
	position: relative;
	background-image: linear-gradient( 90deg, rgb(255,255,255), rgb(0,0,0));
}

.buttons {
	height: 10vh;
	width: 100vw;
	position: fixed;
	bottom: 0;
	left: 0;
	z-index: 2000;
}

.button {
	width: 5vw;
	height: 6vh;
	transform: translateX(-50%) translateY(100vh);
	position: absolute;
	border-radius: 2px;
}

.button.pressed {
	background: white !important;
}

.button-space {
	height: 25vh;
}

.note {
	width: 5vw;
	height: 10px;
	margin-left: -7.15%;
	transform: translateX(-50%) translateY(0);
	animation-name: slide-anim1;
	animation-duration: 1.5s;
	animation-iteration-count: 1;
	animation-timing-function: linear;
	position: absolute;
	transform-style: flat;
	border-radius: 2px;
}

.my-button:active {
	transform: translateX(1px) translateY(1px);
	outline: none;
}
#instruments {
	z-index: 100;
}
.hide {
	display: none;
}
</style>

