from users.models import JustfixUser
from dwh.dbrouter import ReadAndWriteToDataWarehouseDb
from dwh.models import RapidproRun


def test_reads_and_writes_of_dwh_models_are_directed_to_dwh_db(settings):
    settings.DWH_DATABASE = "boop"
    router = ReadAndWriteToDataWarehouseDb()
    run = RapidproRun()
    user = JustfixUser()
    assert router.db_for_read(run) == "boop"
    assert router.db_for_read(user) is None
    assert router.db_for_write(run) == "boop"
    assert router.db_for_write(user) is None
