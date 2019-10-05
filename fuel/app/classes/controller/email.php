<?php

class Controller_Email extends Controller_Rest
{
	public function post_send()
	{
		Package::load('email');

		$subject = 'Ko-cha2 コンタクト';
		$body = Input::post('body');

		$email = Email::forge('utf8');
		$email->from('admin@setchi.jp', 'Ko-cha');
		$email->to('fox@setchi.jp');
		$email->subject($subject);
		$email->body(mb_convert_encoding($body, 'utf8'));

		$err_msg = '送信が完了しました。';

		if (!$body)
		{
			return $this->response(array(
				'error' => 'no message'
			));
		}
		try
		{
		    $email->send();
		}
		catch (\EmailValidationFailedException $e)
		{
		    $err_msg = '送信に失敗しました。';
		}
		catch (\EmailSendingFailedException $e)
		{
		    $err_msg = '送信に失敗しました。';
		}
		return $this->response(array(
			'msg' => $err_msg
		));
	}
}
