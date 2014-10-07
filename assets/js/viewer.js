/**
 * Viewerに関する処理
 */

var Viewer = function (editorList) {
	var $templates = $('#ko-cha-templates');
	this.$icon = $templates.find('.viewer-icon').clone();
	this.editorList = editorList;
}
Viewer.prototype = {
	init: function () {
		$('.js_my_icon').addClass(roomInfo.viewer.viewer_id).css({
			'background-image': 'url(' + this.getImageUrl(roomInfo.viewer.image) + ')'
		});
		// 自分自身をビューワーリストに追加して、自分のエディタを全画面で表示する
		this.add(roomInfo.viewer);
		editorList.setLayout(roomInfo.viewer.viewer_id, 4);
	},

	update: function (data) {
		for (var i in data) {
			if (data[i].viewer_id in this.editorList.editorList) {
				var image = this.getImageUrl(data[i].image);
				this.changeIcon(image, data[i].viewer_id);

				$('.viewer-list').find('[data-viewer-id="' + data[i].viewer_id + '"]').addClass(data[i].viewer_id).css('background-image', 'url(' + image + ')');
				$('#' + data[i].viewer_id).find('.editor-user-icon').css('background-image', 'url(' + image + ')').addClass(data[i].viewer_id);
			} else {
				this.add(data[i]);
			}
		}
	},

	// Viewerの追加
	add: function (data) {
		this.editorList.add(data.viewer_id);
		var image = this.getImageUrl(data.image);

		this.$icon.clone().attr('data-viewer-id', data.viewer_id).addClass(data.viewer_id).css('background-image', 'url(' + image + ')').appendTo(".viewer-list");
		$('#' + data.viewer_id).find('.editor-user-icon').css('background-image', 'url(' + image + ')').addClass(data.viewer_id).mouseenter(function () {
			$(this).addClass('hidden');
			var that = this;
			setTimeout(function() {$(that).removeClass('hidden') }, 2000);
		});

		if (roomInfo.viewer.viewer_id === data.viewer_id) {
			$('#' + data.viewer_id).addClass('self-editor');
		}
	},

	getImageUrl: function (data) {
		data = "" + data;
		return data.length < 10 ? '/ko-cha2/assets/img/user/default/' + data + '.png' : data;
	},
	
	changeIcon: (function () {
		var viewerInfoMap = {};

		return function (image, viewerId) {
			if (viewerId === roomInfo.viewer.viewer_id) {
				roomInfo.viewer.image = image;
			}
			if (!(viewerId in viewerInfoMap)) {
				viewerInfoMap[viewerId] = "";
			}
			if (viewerInfoMap[viewerId] !== image) {
				viewerInfoMap[viewerId] = image;
				$('.' + viewerId).css('background-image', 'url(' + image + ')');
			}
		}
	}())
}

var viewer = new Viewer(editorList);


// ページを離れたとき
window.onbeforeunload = function () {
	server.disconnect();
}

// SNSアイコンインポート
$('.sns-login').find('span').click(function () {
	var sns = $(this).data('sns');
	var url = '/ko-cha2/auth/login/' + sns;
	window.open(url, '', 'width=800,height=500');
});
function snsApply(image, name) {
	server.send({
		type: 'update_image',
		data: {
			'image': image,
			'name': name
		}
	});
}
