from django.db import models
from django.contrib.auth.models import User
from users.models import User

class Course(models.Model):
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses_taught')
    thumbnail = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='beginner')
    duration = models.IntegerField(help_text="Duration in hours", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=False)
    
    def __str__(self):
        return self.title

class VideoLecture(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lectures')
    title = models.CharField(max_length=200)
    video_file = models.FileField(upload_to='video_lectures/')
    duration = models.IntegerField(help_text="Duration in seconds", default=0)
    order = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.title}"

class StudentProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    video_lecture = models.ForeignKey(VideoLecture, on_delete=models.CASCADE, related_name='progress')
    watched = models.BooleanField(default=False)
    progress = models.FloatField(default=0.0)  # Percentage watched (0-100)
    last_watched = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'video_lecture']
    
    def __str__(self):
        return f"{self.student.username} - {self.video_lecture.title} ({self.progress}%)"

class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField(null=True, blank=True)
    max_score = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class AssignmentSubmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')
    submission_file = models.FileField(upload_to='assignment_submissions/')
    submission_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    score = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_assignments')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['assignment', 'student']
    
    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"

class Exam(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='course_exams')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration = models.IntegerField(help_text="Duration in minutes", default=60)
    passing_score = models.IntegerField(default=70)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Question(models.Model):
    QUESTION_TYPES = (
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    )
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='multiple_choice')
    order = models.IntegerField(default=0)
    score = models.IntegerField(default=10)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.choice_text} ({'Correct' if self.is_correct else 'Incorrect'})"

class ExamSubmission(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_submissions')
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    passed = models.BooleanField(default=False)
    
    # class Meta:
    #     unique_together = ['exam', 'student']
    
    def __str__(self):
        return f"{self.student.username} - {self.exam.title} ({self.score or 'Not scored'})"

class Answer(models.Model):
    exam_submission = models.ForeignKey(ExamSubmission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    answer_text = models.TextField(blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    
    def __str__(self):
        return f"Answer for {self.question}"

class Certificate(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_id = models.CharField(max_length=20, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    download_url = models.URLField(blank=True)
    
    class Meta:
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"Certificate {self.certificate_id} - {self.student.username}"

    def save(self, *args, **kwargs):
        if not self.certificate_id:
            # Use current timestamp for certificate ID
            from django.utils import timezone
            current_time = timezone.now()
            self.certificate_id = f"APL{self.course.id:03d}{self.student.id:04d}{current_time.strftime('%y%m%d')}"
        super().save(*args, **kwargs)