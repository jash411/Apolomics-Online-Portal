from rest_framework import serializers
from .models import Course, VideoLecture, Enrollment, StudentProgress

class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    
    class Meta:
        model = Course
        fields = '__all__'

class CourseCreateSerializer(serializers.ModelSerializer):
    thumbnail = serializers.ImageField(required=False)
    
    class Meta:
        model = Course
        fields = ['title', 'description', 'level', 'duration_hours', 'price', 'thumbnail', 'is_published']

class VideoLectureSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoLecture
        fields = '__all__'

class VideoLectureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoLecture
        fields = ['course', 'title', 'video_file', 'duration_minutes', 'order', 'description', 'is_preview']

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Enrollment
        fields = '__all__'

class StudentProgressSerializer(serializers.ModelSerializer):
    video_title = serializers.CharField(source='video_lecture.title', read_only=True)
    course_title = serializers.CharField(source='video_lecture.course.title', read_only=True)
    
    class Meta:
        model = StudentProgress
        fields = '__all__'