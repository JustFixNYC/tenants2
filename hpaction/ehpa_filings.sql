SELECT
    de.created_at,
    jfuser.first_name,
    jfuser.last_name,
    onb.borough,
    jfuser.phone_number,
    jfuser.email,
    hp.sue_for_repairs,
    hp.sue_for_harassment
FROM
    hpaction_docusignenvelope as de
LEFT OUTER JOIN
    hpaction_hpactiondocuments as docs ON docs.id = de.docs_id
LEFT OUTER JOIN
    users_justfixuser as jfuser ON jfuser.id = docs.user_id
LEFT OUTER JOIN
    onboarding_onboardinginfo as onb ON docs.user_id = onb.user_id
LEFT OUTER JOIN
    hpaction_hpactiondetails as hp ON docs.user_id = hp.user_id
WHERE
    de.status = 'SIGNED'
ORDER BY
    created_at DESC;
