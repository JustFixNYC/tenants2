SELECT
    split_part(issue.value, '__', 1) as area,
    split_part(issue.value, '__', 2) as value,
    COUNT(1)
FROM
    issues_issue as issue
GROUP BY
    issue.value
UNION
SELECT
    cissue.area as area,
    'CUSTOM_ISSUE' as value,
    COUNT(1)
FROM
    issues_customissue as cissue
GROUP BY
    cissue.area
ORDER BY
    count DESC,
    value
