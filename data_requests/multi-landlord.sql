SELECT
    housenumber,
    streetname,
    zip,
    boro,
    registrationid,
    bbl,
    corpnames,
    (
        SELECT ARRAY_AGG(person->>'value' || ' (' || (person->>'title') || ')' )
        FROM json_array_elements(ownernames) AS person
    ) AS owners
FROM
    hpd_registrations_grouped_by_bbl_with_contacts
WHERE
    ownernames::jsonb @> %(landlords)s::jsonb
