SELECT
    hpd.*
FROM
    hpd_registrations_grouped_by_bbl_with_contacts AS hpd
WHERE
    hpd.ownernames::jsonb @> %(landlords)s::jsonb
LIMIT 10
