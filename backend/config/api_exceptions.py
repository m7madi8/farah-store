from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response({"success": False, "error": {"detail": "Internal server error."}}, status=500)

    data = response.data
    if isinstance(data, dict):
        error = data
    else:
        error = {"detail": data}
    response.data = {"success": False, "error": error}
    return response
