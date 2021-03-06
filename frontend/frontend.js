var globalData;
$(document).ready(function () {
	loadData().then(function (data) {
		var option;
		globalData = data;
		for (var i in globalSubreddits) {
			if (globalSubreddits.hasOwnProperty(i)) {
				option = $('<option/>');
				option.val(globalSubreddits[i]);
				option.text(globalSubreddits[i]);
				$('#scatter_filter_subreddit').append(option);
			}
		}
		$('#scatter_filter_subreddit').chosen();

		renderScatter();
		$('#scatter_x').change(renderScatter);
		$('#scatter_y').change(renderScatter);
		$('#scatter_color').change(renderScatter);
		$('#scatter_color_count').change(renderScatter);
		$('#scatter_filter_all').change(renderScatter);
		$('#scatter_filter_front').change(renderScatter);
		$('#scatter_filter_subreddit').change(renderScatter);

		renderPie();
		$('#pie_option').change(renderPie);
		$('#pie_count').change(renderPie);
		$('#pie_source').change(renderPie);
		$('#pie_type').change(renderPie);
		$('#pie_nsfw').change(renderPie);

		renderPositions();
		$('#line_color').change(renderPositions);
		$('#line_y').change(renderPositions);
		$('#line_count').change(renderPositions);
		$('#line_order').change(renderPositions);

		renderTime()
		$('#time_color').change(renderTime);
		$('#time_count').change(renderTime);
		$('#time_y').change(renderTime);
		$('#time_nsfw').change(renderTime);
		$('#time_type').change(renderTime);
	});
});

function renderScatter() {
	var x, y, color, count, rel = globalData, xTitle, yTitle, flipX, flipY, fit, i,
		filterFront, filterAll, filterSub;
	x = $('#scatter_x').val();
	y = $('#scatter_y').val();
	filterAll = $('#scatter_filter_all').is(':checked');
	filterFront = $('#scatter_filter_front').is(':checked');
	if (x.indexOf('All') > 1 || y.indexOf('All') > 1 || filterAll) {
		rel = Data.filter(rel, {}, {maxAll: 101});
	}
	if (x.indexOf('Front') > 1 || y.indexOf('Front') > 1 || filterFront) {
		rel = Data.filter(rel, {}, {maxFront: 101});
	}
	if (x == 'self_length' || y == 'self_length') {
		rel = Data.filter(rel, {}, {self_length: 0});
	}
	filterSub = $('#scatter_filter_subreddit').val();
	flipX = (x.substr(0, 3) === 'max')
	flipY = (y.substr(0, 3) === 'max')
	color = $('#scatter_color').val();
	count = $('#scatter_color_count').val();
	xTitle = $('#scatter_x').children("option:selected").text();
	yTitle = $('#scatter_y').children("option:selected").text();
	if (filterSub) {
		for (i = 0; i < filterSub.length; i++) {
			rel = Data.filter(rel, {subreddit: filterSub });
		}
	}
	rel = Data.select(rel, [x, y, color, 'redditId']);
	rel = Data.group(rel, 2);
	rel = Data.sortObject(rel, 'length');
	rel = Data.first(rel, count);
	if (!renderScatter.paper) {
		renderScatter.paper = Raphael("scatter", 800, 800)
	}
	renderScatter.paper.clear();
	renderScatter.paper.scatterPlot(605, 605, rel, xTitle, yTitle, flipX, flipY, 3);
}
renderScatter.paper = null;

function renderPie() {
	var counts, color, count, split, source, data, other, type, nsfw;
	if (!renderPie.paper) {
		renderPie.paper = Raphael("pie", 700, 700)
	}
	data = globalData;
	color = $('#pie_option').val();
	count = $('#pie_count').val();
	source = $('#pie_source').val();
	type = $('#pie_type').val();
	nsfw = $('#pie_nsfw').val();
	if (source === 'frontpage') {
		data = Data.filter(data, {}, {maxFront: 101});
	}
	if (source === 'all') {
		data = Data.filter(data, {}, {maxAll: 0});
	}
	if (type !== 'all') {
		data = Data.filter(data, {type: type});
	}
	if (nsfw !== 'all') {
		data = Data.filter(data, {nsfwLabel: nsfw});
	}
	counts = Data.count(data, color);
	counts = Data.sortObject(counts);
	split = Data.split(counts, count);
	counts = split.first;
	other = Data.sum(split.last);
	if (other) {
		counts['Other'] = other;
	}
	renderPie.paper.clear();
	renderPie.paper.pieChart(450, 350, 200, counts, "#fff", 10, 100);
}
renderPie.paper = null;

function renderPositions() {
	var data, source, groups = {}, i, groupBy, group, x, y, max, order;
	if (!renderPositions.paper) {
		renderPositions.paper = Raphael("line", 700, 700)
	}
	source = 'positionsAll';
	groupBy = $('#line_color').val();
	x = 'age';
	y = $('#line_y').val();
	order = parseInt($('#line_order').val(), 10);
	max = $('#line_count').val();
	data = globalData;
	data = Data.group(data, groupBy);
	data = Data.sortObject(data, 'length');
	data = Data.first(data, max);
	for (i in data) {
		if (data.hasOwnProperty(i)) {
			data[i] = Data.selectOne(data[i], source);
			data[i] = Data.flattenArray(data[i]);
			data[i] = Data.fit(data[i], x, y, order);
		}
	}
	renderPositions.paper.clear();
	renderPositions.paper.lineGraph(600, 600, data);

}
renderPositions.paper = null;

function renderTime() {
	var data, groupBy, fields, count, field, maxY = 0, i, j, height = 600, width = 800,
		scaleY, xSteps = {}, ySteps = {}, yLabel, type, nsfw, oldData;
	if (!renderTime.paper) {
		renderTime.paper = Raphael("time", 1000, 700)
	}
	groupBy = $('#time_color').val();
	count = $('#time_count').val();
	field = $('#time_y').val();
	yLabel = $('#time_y').children("option:selected").text();
	type = $('#time_type').val();
	nsfw = $('#time_nsfw').val();
	data = globalData;
	if (type !== 'all') {
		data = Data.filter(data, {type: type});
	}
	if (nsfw !== 'all') {
		data = Data.filter(data, {nsfwLabel: nsfw});
	}
	if (groupBy === 'none') {
		oldData = data;
		data = {};
		data['All'] = oldData;
	} else {
		data = Data.group(data, groupBy);
	}
	data = Data.sortObject(data, 'length');
	data = Data.first(data, count);
	fields = ['up', 'down', 'comments', 'time'];
	for (i in data) {
		if (data.hasOwnProperty(i)) {
			data[i] = Data.selectOne(data[i], 'changes');
			data[i] = Data.flattenArray(data[i]);
			data[i] = Data.average(data[i], 'time', fields);
			data[i] = Data.toArray(data[i]);
			data[i] = Data.select(data[i], ['time', field]);
			data[i] = Data.movingAverage(data[i], 20);
			for (j = 1; j < data[i].length; j++) {
				if (data[i][j][0] - data[i][j - 1][0] > 120) { //no data for 2 hours
					data[i].push([
						data[i][j][0] - 10,
						0
					]);
					data[i].push([
						data[i][j - 1][0] + 10,
						0
					]);
				}
			}
			data[i].sort(function (a, b) {
				return a[0] - b[0];
			});
		}
	}
	for (i in data) {
		if (data.hasOwnProperty(i)) {
			for (j = 0; j < data[i].length; j++) {
				if (data[i][j][1] > maxY) {
					maxY = data[i][j][1];
				}
			}
		}
	}
	scaleY = height / maxY;
	for (i = 0; i <= height; i += 50) {
		ySteps[i] = Math.round((i * scaleY) / 10);// 10 minutes interval measurements
	}
	j = 0;
	for (i = 0; i <= width + 10; i += (width / 24)) {
		xSteps[Math.round(i)] = j + ':00';
		j++;
	}
	renderTime.paper.clear();
	renderTime.paper.lineGraph(width, height, data);
	renderTime.paper.drawGenericAxis(width, height, 'UTC time', yLabel + ' per minute', xSteps, ySteps);
}
renderTime.paper = null;
