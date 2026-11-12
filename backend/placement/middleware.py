from django.http import HttpResponse


class CorsMiddleware:
    """Lets the front-end open from another address (file:// or Live Server) and call the API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        api = request.path.startswith(('/api/', '/media/'))
        if api and request.method == 'OPTIONS':
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)
        if api:
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        return response
