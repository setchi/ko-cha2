define(function () {
	var positionsEnum = {
		LEFT: 0,
		RIGHT: 1,
		TOP: 2,
		BOTTOM: 3,
		FULLSCREEN: 4,
		pair: []
	};

	positionsEnum.pair[positionsEnum.LEFT] = positionsEnum.RIGHT;
	positionsEnum.pair[positionsEnum.RIGHT] = positionsEnum.LEFT;
	positionsEnum.pair[positionsEnum.TOP] = positionsEnum.BOTTOM;
	positionsEnum.pair[positionsEnum.BOTTOM] = positionsEnum.TOP;
	positionsEnum.pair[positionsEnum.FULLSCREEN] = positionsEnum.FULLSCREEN;

	return positionsEnum;
});
