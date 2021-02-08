SELECT
    onb.user_id AS user_id,
    CASE WHEN %(include_pad_bbl)s THEN onb.pad_bbl ELSE 'REDACTED' END AS pad_bbl,
    CASE WHEN %(include_pad_bbl)s THEN onb.pad_bin ELSE 'REDACTED' END AS pad_bin,
    EXISTS (
        SELECT pad_bbl
        FROM nycha_nychaproperty
        WHERE pad_bbl = onb.pad_bbl
    ) AS is_nycha_bbl,
    onb.borough AS borough,
    onb.non_nyc_city AS city_if_outside_nyc,
    onb.state AS state,
    onb.created_at AS onboarding_date,
    onb.signup_intent AS signup_intent,
    onb.is_in_eviction AS is_in_eviction,
    onb.needs_repairs AS needs_repairs,
    onb.has_no_services AS has_no_services,
    onb.has_pests AS has_pests,
    onb.has_called_311 AS has_called_311,
    onb.lease_type AS lease_type,
    onb.receives_public_assistance AS receives_public_assistance,
    onb.can_we_sms AS can_we_sms,
    (
        (
            SELECT COUNT(1)
            FROM issues_issue
            WHERE issues_issue.user_id = onb.user_id
        ) +
        (
            SELECT COUNT(1)
            FROM issues_customissue
            WHERE issues_customissue.user_id = onb.user_id
        )
    ) AS issue_count,
    (
        SELECT SUM(char_length(description))
        FROM issues_customissue
        WHERE issues_customissue.user_id = onb.user_id
    ) AS custom_issue_chars,
    (
        SELECT COUNT(1)
        FROM loc_accessdate
        WHERE loc_accessdate.user_id = onb.user_id
    ) AS access_date_count,
    landlord.is_looked_up AS was_landlord_autofilled,
    letter.created_at AS letter_submission_date,
    letter.mail_choice AS letter_mail_choice,
    (
        SELECT MAX(hp.created_at)
        FROM hpaction_hpactiondocuments AS hp
        WHERE hp.user_id = onb.user_id
    ) AS latest_hp_action_pdf_creation_date,
    (
        SELECT MAX(de.created_at)
        FROM hpaction_docusignenvelope AS de
        LEFT JOIN hpaction_hpactiondocuments AS hp ON de.docs_id = hp.id
        WHERE de.status = %(docusign_signed_status)s AND hp.user_id = onb.user_id
    ) AS latest_signed_ehpa_date,
    rapidpro.contact_groups AS rapidpro_contact_groups,
    phone_number_lookup.is_valid AS is_phone_number_valid,
    phone_number_lookup.carrier ->> 'type' AS phone_number_type,
    (
        -- I'm not actually sure if this first condition is required, but
        -- it seems prudent to test it just in case. -AV
        char_length(jfuser.password) > 0 AND
        jfuser.password NOT LIKE %(unusable_password_pattern)s
    ) AS has_usable_password,
    %(admin_url_begin)s || onb.user_id || %(admin_url_end)s AS url
FROM
    onboarding_onboardinginfo AS onb
LEFT OUTER JOIN
    loc_letterrequest AS letter ON letter.user_id = onb.user_id
LEFT OUTER JOIN
    loc_landlorddetails AS landlord ON landlord.user_id = onb.user_id
LEFT OUTER JOIN
    (
        SELECT
            rucg.user_id AS user_id,
            array_agg(rcg.name ORDER BY rcg.name) AS contact_groups
        FROM rapidpro_contactgroup AS rcg
        INNER JOIN
            rapidpro_usercontactgroup AS rucg ON rcg.uuid = rucg.group_id
        GROUP BY rucg.user_id
    ) AS rapidpro ON rapidpro.user_id = onb.user_id
INNER JOIN
    users_justfixuser AS jfuser ON jfuser.id = onb.user_id
LEFT OUTER JOIN
    texting_phonenumberlookup AS phone_number_lookup
    ON jfuser.phone_number = phone_number_lookup.phone_number
ORDER BY
    onb.user_id
