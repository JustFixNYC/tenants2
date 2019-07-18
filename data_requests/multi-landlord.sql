SELECT
    *
FROM
    hpd_registrations
WHERE
    boro = ANY(%(boroughs)s)
LIMIT 10
