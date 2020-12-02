import pytest
from users.tests.factories import UserFactory


class TestIssueAreaV2Mutation:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.graphql_client = graphql_client

    def execute(self, input):
        input = {"customIssues": [], **input}
        return self.graphql_client.execute(
            """
            mutation MyMutation($input: IssueAreaV2Input!) {
                issueAreaV2(input: $input) {
                    errors {
                        field
                        messages
                    }
                    session {
                        issues
                        customIssuesV2 {
                            id
                            area
                            description
                        }
                    }
                }
            }
            """,
            variables={"input": input},
        )["data"]["issueAreaV2"]

    def test_it_requires_auth(self):
        result = self.execute({"area": "HOME", "issues": ["HOME__RATS"]})
        assert result["errors"] == [
            {"field": "__all__", "messages": ["You do not have permission to use this form!"]}
        ]

    def test_it_works(self):
        self.graphql_client.request.user = UserFactory.create()

        result = self.execute(
            {
                "area": "HOME",
                "issues": ["HOME__RATS"],
                "customIssues": [
                    {
                        "description": "boop",
                        "DELETE": False,
                    }
                ],
            }
        )
        assert result["errors"] == []
        assert result["session"]["issues"] == ["HOME__RATS"]
        ci = result["session"]["customIssuesV2"]
        ci_id = ci[0].pop("id")
        assert ci == [{"area": "HOME", "description": "boop"}]

        result = self.execute(
            {
                "area": "HOME",
                "issues": [],
                "customIssues": [
                    {
                        "description": "boop",
                        "DELETE": True,
                        "id": ci_id,
                    }
                ],
            }
        )
        assert result["errors"] == []
        assert result["session"]["issues"] == []
        assert result["session"]["customIssuesV2"] == []


def test_issues_is_empty_when_unauthenticated(graphql_client):
    result = graphql_client.execute("query { session { issues } }")
    assert result["data"]["session"]["issues"] == []


def test_customissues_v2_is_null_when_unauthenticated(graphql_client):
    result = graphql_client.execute("query { session { customIssuesV2 { area } } }")
    assert result["data"]["session"]["customIssuesV2"] is None
