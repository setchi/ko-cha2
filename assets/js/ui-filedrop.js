require([
	'jquery',
	'room-info',
	'utils',
	'chat',
	'mode-list',
	'ui-event'
], function ($, roomInfo, Utils, Chat, modeList, UIEvent) {
"use strict";

/**
 * ファイルドロップに関する処理
 */
$(function () {


/**
 * ファイルをアップロードする
 * @param  {String}   type
 * @param  {File}   file
 * @param  {Function} callback
 */
function uploadFile (type, file, callback) {
	var uploadData = new FormData();
	uploadData.append('file', file);

	$.ajax({
		url: 'chat/upload_' + type + '/' + roomInfo.room.id + '.json',
		type: 'post',
		dataType: 'json',
		contentType: false,
		processData: false,
		data: uploadData
	}).done(callback);
}


/**
 * ファイルの内容を読込む
 * @param {File} file
 */
function readFile (file) {
	if(!window.FileReader) {
		alert("File API がサポートされていません。");
		return false;
	}
	var fileReader = new FileReader();

	fileReader.onload = function (e) {
		UIEvent.fire(
			'file-dropped',
			file,
			modeList.getModeForPath(file.name).name,
			Utils.arrayBufferToString(e.target.result)
		);
	}
	fileReader.readAsArrayBuffer(file);
}


/**
 * ファイルドロップ時のハンドラ
 * @param {Object} e
 * @return {Boolean} イベントキャンセル
 */
function handleDroppedFile (e) {
	var files = e.originalEvent.dataTransfer.files;
	
	for (var i = 0; i < files.length; i++) {
		var file = files[i];

		// サイズチェック
		if (file.size >= 5 * 1000 * 1000) {
			alert('ファイルサイズが5MBを超えています: [' + (file.size / 1000000) + 'MB]');
			continue;
		}
		// 画像がドロップされた
		if (file.type.match('image.*')) {
			uploadFile('image', file, function (json) {
				for (var i in json) {
					Chat.send(json[i], 'image');
				}
			});

		// ファイルがドロップされた
		} else if (!file.type.match('text.*') && modeList.getModeForPath(file.name).name === 'text') {
			uploadFile('file', file, function (json) {
				for (var i in json) {
					Chat.send(json[i], 'file');
				}
			});

		// テキストファイルがドロップされた
		} else {
			readFile(file);
		}
	}
	return Utils.cancelEvent(e);
}

// イベント登録
$(document).bind("dragenter", Utils.cancelEvent)
	.bind("dragover", Utils.cancelEvent)
	.bind("drop", handleDroppedFile);

});

});
