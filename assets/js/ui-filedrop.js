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
		UIEvent.fire(
			'file-dropped',
			file,
			getModeByExt(ext),
			Utils.arrayBufferToString(e.target.result)
		);
	}
	fileReader.readAsArrayBuffer(file);
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
	return Utils.cancelEvent(e);
}

// イベント登録
$(document).bind("dragenter", Utils.cancelEvent)
	.bind("dragover", Utils.cancelEvent)
	.bind("drop", handleDroppedFile);

});
