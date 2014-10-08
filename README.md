Ko-cha2
=======

ちょっとコードを交えてチャットしたい時に便利なWebアプリです。

[http://setchi.jp/ko-cha2/](http://setchi.jp/ko-cha2/)

多対多で自身のコードを共有しながらチャットが出来ます。
共有したいファイルをドラッグ&ドロップするか、トップバーをダブルクリックしてタブを開きます。
通信は基本的にWebRTCで行っています。Ctrl+Sでサーバ上にコードを記憶することもできます。

![ko-cha2](http://setchi.jp/ko-cha2/assets/img/ko-cha2_s.png "ko-cha2")


動作環境
--------------------
下記の環境で動作を確認しています。

* Apache 2.2.3
* PHP 5.3.3
* MySQL 5.0.95

ビルド
--------------------
* fuel/app/config/内のdb.phpとopauth.phpの設定が必要です。

Copyright
--------------------
Copyright &copy; 2011 setchi_. See LICENSE for details.