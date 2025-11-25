from django.contrib import admin
from .models import Course, VideoLecture, Enrollment, StudentProgress

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'level', 'is_published']  # Removed duration_hours
    list_filter = ['level', 'is_published', 'instructor']

@admin.register(VideoLecture)
class VideoLectureAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']  # Removed duration_minutes
    list_filter = ['course']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrolled_at', 'completed']
    list_filter = ['completed', 'enrolled_at']

@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'video_lecture', 'watched', 'last_watched']
    list_filter = ['watched']