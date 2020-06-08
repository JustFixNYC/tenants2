import pytest

from hpaction.hpactionvars import HPActionVariables
from hpaction.hotdocs_xml_parsing import HPAType


class TestHPAType:
    @pytest.mark.parametrize('vars,expected', [
        (HPActionVariables(sue_for_harassment_tf=True), HPAType.HARASSMENT),
        (HPActionVariables(sue_for_harassment_tf=True,
                           sue_for_repairs_tf=False), HPAType.HARASSMENT),
        (HPActionVariables(sue_for_repairs_tf=True), HPAType.REPAIRS),
        (HPActionVariables(sue_for_harassment_tf=False,
                           sue_for_repairs_tf=True), HPAType.REPAIRS),
        (HPActionVariables(sue_for_repairs_tf=True,
                           sue_for_harassment_tf=True), HPAType.BOTH),
    ])
    def test_it_works(self, vars: HPActionVariables, expected):
        xmlstr = str(vars.to_answer_set())
        assert HPAType.get_from_answers_xml(xmlstr) == expected

        vars.access_person_te = "with unicode\u2026"
        xmlbytes = str(vars.to_answer_set()).encode('utf-8')
        assert HPAType.get_from_answers_xml(xmlbytes) == expected

    @pytest.mark.parametrize('vars', [
        HPActionVariables(),
        HPActionVariables(sue_for_harassment_tf=False, sue_for_repairs_tf=False),
    ])
    def test_it_raises_error_when_neither_are_present(self, vars):
        xmlstr = str(vars.to_answer_set())
        with pytest.raises(ValueError, match="suing for neither"):
            HPAType.get_from_answers_xml(xmlstr)
