<?php

class Controller_Auth extends Controller
{
	private $_config = null;

	public function before()
	{
		if(!isset($this->_config))
		{
			$this->_config = Config::load('opauth', 'opauth');
		}
	}

	/**
	 * eg. http://www.exemple.org/auth/login/facebook/ will call the facebook opauth strategy.
	 * Check if $provider is a supported strategy.
	 */
	public function action_login($_provider = null)
	{
		if(array_key_exists(Inflector::humanize($_provider), Arr::get($this->_config, 'Strategy')))
		{
			$_oauth = new Opauth($this->_config, true);
		}
		else
		{
			return Response::forge('Strategy not supported');
		}
	}

	public function action_logout($_provider = null)
	{
		return Response::redirect('/logout');
	}

	// Print the user credentials after the authentication. Use this information as you need. (Log in, registrer, ...)
	public function action_callback()
	{
		$_opauth = new Opauth($this->_config, false);

		switch($_opauth->env['callback_transport'])
		{
			case 'session':
				session_start();
				$response = $_SESSION['opauth'];
				unset($_SESSION['opauth']);
			break;			
		}

		if (array_key_exists('error', $response))
		{
			return Response::redirect('/');
			echo '<strong style="color: red;">Authentication error: </strong> Opauth returns error auth response.'."<br>\n";
		}
		else
		{
			if (empty($response['auth']) || empty($response['timestamp']) || empty($response['signature']) || empty($response['auth']['provider']) || empty($response['auth']['uid']))
			{
				return Response::redirect('/');
				echo '<strong style="color: red;">Invalid auth response: </strong>Missing key auth response components.'."<br>\n";
			}
			elseif (!$_opauth->validate(sha1(print_r($response['auth'], true)), $response['timestamp'], $response['signature'], $reason))
			{
				return Response::redirect('/');
				echo '<strong style="color: red;">Invalid auth response: </strong>'.$reason.".<br>\n";
			}
			else
			{
				// echo '<strong style="color: green;">OK: </strong>Auth response is validated.'."<br>\n";

				$auth = $response['auth'];
				$user_id = $auth['provider'].'_'.$auth['uid'];

				// ニックネーム取得 (name, nickname　どっちかが欠けてる場合がある)
				if (array_key_exists('nickname', $auth['info']))
				{
					$nickname = $auth['info']['nickname'];
				}
                elseif (array_key_exists('name', $auth['info']))
				{
					$nickname = $auth['info']['name'];
				}
                else
				{
					$nickname = 'anonymous';
				}

				$img = file_get_contents($auth['info']['image']);//画像を取得

				$img_fullpath = 'assets/img/user/sns/'.$user_id.'.jpg';//画像の保存フルパス
				file_put_contents(DOCROOT.$img_fullpath, $img);//保存

				$view = ViewUtils::view_setup('room/sns_icon_applyer');
				$view->data = array(
					'image' => $img_fullpath,
					'name' => $nickname
				);
				return Response::forge($view);
			}
		}
		return Response::forge(var_dump($response));
	}
}
