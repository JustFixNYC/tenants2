SELECT
    onb.user_id AS user_id,
    CASE WHEN %(include_pad_bbl)s THEN onb.pad_bbl ELSE 'REDACTED' END AS pad_bbl,
    EXISTS (
        SELECT pad_bbl
        FROM nycha_nychaproperty
        WHERE pad_bbl = onb.pad_bbl
    ) AS is_nycha_bbl,
    onb.borough AS borough,
    onb.created_at AS onboarding_date,
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
    ) AS latest_hp_action_pdf_creation_date
FROM
    onboarding_onboardinginfo AS onb
LEFT OUTER JOIN
    loc_letterrequest AS letter ON letter.user_id = onb.user_id
LEFT OUTER JOIN
    loc_landlorddetails AS landlord ON landlord.user_id = onb.user_id
ORDER BY
    onb.user_id
