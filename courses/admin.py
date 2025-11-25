from django.contrib import admin
from .models import Course, VideoLecture, Enrollment, StudentProgress, Assignment, Exam, Question, Choice

class VideoLectureInline(admin.TabularInline):
    model = VideoLecture
    extra = 1  # Number of empty forms to show
    fields = ['title', 'order', 'video_file', 'duration', 'description']
    ordering = ['order']

class AssignmentInline(admin.TabularInline):
    model = Assignment
    extra = 1
    fields = ['title', 'description', 'max_score', 'due_date']

class ExamInline(admin.TabularInline):
    model = Exam
    extra = 1
    fields = ['title', 'description', 'duration', 'passing_score', 'is_active']

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'level', 'is_published']
    list_filter = ['level', 'is_published', 'instructor']
    search_fields = ['title', 'description']
    inlines = [VideoLectureInline, AssignmentInline, ExamInline]  # ADD THIS LINE

@admin.register(VideoLecture)
class VideoLectureAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order']
    list_filter = ['course']
    ordering = ['course', 'order']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrolled_at', 'completed']
    list_filter = ['completed', 'enrolled_at']

@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ['student', 'video_lecture', 'watched', 'last_watched']
    list_filter = ['watched']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'max_score']
    list_filter = ['course']

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'duration', 'passing_score', 'is_active']
    list_filter = ['course', 'is_active']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'exam', 'question_type', 'order']
    list_filter = ['exam', 'question_type']

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ['choice_text', 'question', 'is_correct']
    list_filter = ['question']