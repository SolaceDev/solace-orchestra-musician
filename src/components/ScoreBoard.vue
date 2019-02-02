<template>
	<div id="score" class="flex">
		<div class="flex">
			<span class="instrument">Current Instrument</span>
		</div>
		<div class="flex">
			<label>Hits</label>
			<span class="value">{{hits}}</span>
		</div>
		<div class="flex">
			<label>Misses</label>
			<span class="value">{{misses}}</span>
		</div>
		<div class="flex">
			<label>Percent</label>
			<span class="value">{{percent}}</span>
		</div>
	</div>
</template>

<script>
	export default {
		props: ['hits', 'misses'],
		computed: {
			percent: function() {
				let notes = this.hits + this.misses;
				if (notes === 0) {
					return 0;
				}
				return Math.floor((this.hits / notes) * 100);
			}
		}
	}
</script>

<style>
.flex {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
}
.flex-center {
	flex: 1;
}
.instrument {
	font-size: 1rem;
}

.flex > div {
	border-left: 2px solid white;
	padding: 0 0.5rem;
}

.flex > div:first-child {
	border-left: unset;
}

#score {
	color: white;
	font-size: 0.5rem;
	padding: 4px;
	background-color: #00c895;
	width: 100vw;
	z-index: 11;
}

label {
	color: white;
	margin-right: 10px;
}

.value {
	font-size: 1rem;
}

#score td {
	padding-left: 8px;
}
</style>

