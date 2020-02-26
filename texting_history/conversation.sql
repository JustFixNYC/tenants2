WITH conversation_msg AS (
    SELECT
        sid,
        date_sent,
        from_number = %(our_number)s AS is_from_us,
        body
    FROM
        texting_history_message
    WHERE
        (from_number = %(our_number)s AND to_number = %(their_number)s) OR
        (from_number = %(their_number)s AND to_number = %(our_number)s)
)

SELECT
    *
FROM
    conversation_msg AS msg
ORDER BY
    date_sent DESC, is_from_us DESC
