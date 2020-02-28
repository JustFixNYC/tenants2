WITH latest_conversation_msg AS (
    SELECT DISTINCT ON (user_phone_number)
        last_value(sid) OVER wnd AS sid,
        last_value(ordering) OVER wnd as ordering,
        last_value(date_sent) OVER wnd AS date_sent,
        last_value(is_from_us) OVER wnd AS is_from_us,
        last_value(body) OVER wnd AS body,
        user_phone_number
    FROM
        texting_history_message
    WINDOW wnd AS (
        PARTITION BY user_phone_number ORDER BY ordering
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )
)

SELECT
    msg.*,
    usr.id as user_id,
    usr.first_name || ' ' || usr.last_name as user_full_name
FROM
    latest_conversation_msg AS msg
LEFT JOIN
    users_justfixuser AS usr ON '+1' || usr.phone_number = msg.user_phone_number
