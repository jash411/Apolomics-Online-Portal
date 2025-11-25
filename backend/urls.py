from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.views.static import serve
from django.utils.encoding import uri_to_iri
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from courses.views import *

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'courses', CourseViewSet, basename='courses')
router.register(r'video-lectures', VideoLectureViewSet, basename='video-lectures')
router.register(r'progress', StudentProgressViewSet, basename='progress')
router.register(r'assignments', AssignmentViewSet, basename='assignments')
router.register(r'assignment-submissions', AssignmentSubmissionViewSet, basename='assignment-submissions')
router.register(r'exams', ExamViewSet, basename='exams')
router.register(r'exam-submissions', ExamSubmissionViewSet, basename='exam-submissions')
router.register(r'certificates', CertificateViewSet, basename='certificates')
router.register(r'questions', QuestionViewSet, basename='questions')
router.register(r'choices', ChoiceViewSet, basename='choices')

def serve_media_with_seeking(request, path):
    """Custom media serving view that handles both Unicode filenames and video seeking"""
    # Decode the URL-encoded path to handle Amharic characters
    decoded_path = uri_to_iri(path)
    
    # Serve with range request support for video seeking
    response = serve(request, decoded_path, document_root=settings.MEDIA_ROOT)
    
    # Ensure range requests are supported
    if hasattr(response, 'headers'):
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Cache-Control'] = 'no-cache'
    
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
]

# FIXED: Serve media files with Unicode filename support AND video seeking
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_media_with_seeking),
    ]