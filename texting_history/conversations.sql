SELECT DISTINCT ON (user_phone_number)
    -- This is intentional: within the context of this dataset,
    -- the user's phone number is actually a unique string identifier
    -- for this row.
    user_phone_number AS sid,

    last_value(ordering) OVER wnd as ordering,
    last_value(date_sent) OVER wnd AS date_sent,
    last_value(is_from_us) OVER wnd AS is_from_us,
    last_value(body) OVER wnd AS body,
    last_value(error_message) OVER wnd AS error_message,
    user_phone_number
FROM
    texting_history_message
WINDOW wnd AS (
    PARTITION BY user_phone_number ORDER BY ordering
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
)
