from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to Admin and Super Admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'super_admin'])

class IsVendor(permissions.BasePermission):
    """
    Allows access to Vendors, Admins, and Super Admins.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['vendor', 'admin', 'super_admin'])

class IsCustomer(permissions.BasePermission):
    """
    Allows access to Customers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'customer')

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes the model instance has an `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        # if request.method in permissions.SAFE_METHODS:
        #     return True

        if request.user.role in ['admin', 'super_admin']:
            return True
            
        return obj.user == request.user
