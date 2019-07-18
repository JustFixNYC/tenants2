from data_requests import views


def test_it_does_not_explode(http_request):
    views.download_multi_landlord_csv(http_request)
