from rest_framework import serializers
from .models import *
class VideoLectureSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoLecture
        fields = ['id', 'title', 'course', 'video_file', 'video_url', 'duration', 'order', 'description', 'created_at']
    
    def get_video_url(self, obj):
        """
        Return absolute URL for the video file
        """
        if obj.video_file:
            request = self.context.get('request')
            if request:
                # Build absolute URL with current request
                return request.build_absolute_uri(obj.video_file.url)
            else:
                # Fallback: build absolute URL manually
                return f"http://localhost:8000{obj.video_file.url}"
        return None

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = '__all__'
    
    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(student=request.user, course=obj).exists()
        return False
    
    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                enrollment = Enrollment.objects.get(student=request.user, course=obj)
                if enrollment.completed:
                    return 100
                
                total_lectures = obj.lectures.count()
                if total_lectures == 0:
                    return 0
                
                completed_lectures = StudentProgress.objects.filter(
                    student=request.user,
                    video_lecture__course=obj,
                    watched=True
                ).count()
                
                return (completed_lectures / total_lectures) * 100
            except Enrollment.DoesNotExist:
                return 0
        return 0

class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = '__all__'

class AssignmentSerializer(serializers.ModelSerializer):
    is_submitted = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = '__all__'
    
    def get_is_submitted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return AssignmentSubmission.objects.filter(
                assignment=obj,
                student=request.user
            ).exists()
        return False

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    
    class Meta:
        model = AssignmentSubmission
        fields = '__all__'

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    is_attempted = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = '__all__'
    
    def get_is_attempted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ExamSubmission.objects.filter(
                exam=obj,
                student=request.user
            ).exists()
        return False

class ExamSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSubmission
        fields = '__all__'

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = '__all__'

class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = Certificate
        fields = '__all__'