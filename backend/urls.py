from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from courses.views import CourseViewSet, VideoLectureViewSet, EnrollmentViewSet, StudentProgressViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'courses', CourseViewSet)
router.register(r'video-lectures', VideoLectureViewSet)
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'student-progress', StudentProgressViewSet, basename='studentprogress')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)