<template>
	<section class="flex welcome">
		<img class="logo" src="static/logo.png">
		<div class="name">
			<input type="text" placeholder="Enter name" :value="name" @input="$emit('update:name', $event.target.value)">
		</div>
		<div class="instruments flex">
			<div v-for="instrument of instruments" :key="instrument.id" @click="$emit('connect-pressed', instrument)" class="instrument">
				<img :src="`static/${instrument.id}.svg`">
				<span>{{instrument.name}}</span>
			</div>
		</div>
	</section>
</template>

<script>
	export default {
		props: ['name', 'instrument'],
		data: function() {
			return {
				instruments: [
					{
						id: "xylophone",
						name: "Xylophone",
						value: 9
					}, {
						id: "music",
						name: "Piano",
						value: 0
					}, {
						id: "tuba",
						name: "Tuba",
						value: 58
					}, {
						id: "drum",
						name: "Accordian",
						value: 22
					}, {
						id: "bugle",
						name: "Trumpet",
						value: 57
					}, {
						id: "guitar",
						name: "Guitar",
						value: 25
					}, {
						id: "violin",
						name: "Violin",
						value: 41
					}, {
						id: "piccolo",
						name: "Flute",
						value: 74
					}
				]
			}
		}
	}
</script>

<style>
.welcome {
	background: #121716;
	color: white;
	height: 100vh;
}
.logo {
	height: 20vh;
}
.instruments {
	height: 60vh;
	border: solid 1px black;
	border-radius: 4px;
	background: rgba(255, 255, 255, 0.1);
	width: 60vw;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
}
.name {
	width: 60vw;
	height: 14vh;
	position: relative;
}

input {
	border: solid 1px black;
	border-radius: 4px;
	color: white;
	padding: 2vh;
	font-size: 6vh;
	width: 60vw;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.1);
}

.instrument {
	height: 15vh;
	width: 30vw;
	display: flex;
	align-items: center;
}

.instrument img {
	height: 13vh;
	padding: 1vh 1vw;
	display: block;
}

</style>

