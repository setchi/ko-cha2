
/**
 * ファイル拡張子と言語モードを関連付けるモジュール
 */
var modelist = (function() {

	"use strict";

	var modes = [];

	/**
	 * ファイルのパスから言語モードを取得
	 * @param  {String} path
	 * @return {Object} 言語モードに関する情報
	 */
	function getModeForPath(path) {
		var mode = modesByName.text;
		var fileName = path.split(/[\/\\]/).pop();
		for (var i = 0; i < modes.length; i++) {
			if (modes[i].supportsFile(fileName)) {
				mode = modes[i];
				break;
			}
		}
		return mode;
	}

	var Mode = function(name, caption, extensions) {
		this.name = name;
		this.caption = caption;
		this.mode = "ace/mode/" + name;
		this.extensions = extensions;
		if (/\^/.test(extensions)) {
			var re = extensions.replace(/\|(\^)?/g, function(a, b){
				return "$|" + (b ? "^" : "^.*\\.");
			}) + "$";
		} else {
			var re = "^.*\\.(" + extensions + ")$";
		}

		this.extRe = new RegExp(re, "gi");
	};

	Mode.prototype.supportsFile = function(filename) {
		return filename.match(this.extRe);
	};

	var supportedModes = {
		ABAP:        ["abap"],
		ActionScript:["as"],
		ADA:         ["ada|adb"],
		Apache_Conf: ["^htaccess|^htgroups|^htpasswd|^conf|htaccess|htgroups|htpasswd"],
		AsciiDoc:    ["asciidoc"],
		Assembly_x86:["asm"],
		AutoHotKey:  ["ahk"],
		BatchFile:   ["bat|cmd"],
		C9Search:    ["c9search_results"],
		C_Cpp:       ["cpp|c|cc|cxx|h|hh|hpp"],
		Cirru:       ["cirru|cr"],
		Clojure:     ["clj"],
		Cobol:       ["CBL|COB"],
		coffee:      ["coffee|cf|cson|^Cakefile"],
		ColdFusion:  ["cfm"],
		CSharp:      ["cs"],
		CSS:         ["css"],
		Curly:       ["curly"],
		D:           ["d|di"],
		Dart:        ["dart"],
		Diff:        ["diff|patch"],
		Dot:         ["dot"],
		Erlang:      ["erl|hrl"],
		EJS:         ["ejs"],
		Forth:       ["frt|fs|ldr"],
		FTL:         ["ftl"],
		Gherkin:     ["feature"],
		Glsl:        ["glsl|frag|vert"],
		golang:      ["go"],
		Groovy:      ["groovy"],
		HAML:        ["haml"],
		Handlebars:  ["hbs|handlebars|tpl|mustache"],
		Haskell:     ["hs"],
		haXe:        ["hx"],
		HTML:        ["html|htm|xhtml"],
		HTML_Ruby:   ["erb|rhtml|html.erb"],
		INI:         ["ini|conf|cfg|prefs"],
		Jack:        ["jack"],
		Jade:        ["jade"],
		Java:        ["java"],
		JavaScript:  ["js|jsm"],
		JSON:        ["json"],
		JSONiq:      ["jq"],
		JSP:         ["jsp"],
		JSX:         ["jsx"],
		Julia:       ["jl"],
		LaTeX:       ["tex|latex|ltx|bib"],
		LESS:        ["less"],
		Liquid:      ["liquid"],
		Lisp:        ["lisp"],
		LiveScript:  ["ls"],
		LogiQL:      ["logic|lql"],
		LSL:         ["lsl"],
		Lua:         ["lua"],
		LuaPage:     ["lp"],
		Lucene:      ["lucene"],
		Makefile:    ["^Makefile|^GNUmakefile|^makefile|^OCamlMakefile|make"],
		MATLAB:      ["matlab"],
		Markdown:    ["md|markdown"],
		MEL:         ["mel"],
		MySQL:       ["mysql"],
		MUSHCode:    ["mc|mush"],
		Nix:         ["nix"],
		ObjectiveC:  ["m|mm"],
		OCaml:       ["ml|mli"],
		Pascal:      ["pas|p"],
		Perl:        ["pl|pm"],
		pgSQL:       ["pgsql"],
		PHP:         ["php|phtml"],
		Powershell:  ["ps1"],
		Prolog:      ["plg|prolog"],
		Properties:  ["properties"],
		Protobuf:    ["proto"],
		Python:      ["py"],
		R:           ["r"],
		RDoc:        ["Rd"],
		RHTML:       ["Rhtml"],
		Ruby:        ["rb|ru|gemspec|rake|^Guardfile|^Rakefile|^Gemfile"],
		Rust:        ["rs"],
		SASS:        ["sass"],
		SCAD:        ["scad"],
		Scala:       ["scala"],
		Smarty:      ["smarty|tpl"],
		Scheme:      ["scm|rkt"],
		SCSS:        ["scss"],
		SH:          ["sh|bash|^.bashrc"],
		SJS:         ["sjs"],
		Space:       ["space"],
		snippets:    ["snippets"],
		Soy_Template:["soy"],
		SQL:         ["sql"],
		Stylus:      ["styl|stylus"],
		SVG:         ["svg"],
		Tcl:         ["tcl"],
		Tex:         ["tex"],
		Text:        ["txt"],
		Textile:     ["textile"],
		Toml:        ["toml"],
		Twig:        ["twig"],
		Typescript:  ["ts|typescript|str"],
		VBScript:    ["vbs"],
		Velocity:    ["vm"],
		Verilog:     ["v|vh|sv|svh"],
		XML:         ["xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl"],
		XQuery:      ["xq"],
		YAML:        ["yaml|yml"]
	};

	var nameOverrides = {
		ObjectiveC: "Objective-C",
		CSharp: "C#",
		golang: "Go",
		C_Cpp: "C/C++",
		coffee: "CoffeeScript",
		HTML_Ruby: "HTML (Ruby)",
		FTL: "FreeMarker"
	};
	var modesByName = {};
	for (var name in supportedModes) {
		var data = supportedModes[name];
		var displayName = (nameOverrides[name] || name).replace(/_/g, " ");
		var filename = name.toLowerCase();
		var mode = new Mode(filename, displayName, data[0]);
		modesByName[filename] = mode;
		modes.push(mode);
	}

	return {
		getModeForPath: getModeForPath,
		modes: modes,
		modesByName: modesByName
	};
})();


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
			modelist.getModeForPath(file.name).name,
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
		} else if (!file.type.match('text.*') && modelist.getModeForPath(file.name).name === 'text') {
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
