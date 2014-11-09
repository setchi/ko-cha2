<?php

class Model_Room extends Model
{
	public static function update_room($room_id, $data)
	{
		DB::update('room')->set($data)
			->where('id', $room_id)
			->execute();
	}

	public static function get_room($room_id)
	{
		$query = DB::select()->from('room')
			->where('id', $room_id)
			->and_where('owner_id', '!=', null)
			->execute()
			->as_array();

		if (count($query) === 0)
		{
			return null;
		}
		return $query[0];
	}

	public static function create_room($fields)
	{
		DB::insert('room')->set(array(
			'id' => $fields['id'],
			'owner_id' => $fields['owner_id'],
			'title' => $fields['title'],
			'password' => $fields['password'],
			'time' => microtime(true),
			'date' => date('Y-m-d H:i:s')
		))->execute();
	}

	public static function get_ownership_room($owner_id_list)
	{
		$query = DB::select('id')
			->from('room');

		foreach ($owner_id_list as $key => $value)
		{
			$query = $query->or_where('owner_id', $value);
		}

		return $query->order_by('time', 'desc')
			->execute()->as_array();
	}

	public static function set_partner($room_id, $viewer_id)
	{
		DB::update('room')->set(array(
			'partner_id' => $viewer_id
		))->where('id', $room_id)
		->execute();
	}
}
