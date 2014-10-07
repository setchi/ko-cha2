<?php

class Controller_Email extends Controller_Rest
{
	public function post_send()
	{
		Package::load('email');

		$subject = 'Ko-cha コンタクト';
		$body = Input::post('body');

		$email = Email::forge('jis');
		$email->from('admin@mozimovie.wwww.jp', 'Ko-cha');
		$email->to('ri_xer@yahoo.co.jp');
		$email->subject($subject);
		$email->body(mb_convert_encoding($body, 'jis'));

		$err_msg = '送信が完了しました。';

		if (!$body) {
			return $this->response(array(
				'error' => 'no message'
			));
		}
		try {
		    $email->send();
		}
		catch (\EmailValidationFailedException $e) {
		    $err_msg = '送信に失敗しました。';
		}
		catch (\EmailSendingFailedException $e) {
		    $err_msg = '送信に失敗しました。';
		}
		return $this->response(array(
			'msg' => $err_msg
		));
	}
}
