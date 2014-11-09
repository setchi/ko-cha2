<?php

class Model_Viewer extends Model
{
	private static function get_next_viewer_num($room_id)
	{
		$viewer_num = DB::select('num')
			->from('viewer')
			->where('room_id', $room_id)
			->order_by('num', 'desc')
			->limit(1)
			->execute()
			->as_array();

		if (count($viewer_num) === 0)
		{
			return 0;
		}
		return 1 + $viewer_num[0]['num'];
	}

	public static function update_viewer($room_id, $viewer_id, $data)
	{
		DB::update('viewer')->set($data)
			->where('room_id', $room_id)
			->and_where('viewer_id', $viewer_id)
			->execute();
	}

	public static function get_viewer($room_id, $viewer_id)
	{
		return DB::select()->from('v_viewer')
			->where('room_id', $room_id)
			->and_where('viewer_id', $viewer_id)
			->execute()->as_array();
	}

	public static function get_viewers($room_id)
	{
		return DB::select()->from('viewer')
			->where('room_id', $room_id)
			->execute()->as_array();
	}

	public static function exit_viewer($room_id, $viewer_id)
	{
		self::update_viewer($room_id, $viewer_id, array(
			'viewing' => 0
		));
	}

	public static function enter_viewer($room_id, $viewer_id)
	{
		$self = DB::select()
			->from('viewer')
			->where('room_id', $room_id)
			->and_where('viewer_id', $viewer_id)
			->execute()
			->as_array();

		$time = microtime(true);
		if (count($self) === 0)
		{
			$viewer_num = self::get_next_viewer_num($room_id);
			$self = array(array(
				'room_id' => $room_id,
				'viewer_id' => $viewer_id,
				'image' => $viewer_num,
				'num' => $viewer_num,
				'time' => $time,
				'date' => date('Y-m-d H:i:s')
			));
			DB::insert('viewer')->set($self[0])->execute();
		
		}
		else
		{
			self::update_viewer($room_id, $viewer_id, array(
				'time' => $time,
				'viewing' => 1,
				'date' => date('Y-m-d H:i:s')
			));
		}
		// 更新情報を更新
		Model_Chat::send($room_id, $viewer_id, 'update_viewer', array());
		return $self[0];
	}
}
