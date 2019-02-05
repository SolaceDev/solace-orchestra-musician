<template>
	<section class="game">
		<div class="container">
			<div class="lines">
				<div v-for="(button, index) in buttons" :key="button.value" class="line" :class="'line' + index">
					<div v-for="note in button.notes" :key="note.id" class="note" :class="note.hide" :style="{background: button.color}"></div>
					<div class="button" :class="button.pressed" :style="{background: button.color}"></div>
				</div>
				<footer></footer>
			</div>
		</div>
		<div class="buttons flex-row">
			<v-touch class="flex-center button-space" v-for="button in buttons" :key="button.index" v-on:tap="buttonClicked(button)"></v-touch>
		</div>
		<score-board :hits="hits" :misses="misses" style="position: absolute; right: 0; top: 0px;"></score-board>
	</section>
</template>

<script>
import ScoreBoard from "./ScoreBoard.vue";

export default {

	// Knobs for difficulty
	hitThreshold: 200,
	200: 200,

	components: {
		ScoreBoard
	},

	props: ['name', 'instrument', 'messaging', 'hits', 'misses'],

	data() {
		return {
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
			200: 200,
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

	},

	methods: {
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
				console.log("NOW!");
			}, 1500);
			setTimeout(() => {
				if (note.hit) {
					this.$emit('update:hits', this.hits + 1);
				} else {
					notes.shift();
					this.$emit('update:misses', this.misses + 1);
				}
			}, 2000);
		},
		buttonClicked: function(button) {
			this.$emit("note-played", button);
		},
		playSong: function(song, timeOffset, songName) {
			if (song.note_list) {

				let lastTime = -9999;
				let highChannel = true;

				// Go over each received note
				song.note_list.forEach(noteMessage => {
					console.log(noteMessage);

					// Add the slider 1.5 seconds ahead of time
					let currentTime = Date.now() + timeOffset;
					var latencyToSymphony = 200;
					var timeoutSeconds = noteMessage.play_time - currentTime - (this.sliderTimeSecs * 1000) - latencyToSymphony;

					// If the note isn't too close to the last note, add it
					if (songName === 'super-mario-underwater-nintendo-piano-level-6' || (timeoutSeconds > 0 && (timeoutSeconds - lastTime) > 200)) {
						// if (timeoutSeconds === lastTime) {
						// 	// single note at a time only
						// 	return;
						// }
						lastTime = timeoutSeconds;
						let noteType = noteMessage.note % 12;
						if (songName === 'super-mario-underwater-nintendo-piano-level-6') {
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
		stopSong: function() {
			this.sliderTimeouts.forEach(timeout => clearTimeout(timeout));
			this.sliderTimeouts = [];
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
.game {
	background: url(../../static/bg.png) no-repeat;
	background-size: 100% auto;
	height: 100vh;
	width: 100vw;
}

@keyframes slide-anim1 {
	0% {
		transform: translateX(-50%) translateY(0);
	}
	100% {
		transform: translateX(-50%) translateY(90vh);
	}
}

.container {
	height: 10vh;
	width: 100vw;
	position: fixed;
	top: -20vh;
	left: 0;
	perspective: 100vh;
	pointer-events: none;
	z-index:10;
}

.lines {
	width: 60vw;
	height: 100vh;
	position: relative;
	transform: rotateX(70deg);
	display: flex;
	flex-direction: row;
	justify-content: center;
	margin: 0 auto;
	box-shadow: 0 0 10px #63f4de;
	box-shadow: 0 15px 0px 0px #121716, 0 -15px 0px 0px #121716, 0px 0 15px -4px #63f4de, 0px 0 15px 4px #63f4de
}

.line {
	width: 2px;
	height: 100%;
	margin: 0 4vw;
	position: relative;
	background-image: linear-gradient( 90deg, rgb(255,255,255), rgb(0,0,0));
	z-index: 10;
}

footer {
	width: 60vw;
	position: absolute;
	bottom: 0;
	left: 0;
	height: 12vh;
	transform: translateY(2vh);
	border-top: 1px solid black;
	background: rgba(255, 255, 255, 0.4);
}

.buttons {
	height: 30vh;
	width: 100vw;
	position: fixed;
	bottom: 0;
	left: 0;
	z-index: 2000;
}

.button {
	width: 5vw;
	height: 8vh;
	transform: translateX(-50%);
	position: absolute;
	bottom: 0;
	border-radius: 2px;
}

.button.pressed {
	background: white !important;
}

.button-space {
	height: 30vh;
}

.note {
	width: 5vw;
	height: 6vh;
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

