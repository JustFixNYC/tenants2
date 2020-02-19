SELECT
    loc.created_at,
    loc.mail_choice,
    loc.letter_sent_at,
    ll_responding.earliest_known_date AS landlord_responded_by,
    ll_not_responding.earliest_known_date AS landlord_did_not_respond_by,
    ll_retaliation.earliest_known_date AS landlord_retaliated_by,
    got_results.earliest_known_date AS repairs_made_by,
    interested_in_hp.earliest_known_date AS interested_in_hp_action_by
FROM
    loc_letterrequest AS loc
LEFT JOIN
    rapidpro_usercontactgroup AS ll_responding ON (
        loc.user_id = ll_responding.user_id AND
        ll_responding.group_id = %(ll_responding_uuid)s
    )
LEFT JOIN
    rapidpro_usercontactgroup AS ll_not_responding ON (
        loc.user_id = ll_not_responding.user_id AND
        ll_not_responding.group_id = %(ll_not_responding_uuid)s
    )
LEFT JOIN
    rapidpro_usercontactgroup AS ll_retaliation ON (
        loc.user_id = ll_retaliation.user_id AND
        ll_retaliation.group_id = %(ll_retaliation_uuid)s
    )
LEFT JOIN
    rapidpro_usercontactgroup AS got_results ON (
        loc.user_id = got_results.user_id AND
        got_results.group_id = %(got_results_uuid)s
    )
LEFT JOIN
    rapidpro_usercontactgroup AS interested_in_hp ON (
        loc.user_id = interested_in_hp.user_id AND
        interested_in_hp.group_id = %(interested_in_hp_uuid)s
    )
