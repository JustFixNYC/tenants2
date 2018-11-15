from hpaction.management.commands import hpcodegen


def test_generated_code_is_up_to_date():
    hpcodegen.HPActionVarsFile().ensure_is_up_to_date()
