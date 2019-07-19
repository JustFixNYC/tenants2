SELECT
    hpd.registrationid AS hpdregistrationid,
    bbl,
    bin,
    boro,
    housenumber,
    streetname,
    zip
FROM
    hpd_registrations AS hpd
INNER JOIN (
    %(full_intersection_sql)s
) AS owner_regs ON hpd.registrationid = owner_regs.registrationid
