from django.contrib import admin
from .models import Course, VideoLecture, Enrollment, StudentProgress

# Register each model separately to avoid circular imports
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'level', 'duration_hours', 'is_published']
    list_filter = ['level', 'is_published', 'instructor']

@admin.register(VideoLecture)
class VideoLectureAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'duration_minutes', 'order']
    list_filter = ['course']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrolled_at', 'completed']
    list_filter = ['completed', 'enrolled_at']

@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'video_lecture', 'watched', 'last_watched']
    list_filter = ['watched']