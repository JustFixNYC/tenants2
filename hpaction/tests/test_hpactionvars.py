from textwrap import dedent

import hpaction.hpactionvars as hp


def ensure_answer_set(v, expected_xml):
    expected_xml = dedent(expected_xml)
    actual_xml = str(v.to_answer_set())
    if actual_xml != expected_xml:
        print("Here's the actual XML for easy copy/pasting:\n\n")
        print(actual_xml)
    assert actual_xml == expected_xml


def test_it_works_with_complaints():
    v = hp.HPActionVariables()
    complaint = hp.TenantComplaints(area_complained_of_mc=hp.AreaComplainedOfMC.PUBLIC_AREA)
    v.tenant_complaints_list.append(complaint)
    ensure_answer_set(
        v,
        """\
    <?xml version="1.0" ?>
    <AnswerSet title="New Answer File" version="1.1">
        <Answer name="Area complained of MC">
            <RptValue>
                <MCValue>
                    <SelValue>Public area</SelValue>
                </MCValue>
            </RptValue>
        </Answer>
        <Answer name="Which room MC">
            <RptValue>
                <MCValue unans="true"/>
            </RptValue>
        </Answer>
        <Answer name="Conditions complained of TE">
            <RptValue>
                <TextValue unans="true"/>
            </RptValue>
        </Answer>
    </AnswerSet>
    """,
    )


def test_it_works_with_children_and_other_stuff():
    v = hp.HPActionVariables()
    v.access_person_te = "Boop Jones"
    v.action_type_ms = [hp.ActionTypeMS.REPAIRS]
    child = hp.TenantChild(tenant_child_name_te="Bap Jones")
    v.tenant_child_list.append(child)

    ensure_answer_set(
        v,
        """\
    <?xml version="1.0" ?>
    <AnswerSet title="New Answer File" version="1.1">
        <Answer name="Access person TE">
            <TextValue>Boop Jones</TextValue>
        </Answer>
        <Answer name="Action type MS">
            <MCValue>
                <SelValue>Repairs</SelValue>
            </MCValue>
        </Answer>
        <Answer name="Tenant child name TE">
            <RptValue>
                <TextValue>Bap Jones</TextValue>
            </RptValue>
        </Answer>
        <Answer name="Tenant child DOB">
            <RptValue>
                <DateValue unans="true"/>
            </RptValue>
        </Answer>
    </AnswerSet>
    """,
    )
