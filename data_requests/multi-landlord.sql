WITH names AS (
    SELECT
        reg.registrationid,
        ARRAY_AGG (con.firstname || ' ' || con.lastname) AS landlords
    FROM
        hpd_registrations AS reg
    LEFT JOIN
        hpd_contacts AS con
    ON
        reg.registrationid = con.registrationid
    GROUP BY
        reg.registrationid
)
SELECT
    *
FROM
    names
WHERE
    landlords @> %(landlords)s
LIMIT 10
