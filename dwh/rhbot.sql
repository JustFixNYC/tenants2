-- A view useful for analyzing rent history textbot requests.

DROP VIEW IF EXISTS dwh_rhbot;

CREATE VIEW dwh_rhbot AS (
    SELECT
        request.end_time AS request_time,
        followup_1.end_time AS followup_1_time,
        followup_1.was_rent_history_received AS followup_1_was_rh_received,
        followup_2.end_time AS followup_2_time,
        followup_2.was_rent_history_received AS followup_2_was_rh_received,
        COALESCE(
            followup_2.was_rent_history_received,
            followup_1.was_rent_history_received
        ) AS was_rh_received,
        -- This isn't strictly necessary because we could just see if was_rh_received is NULL,
        -- but Google Data Studio's PostgreSQL connector doesn't seem very good at dealing
        -- with booleans that could be NULL, so we'll add this for convenience.
        (COALESCE(
            followup_2.was_rent_history_received,
            followup_1.was_rent_history_received
        ) is not null) as was_followup_successful
    FROM
        dwh_rapidprorun AS request
    LEFT OUTER JOIN
        dwh_rapidprorun AS followup_1 ON (
            followup_1.flow_uuid = %(rh_followup_1_uuid)s AND
            followup_1.user_uuid = request.user_uuid AND
            followup_1.start_time > request.end_time AND
            DATE_PART('day', followup_1.start_time - request.end_time) < %(rh_max_followup_days)s
        )
    LEFT OUTER JOIN
        dwh_rapidprorun AS followup_2 ON (
            followup_2.flow_uuid = %(rh_followup_2_uuid)s AND
            followup_2.user_uuid = request.user_uuid AND
            followup_2.start_time > request.end_time AND
            DATE_PART('day', followup_2.start_time - request.end_time) < %(rh_max_followup_days)s
        )
    WHERE
        request.flow_uuid = %(rh_uuid)s AND
        request.exit_type = 'completed'
)
