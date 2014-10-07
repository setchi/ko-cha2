<?php

namespace Fuel\Migrations;

class Auth_Add_Authactions
{

	function up()
	{
		// get the driver used
		\Config::load('auth', true);

		$drivers = \Config::get('auth.driver', array());
		is_array($drivers) or $drivers = array($drivers);

		if (in_array('Ormauth', $drivers))
		{
			// get the tablename
			\Config::load('ormauth', true);
			$table = \Config::get('ormauth.table_name', 'users');

			// make sure the configured DB is used
			\DBUtil::set_connection(\Config::get('ormauth.db_connection', null));

			// add the actions field to the permission and permission through tables
			\DBUtil::add_fields($table.'_permissions', array(
				'actions' => array('type' => 'text', 'null' => true, 'after' => 'description'),
			));
			\DBUtil::add_fields($table.'_user_permissions', array(
				'actions' => array('type' => 'text', 'null' => true, 'after' => 'perms_id'),
			));
			\DBUtil::add_fields($table.'_group_permissions', array(
				'actions' => array('type' => 'text', 'null' => true, 'after' => 'perms_id'),
			));
			\DBUtil::add_fields($table.'_role_permissions', array(
				'actions' => array('type' => 'text', 'null' => true, 'after' => 'perms_id'),
			));
		}

		// reset any DBUtil connection set
		\DBUtil::set_connection(null);
	}

	function down()
	{
		// get the driver used
		\Config::load('auth', true);

		$drivers = \Config::get('auth.driver', array());
		is_array($drivers) or $drivers = array($drivers);

		if (in_array('Ormauth', $drivers))
		{
			// get the tablename
			\Config::load('ormauth', true);
			$table = \Config::get('ormauth.table_name', 'users');

			// make sure the configured DB is used
			\DBUtil::set_connection(\Config::get('ormauth.db_connection', null));

			\DBUtil::drop_fields($table.'_permissions', array(
				'actions',
			));
			\DBUtil::drop_fields($table.'_user_permissions', array(
				'actions',
			));
			\DBUtil::drop_fields($table.'_group_permissions', array(
				'actions',
			));
			\DBUtil::drop_fields($table.'_role_permissions', array(
				'actions',
			));
		}

		// reset any DBUtil connection set
		\DBUtil::set_connection(null);
	}
}
