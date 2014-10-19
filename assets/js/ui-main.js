/*
 * ユーザインタフェースの制御
 */

$(function () {

/**
 * エディタの移動先を示す半透明フレームの処理
 */

var MarkFrame = function (r, g, b) {
	this.markFrame = $('<dvi></div>').addClass('mark-frame').css({
		'background-color': 'rgba(' + r + ', ' + g + ', ' + b + ', 0.05)',
		'border': '1px solid ' + 'rgb(' + r + ', ' + g + ', ' + b + ')',
		'top': 0,
		'left': 0,
		'width': 0,
		'height': 0
	}).appendTo('body');
}
MarkFrame.prototype = {
	remove: function () {
		this.markFrame.remove();
	},

	moveTo: function (top, left, width, height) {
		this.markFrame.css({
			'top': top,
			'left': left,
			'width': width + 'px',
			'height': height + 'px'
		});
	}
}


/**
 * サイドバーの横幅を調整するハンドルのドラッグ処理
 */

var SidebarHandle = {
	dragging: false,
	startX: 0,
	beforeWidth: 0,
	$sidebar: $(document.getElementsByClassName('sidebar')).width('20%'),
	$editorRegion: $(document.getElementById('editor-region')),
	windowWidth: $(window).width(),
	minSidebarWidth: 94,
	sizeChangedCallback: null,

	setCallback: function (callback) {
		this.sizeChangedCallback = callback;
		return this;
	},

	dragStart: function (startX) {
		this.dragging = true;
		this.startX = startX;
		this.beforeWidth = this.$sidebar.width();
		this.windowWidth = $(window).width();
	},

	dragEnd: function () {
		if (this.dragging) {
			// nothing
		}
		this.dragging = false;
	},

	dragMoveTo: function (pageX) {
		if (!this.dragging) return;
		var movedAmount = pageX - this.startX;
		var afterWidth = Utils.rangeFilter(
			movedAmount + this.beforeWidth,
			this.minSidebarWidth,
			this.windowWidth - 50
		);
		this.resize(this.windowWidth, afterWidth);
	},

	resize: function (windowWidth, afterWidth) {
		if (afterWidth === 0) afterWidth = this.$sidebar.width();

		var editorPixelWidth = (windowWidth - afterWidth - 30);
		var sidebarWidth = (afterWidth) / windowWidth * 100;
		var editorWidth = editorPixelWidth / windowWidth * 100;

		this.$editorRegion.width(editorWidth + '%');
		this.$sidebar.width(sidebarWidth + '%');
		this.sizeChangedCallback();
	}
}


/*
 * エディタのタブ移動に関する処理
 */

var Tab = {
	dragging: false,
	startX: 0,
	startY: 0,
	startOffsetX: 0,
	startOffsetY: 0,
	tabMoving: false,
	target: null,
	targetId: null,
	temporaryTab: $('.temporary-tab'),
	targetTabWidth: 0,
	$root: null,
	rootOffset: null,
	rootWidth: null,
	rootHeight: null,
	isInside: null,
	markFrame: null,
	frameState: -1,

	dragStart: function (startX, startY, target) {
		this.dragging = true;
		this.startY = startY;
		this.startX = startX;
		this.startOffsetX = startX - $(target).offset().left;
		this.startOffsetY = startY - $(target).offset().top;
		this.target = target;
		this.$root = $(target).parents('.editor-root');
		this.rootOffset = this.$root.offset();
		this.rootWidth = this.$root.width();
		this.rootHeight = this.$root.height();
		this.targetId = this.$root.attr('id');
		UIEvent.fire('switch-tab', this.targetId, $(target).data('tab-id'));
		this.targetTabWidth = $(target).width();
	},

	dragEnd: function () {
		if (!this.dragging) return;
		this.tabMoving = false;
		this.dragging  = false;
		this.temporaryTab.remove();

		if (this.frameState !== -1) {
			UIEvent.fire('switch-tab-layout', this.targetId, $(this.target).data('tab-id'), this.frameState);
			this.frameState = -1;
		}
		if (this.isInside) {
			this.removeMarkFrame();
			this.isInside = false;
		}
	},

	dragMoveTo: function (pageX, pageY) {
		if (!this.dragging) return;
		if (this.targetId !== localSession.get(roomInfo.room.id)) return;
		var movedAmountX = pageX - this.startX;
		var movedAmountY = pageY - this.startY;
		if (!this.tabMoving) {
			if (-5 < movedAmountX && movedAmountX < 5) {
				return;
			}
			this.generateTemporaryTab();
			this.tabMoving = true;
		}

		this.temporaryTab.css({
			'left': pageX - this.startOffsetX,
			'top': pageY - this.startOffsetY
		});
		// タブ入れ替え用のY座標フィルター
		if (-30 < movedAmountY && movedAmountY < 30) {
			// タブの左右入れ替え
			if (movedAmountX > this.targetTabWidth >> 1) {
				this.swap(this.target, 'right');
			} else if (movedAmountX < -this.targetTabWidth >> 1) {
				this.swap(this.target, 'left');
			}
			this.removeMarkFrame();
		}
		var rootOffset = {};
		rootOffset.left = this.rootOffset.left;
		rootOffset.top  = this.rootOffset.top;
		var localX = pageX - rootOffset.left;
		var localY = pageY - rootOffset.top;
		var width = this.$root.width();
		var height = this.$root.height();
		var widthThreshold = 0.3;
		var heightThreshold = 0.4;

		if (localX < 0 ||
			localX > this.rootWidth ||
			localY < 0 ||
			localY > this.rootHeight) {
			if (this.isInside) {
				this.removeMarkFrame();
			}
			return;
		}
		if (!this.isInside) {
			this.markFrame = new MarkFrame(255, 0, 0);
			this.isInside = true;
			return;
		}
		var state = 0;
		if (localX < width * widthThreshold) {					// 左
			width >>= 1;
		} else if (localX > width - width * widthThreshold) {	// 右
			state = 1;
			width >>= 1;
			rootOffset.left += width;
		} else if (localY < height * heightThreshold) {		// 上
			state = 2;
			height >>= 1;
		} else if (localY > height - height * heightThreshold) {// 下
			state = 3;
			height >>= 1;
			rootOffset.top += height;
		} else {
			state = 4;
		}
		if (state !== this.frameState) {
			this.markFrame.moveTo(
				rootOffset.top + 34,
				rootOffset.left,
				width,
				height
			);
			this.frameState = state;
		}
	},

	generateTemporaryTab: function () {
		this.temporaryTab = $(this.target).clone().addClass('temporary-tab').appendTo('body');
	},

	removeMarkFrame: function () {
		this.frameState = -1;
		this.markFrame && this.markFrame.remove();
		this.isInside = false;
	},

	swap: function (target, direction) {
		switch (direction) {
		case 'left':
			var $prev = $(target).prev();

			this.startX -= this.targetTabWidth;
			$(target).insertBefore($prev).css({
				'left': this.targetTabWidth
			}).animate({ 'left': 0 }, 0);
			break;

		case 'right':
			var $next = $(target).next();

			this.startX += this.targetTabWidth;
			$(target).insertAfter($next).css({
				'left': -this.targetTabWidth
			}).animate({ 'left': 0 }, 0);
			break;
		}
	}
}


/*
 * Viewerアイコンの移動処理。ドロップ位置によってレイアウトを変更する。
 */

var ViewerIcon = {
	startX: 0,
	startY: 0,
	isPress: false,
	dragging: false,
	isInside: false,
	iconMoving: false,
	$target: null,
	$root: $(document.getElementById('editor-region')),
	temporaryViewerIcon: $(document.getElementsByClassName('temporary-icon')),
	markFrame: $(document.getElementsByClassName('mark-frame')),
	frameState: -1,

	dragStart: function (pageX, pageY, target) {
		this.startY = pageY;
		this.startX = pageX;
		this.isPress = true;
		this.$target = $(target);
	},

	dragEnd: function (pageX, pageY) {
		this.isPress = false;
		this.dragging = false;
		this.iconMoving = false;
		this.isInside = false;
		this.temporaryViewerIcon.remove();
		this.markFrame.remove();
		
		if (this.frameState !== -1) {
			UIEvent.fire('switch-editor-layout', this.$target.data('viewer-id'), this.frameState);
			this.frameState = -1;
		}
		// アイコンクリック
		var threshold = 3;
		var movedAmountX = pageX - this.startX;
		var movedAmountY = pageY - this.startY;
		if (!(movedAmountX < -threshold ||
			  movedAmountX >  threshold ||
			  movedAmountY < -threshold ||
			  movedAmountY >  threshold)) {
			UIEvent.fire('switch-editor-layout', this.$target.data('viewer-id'), 4);
		}
	},

	dragMoveTo: function (pageX, pageY) {
		if (!this.isPress) return;
		var movedAmountX = this.startX - pageX;
		var movedAmountY = this.startY - pageY;
		var threshold = 10;

		if (movedAmountX < -threshold ||
			movedAmountX >  threshold ||
			movedAmountY < -threshold ||
			movedAmountY >  threshold) {
			this.dragging = true;
		}
		if (!this.dragging) return;
		if (!this.iconMoving) {
			this.generateTemporaryViewerIcon();
		}
		this.iconMoving = true;
		this.temporaryViewerIcon.css({
			'left': pageX - this.$target.width(),
			'top': pageY - this.$target.height()
		});

		var editorOffset = this.$root.offset();
		var localX = pageX - editorOffset.left;
		var localY = pageY - editorOffset.top;
		var width = this.$root.width();
		var widthThreshold = 0.3;
		var height = this.$root.height();
		var heightThreshold = 0.4;

		if (localX < 0 || localY < 0) {
			if (this.isInside) {
				this.markFrame.remove();
				this.isInside = false;
				this.frameState = -1;
			}
			return;
		}
		if (!this.isInside) {
			this.markFrame = new MarkFrame(0, 255, 0);
			this.isInside = true;
			return;
		}
		var state = 0;
		if (localX < width * widthThreshold) {					// 左
			width >>= 1;
		} else if (localX > width - width * widthThreshold) {	// 右
			state = 1;
			width >>= 1;
			editorOffset.left += width;
		} else if (localY < height * heightThreshold) {		// 上
			state = 2;
			height >>= 1;
		} else if (localY > height - height * heightThreshold) {// 下
			state = 3;
			height >>= 1;
			editorOffset.top += height;
		} else {
			state = 4;
		}
		if (state !== this.frameState) {
			this.markFrame.moveTo(
				editorOffset.top,
				editorOffset.left,
				width,
				height
			);
			this.frameState = state;
		}
	},

	generateTemporaryViewerIcon: function () {
		this.temporaryViewerIcon = $('<div></div>').clone().addClass('temporary-icon').css({
			'background-image': this.$target.css('background-image'),
			'width': this.$target.width() * 2,
			'height': this.$target.height() * 2
		}).appendTo('body');
	}
}

function isSelf(e) {
	return $(e.target).parents('.editor-root').attr('id') === localSession.get(roomInfo.room.id);
}


// サイドバー移動時の横幅変更処理登録
SidebarHandle.setCallback(function () {
	var editorRegion = $('#editor-region');
	UIEvent.fire('editor-resize', editorRegion.width(), editorRegion.height());
});


$(document).on('mousedown', '.sidebar-handle', function (e) {
	SidebarHandle.dragStart(e.pageX);
	return Utils.cancelEvent(e);

}).on('mousedown', '.tab-item', function (e) {
	// タブ削除
	if (isSelf(e) && $(this).find('.close')[0] === e.target) {
		UIEvent.fire('remove-tab', $(this).parents('.editor-root').attr('id'), $(this).data('tab-id'));
	
	} else {
		Tab.dragStart(e.pageX, e.pageY, this);
	}

	return Utils.cancelEvent(e);

}).on('mousedown', 'header .viewer-icon', function (e) {
	ViewerIcon.dragStart(e.pageX, e.pageY, this);
	return Utils.cancelEvent(e);

}).on('mouseup', function (e) {
	SidebarHandle.dragEnd();
	ViewerIcon.dragEnd(e.pageX, e.pageY);
	Tab.dragEnd();
	return Utils.cancelEvent(e);

}).on('mousemove', function (e) {
	SidebarHandle.dragMoveTo(e.pageX);
	ViewerIcon.dragMoveTo(e.pageX, e.pageY);
	Tab.dragMoveTo(e.pageX, e.pageY);
	return Utils.cancelEvent(e);
});

$(window).resize(function () {
	var height = $(window).height();
	$('.wrapper').height(height + 'px');
	SidebarHandle.resize($(window).width(), 0);
}).resize();

});
