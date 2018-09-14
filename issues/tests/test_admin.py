from .. import admin


def test_cannot_add_or_change_issues():
    assert admin.IssueInline.has_add_permission(None) is False
    assert admin.IssueInline.has_change_permission(None) is False
