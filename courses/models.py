from django.db import models
from django.utils import timezone
from users.models import User

class Course(models.Model):
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(default="Course description")
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'instructor'})
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_hours = models.IntegerField(default=0)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class VideoLecture(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=200)
    video_file = models.FileField(upload_to='video_lectures/')
    duration_minutes = models.IntegerField(default=0)
    order = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    is_preview = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'user_type': 'student'})
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['student', 'course']

    def __str__(self):
        return f"{self.student.username} - {self.course.title}"

class StudentProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    video_lecture = models.ForeignKey(VideoLecture, on_delete=models.CASCADE)
    watched = models.BooleanField(default=False)
    watch_duration = models.IntegerField(default=0)
    last_watched = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'video_lecture']

    def __str__(self):
        return f"{self.student.username} - {self.video_lecture.title}"