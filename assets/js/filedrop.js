/**
 * ファイルドロップに関する処理
 */

$(function () {

/**
 * 拡張子から言語を取得
 * @param  {String} ext - 拡張子
 * @return {String} 該当言語
 */
function getModeByExt (ext) {
	return {
		'abp': 'abap',
		'as': 'actionscript',
		'c': 'c_cpp',
		'h': 'c_cpp',
		'cpp': 'c_cpp',
		'hpp': 'c_cpp',
		'cobol': 'cobol',
		'coffee': 'coffee',
		'cs': 'csharp',
		'css': 'css',
		'clj': 'clojure',
		'd': 'd',
		'dart': 'dart',
		'erl': 'erlang',
		'forth': 'forth',
		'go': 'golang',
		'groovy': 'groovy',
		'hs': 'haskell',
		'lhs': 'haskell',
		'hx': 'haxe',
		'html': 'html',
		'htm': 'html',
		'xhtml': 'html',
		'svg': 'html',
		'java': 'java',
		'js': 'javascript',
		'jsx': 'jsx',
		'lisp': 'lisp',
		'lsl': 'lsl',
		'lua': 'lua',
		'mat': 'matlab',
		'sql': 'mysql',
		'm': 'objectivec',
		'md': 'markdown',
		'ml': 'ocaml',
		'pas': 'pascal',
		'pl': 'perl',
		'php': 'php',
		'pro': 'prolog',
		'swi': 'prolog',
		'py': 'python',
		'r': 'r',
		'rb': 'ruby',
		'rs': 'rust',
		'scala': 'scala',
		'scm': 'scheme',
		'sh': 'sh',
		'tex': 'latex',
		'ts': 'typescript',
		'vbs': 'vbscript',
		'v': 'verilog',
		'asm': 'assembly_x86',
		'xml': 'xml',
		'xquery': 'xquery'
	}[ext.toLocaleLowerCase()] || 'plain_text';
}


/**
 * ファイル名から言語を取得
 * @param  {String} fileName
 * @return {String} 該当言語
 */
function getExtByFilename (fileName) {
	return fileName.substr(fileName.lastIndexOf('.') + 1);
}


/**
 * ファイルをアップロードする
 * @param  {File}   file
 * @param  {Function} callback
 */
function uploadFile (file, callback) {
	var uploadData = new FormData();
	uploadData.append('file', file);

	$.ajax({
		url: 'chat/upload/' + roomInfo.room.id + '.json',
		type: 'post',
		dataType: 'json',
		contentType: false,
		processData: false,
		data: uploadData
	}).done(callback);
}


/**
 * ファイルの内容をエディタに適用する
 * @param  {File} file
 */
function readFile (file) {
	if(!window.FileReader) {
		alert("File API がサポートされていません。");
		return false;
	}

	var ext = getExtByFilename(file.name);
	var fileReader = new FileReader();
	fileReader.onload = function (e) {
		var targetEditor = editorList.get(roomInfo.viewer.viewer_id);
		var targetTab = targetEditor.addTab(file.name);
		var text = arrayBufferToString(e.target.result);

		// エディタに情報を反映、ファイルの更新監視開始
		targetTab.startMonitoringFile(file, arrayBufferToString).applyData({
			text: encodeURIComponent(text),
			mode: getModeByExt(ext)
		});

		targetTab.send({
			mode: getModeByExt(ext)
		});
		
		// 自分のエディタを開いていなければ表示
		if (!targetEditor.isViewing()) {
			editorList.setLayout(roomInfo.viewer.viewer_id, 4);
		}
		targetEditor.changeActiveTab(file.name);
	}
	fileReader.readAsArrayBuffer(file);
}


/**
 * ArrayBufferの内容を文字列に変換する
 * @param  {ArrayBuffer} arrayBuffer
 * @return {String} 文字列
 */
function arrayBufferToString (arrayBuffer) {
	var array = new Uint8Array(arrayBuffer);

	// ArrayBufferを適切なViewで処理 (様々な文字コードに対応させる)
	switch (Encoding.detect(array)) {
	case 'UTF16':
		array = new Uint16Array(arrayBuffer);
		break;
	case 'UTF32':
		array = new Uint32Array(arrayBuffer);
		break;
	}
	array = Encoding.convert(array, 'UNICODE');
	return Encoding.codeToString(array);
}


/**
 * ファイルドロップ時のハンドラ
 * @param  {Object} e
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
			uploadFile(file, function (json) {
				for (var i in json) {
					Chat.send('[image]' + json[i] + '[/image]');
				}
			});
		} else {
			readFile(file);
		}

	}
	return cancelEvent(e);
}

// イベント登録
$(document).bind("dragenter", cancelEvent)
	.bind("dragover", cancelEvent)
	.bind("drop", handleDroppedFile);

});
