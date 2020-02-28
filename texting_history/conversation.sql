SELECT
    sid,
    ordering,
    date_sent,
    is_from_us,
    body,
    error_message
FROM
    texting_history_message
WHERE
    user_phone_number = %(their_number)s
ORDER BY
    ordering DESC
