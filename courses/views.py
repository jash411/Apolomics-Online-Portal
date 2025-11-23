from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, VideoLecture, Enrollment, StudentProgress
from .serializers import CourseSerializer, VideoLectureSerializer, EnrollmentSerializer, StudentProgressSerializer, CourseCreateSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            return CourseCreateSerializer
        return CourseSerializer

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        user = request.user
        if user.user_type == 'instructor':
            courses = Course.objects.filter(instructor=user)
        else:
            enrollments = Enrollment.objects.filter(student=user).select_related('course')
            courses = [enrollment.course for enrollment in enrollments]
        
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        course = self.get_object()
        student = request.user

        if student.user_type != 'student':
            return Response(
                {'error': 'Only students can enroll in courses'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_enrollment = Enrollment.objects.filter(student=student, course=course).first()
        if existing_enrollment:
            return Response(
                {'error': 'Already enrolled in this course'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        enrollment = Enrollment.objects.create(student=student, course=course)
        serializer = EnrollmentSerializer(enrollment)
        return Response({
            'message': 'Successfully enrolled in course',
            'enrollment': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def enrollment_status(self, request, pk=None):
        course = self.get_object()
        user = request.user
        
        if user.user_type != 'student':
            return Response({'is_enrolled': False})
            
        is_enrolled = Enrollment.objects.filter(student=user, course=course).exists()
        return Response({'is_enrolled': is_enrolled})


class VideoLectureViewSet(viewsets.ModelViewSet):
    queryset = VideoLecture.objects.all()
    serializer_class = VideoLectureSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user)


class StudentProgressViewSet(viewsets.ModelViewSet):
    queryset = StudentProgress.objects.all()
    serializer_class = StudentProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudentProgress.objects.filter(student=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_watched(self, request):
        video_id = request.data.get('video_id')
        try:
            video = VideoLecture.objects.get(id=video_id)
            progress, created = StudentProgress.objects.get_or_create(
                student=request.user,
                video_lecture=video,
                defaults={'watched': True}
            )
            if not created:
                progress.watched = True
                progress.save()
            
            return Response({'status': 'marked as watched'})
        except VideoLecture.DoesNotExist:
            return Response(
                {'error': 'Video not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
