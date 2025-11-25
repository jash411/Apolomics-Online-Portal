from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import *
from .serializers import *
from django.utils import timezone

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseSerializer
    
    def get_queryset(self):
        # Allow instructors to see their unpublished courses
        if self.request.user.is_authenticated and self.request.user.user_type == 'instructor':
            return Course.objects.filter(instructor=self.request.user)
        return Course.objects.filter(is_published=True)
    
    def perform_create(self, serializer):
        # Automatically set the instructor to the current user
        serializer.save(instructor=self.request.user)
    
    def get_serializer_context(self):
        # Pass the request to the serializer
        return {'request': self.request}
    
    @action(detail=False, methods=['get'])
    def my_courses(self, request):
        enrolled_courses = Course.objects.filter(
            enrollments__student=request.user
        )
        serializer = self.get_serializer(enrolled_courses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        course = self.get_object()
        enrollment, created = Enrollment.objects.get_or_create(
            student=request.user,
            course=course
        )
        return Response({'status': 'enrolled' if created else 'already enrolled'})
    
    @action(detail=True, methods=['get'])
    def enrollment_status(self, request, pk=None):
        course = self.get_object()
        is_enrolled = Enrollment.objects.filter(
            student=request.user,
            course=course
        ).exists()
        return Response({'is_enrolled': is_enrolled})

class VideoLectureViewSet(viewsets.ModelViewSet):
    queryset = VideoLecture.objects.all()
    serializer_class = VideoLectureSerializer
    
    def get_serializer_context(self):
        """Include request in serializer context for absolute URLs"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class StudentProgressViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProgressSerializer
    
    # FIX: Add proper queryset filtering
    def get_queryset(self):
        """Only return progress records for the current user"""
        if self.request.user.is_authenticated:
            return StudentProgress.objects.filter(student=self.request.user)
        return StudentProgress.objects.none()
    
    @action(detail=False, methods=['post'])
    def update_progress(self, request):
        try:
            video_lecture_id = request.data.get('video_lecture')
            progress = request.data.get('progress', 0)
            watched = request.data.get('watched', False)
            
            print(f"Updating progress - Video: {video_lecture_id}, Progress: {progress}, Watched: {watched}")
            
            if not video_lecture_id:
                return Response({'error': 'video_lecture is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            video_lecture = VideoLecture.objects.get(id=video_lecture_id)
            progress_obj, created = StudentProgress.objects.get_or_create(
                student=request.user,  # ← This correctly sets the student
                video_lecture=video_lecture
            )
            progress_obj.progress = float(progress)
            if watched:
                progress_obj.watched = True
            progress_obj.save()
            
            print(f"Progress updated successfully - Created: {created}")
            
            # Check if all lectures are completed
            self.check_course_completion(request.user, video_lecture.course)
            
            return Response({
                'status': 'progress updated',
                'video_lecture': video_lecture_id,
                'progress': progress,
                'watched': watched,
                'created': created
            })
            
        except VideoLecture.DoesNotExist:
            print(f"Video lecture not found: {video_lecture_id}")
            return Response({'error': 'Video lecture not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error updating progress: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def check_course_completion(self, student, course):
        try:
            total_lectures = course.lectures.count()
            completed_lectures = StudentProgress.objects.filter(
                student=student,  # ← This correctly filters by student
                video_lecture__course=course,
                watched=True
            ).count()
            
            print(f"Course completion check - Total: {total_lectures}, Completed: {completed_lectures}")
            
            if total_lectures > 0 and completed_lectures == total_lectures:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course
                )
                if not enrollment.completed:
                    enrollment.completed = True
                    enrollment.completed_at = timezone.now()
                    enrollment.save()
                    print(f"Course marked as completed: {course.title}")
        except Exception as e:
            print(f"Error in course completion check: {str(e)}")

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    
    def get_serializer_context(self):
        return {'request': self.request}

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    
    def get_queryset(self):
        queryset = AssignmentSubmission.objects.all()
        if self.request.user.user_type == 'student':
            queryset = queryset.filter(student=self.request.user)
        elif self.request.user.user_type == 'instructor':
            queryset = queryset.filter(assignment__course__instructor=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        # Automatically set the student
        serializer.save(student=self.request.user)
    
    def get_serializer_context(self):
        return {'request': self.request}
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        submission = self.get_object()
        score = request.data.get('score')
        feedback = request.data.get('feedback')
        status = request.data.get('status', 'reviewed')
        
        submission.score = score
        submission.feedback = feedback
        submission.status = status
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()
        
        return Response({'status': 'submission reviewed'})

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.filter(is_active=True)
    serializer_class = ExamSerializer
    
    def get_serializer_context(self):
        return {'request': self.request}

class ExamSubmissionViewSet(viewsets.ModelViewSet):
    queryset = ExamSubmission.objects.all()
    serializer_class = ExamSubmissionSerializer
    
    def create(self, request):
        exam_id = request.data.get('exam')
        answers = request.data.get('answers', [])
        
        try:
            exam = Exam.objects.get(id=exam_id)
            submission, created = ExamSubmission.objects.get_or_create(
                exam=exam,
                student=request.user
            )
            
            if not created:
                return Response({'error': 'Exam already attempted'}, status=400)
            
            # Calculate score
            total_score = 0
            earned_score = 0
            
            for answer_data in answers:
                question = Question.objects.get(id=answer_data['question_id'])
                total_score += question.score
                
                if question.question_type == 'multiple_choice':
                    selected_choice = Choice.objects.get(id=answer_data['selected_choice_id'])
                    is_correct = selected_choice.is_correct
                    if is_correct:
                        earned_score += question.score
                elif question.question_type == 'true_false':
                    is_correct = (answer_data['answer_text'].lower() == str(question.choices.first().is_correct).lower())
                    if is_correct:
                        earned_score += question.score
                
                Answer.objects.create(
                    exam_submission=submission,
                    question=question,
                    selected_choice=selected_choice if question.question_type == 'multiple_choice' else None,
                    answer_text=answer_data.get('answer_text', ''),
                    is_correct=is_correct
                )
            
            submission.score = (earned_score / total_score) * 100 if total_score > 0 else 0
            submission.passed = submission.score >= exam.passing_score
            submission.submitted_at = timezone.now()
            submission.save()
            
            # Check if certificate should be issued
            if submission.passed:
                self.issue_certificate(request.user, exam.course)
            
            return Response({
                'score': submission.score,
                'passed': submission.passed,
                'total_questions': len(answers),
                'correct_answers': earned_score // 10  # Assuming each question is 10 points
            })
        
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)
    
    def issue_certificate(self, student, course):
        # Check if assignment is approved (if exists)
        assignment = Assignment.objects.filter(course=course).first()
        if assignment:
            submission = AssignmentSubmission.objects.filter(
                assignment=assignment,
                student=student,
                status='approved'
            ).exists()
            if not submission:
                return
        
        # Check if all videos are watched
        total_lectures = course.lectures.count()
        completed_lectures = StudentProgress.objects.filter(
            student=student,
            video_lecture__course=course,
            watched=True
        ).count()
        
        if completed_lectures == total_lectures:
            certificate, created = Certificate.objects.get_or_create(
                student=student,
                course=course
            )
            return certificate

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    
    def get_queryset(self):
        queryset = Certificate.objects.all()
        if self.request.user.user_type == 'student':
            queryset = queryset.filter(student=self.request.user)
        return queryset
    
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    
    def get_queryset(self):
        queryset = Question.objects.all()
        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        return queryset

class ChoiceViewSet(viewsets.ModelViewSet):
    queryset = Choice.objects.all()
    serializer_class = ChoiceSerializer
    
    def get_queryset(self):
        queryset = Choice.objects.all()
        question_id = self.request.query_params.get('question_id')
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        return queryset    
    
    