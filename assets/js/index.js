require([
	'jquery',
	'local-session'
], function ($, localSession) {


/**
 * トップページ
 */

$(function () {
	var $modal = null, pathName = location.pathname;

	$('[data-toggle="modal"]').mousedown(function () {
		$modal = $($(this).data('target'));
		$modal.find('input').focus();
		$modal.find('.panel2').text('').hide();
		$modal.find('.js_modal_send').show();
		$modal.find('.panel1').show();
	});

	// 部屋生成
	$('.js_create_room').click(function () {
		var sending = false;
		return function () {
			// 連打無視
			if (sending) {
				return;
			}
			sending = true;

			var password = $modal.find('input').val(),
				type = $modal.find('.type').text();

			var sendData = {
				'type': type
			}

			if (password) {
				sendData['password'] = password;
			}

			$.get(pathName + 'room/create.json', sendData, function ($modal) {
				return function (msg) {
					sending = false;
					var url = location.protocol + '//' + location.host + pathName + msg['id'];
					var roomLink = "<p>部屋が作成されました。下記のURLを共有して開始してください。</p><a href=" + url + " target=\"_blank\">" + url + "</a>";

					$modal.find('.panel1').hide();
					$modal.find('.js_create_room').hide();
					$modal.find('input').val('');
					$modal.find('.panel2').html(roomLink).show();

					localSession.add(msg['id'], msg['owner_id']);

					getMyOwnershipRoom();
				}
			}($modal), 'json');
		}
	}());

	$('.modal').find('form').submit(function () {return false;})

	// 自分が生成した部屋リスト取得
	function getMyOwnershipRoom() {
		$.post('room/ownership.json', {
			user_data: localSession.getAll()
			
		}, function (e) {
			var $ownershipRoom = $('.js_ownership_room'),
				$ownershipRoomList = $ownershipRoom.find('.js_ownership_room_list').html('');

			if (e['ownership'].length !== 0) {
				var link = '';
				for (var i in e['ownership']) {
					var id = e['ownership'][i]['id'], roomUrl = pathName + id;
					link = '<a class="list-group-item" href="' + roomUrl + '" data-room-id="' + id + '">ID： ' + id + '<span class="pull-right glyphicon glyphicon-remove" data-room-id="' + id +'">クローズ</span></a>' + link;
				}
				$ownershipRoomList.prepend(link);
				$ownershipRoom.removeClass('hidden');
			}
		}, 'json');
	}
	getMyOwnershipRoom();

	// 部屋クローズ
	$(document).on('mousedown', '.js_ownership_room_list .glyphicon-remove', function () {
		var id = $(this).data('room-id');

		if(!window.confirm('ID:' + id + ' の部屋をクローズします。よろしいですか？')) {
			return false;
		}

		$.post('room/close.json', {
			id: id,
			viewer_id: localSession.get(id)

		}, function (e) {
			if (e['error']) {
				console.log(e);
				return;
			}
			$('.js_ownership_room_list').find('[data-room-id="' + e['id'] + '"]').remove();

			if ($('.js_ownership_room_list').find('[data-room-id]').size() === 0) {
				$('.js_ownership_room').addClass('hidden');
			}
		});

		return false;
	});
});


});