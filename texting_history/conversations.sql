WITH conversation_msgs AS (
    SELECT
        sid,
        date_sent,
        from_number = %(our_number)s AS is_from_us,
        body,
        CASE WHEN from_number = %(our_number)s THEN to_number
          ELSE from_number
        END as user_phone_number
    FROM
        texting_history_message
    WHERE
        from_number = %(our_number)s OR to_number = %(our_number)s
),

latest_conversation_msgs AS (
    SELECT DISTINCT ON (user_phone_number)
        last_value(sid) OVER wnd AS sid,
        last_value(date_sent) OVER wnd AS date_sent,
        last_value(is_from_us) OVER wnd AS is_from_us,
        last_value(body) OVER wnd AS body,
        user_phone_number
    FROM
        conversation_msgs
    WINDOW wnd AS (
        PARTITION BY user_phone_number ORDER BY date_sent
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )
)

SELECT * FROM latest_conversation_msgs
ORDER BY date_sent DESC
LIMIT %(page_size)s OFFSET %(offset)s
