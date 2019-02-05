<template>
	<div id="score" class="flex-row">
		<div class="flex-row">
			<img src="static/solace.png">
		</div>
		<div class="score-item flex-row">
			<label>Hits</label>
			<span class="value">{{hits}}</span>
		</div>
		<div class="score-item flex-row">
			<label>Misses</label>
			<span class="value">{{misses}}</span>
		</div>
		<div class="score-item flex-row">
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
.instrument {
	font-size: 1rem;
}

.score-item {
	padding: 0 0.5rem;
}

#score {
	color: white;
	font-size: 0.5rem;
	padding: 4px;
	background-color: #00c895;
	width: 100vw;
	z-index: 11;
	height: 10vh;
}

#score img {
	height: 8vh;
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

