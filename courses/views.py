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
        print("🎯 STARTING EXAM SUBMISSION")
        exam_id = request.data.get('exam')
        student_id = request.data.get('student')
        answers = request.data.get('answers', [])
        
        print(f"📥 Received: exam={exam_id}, student={student_id}, answers={len(answers)}")
        print(f"📋 Answers data: {answers}")
        
        try:
            exam = Exam.objects.get(id=exam_id)
            student = User.objects.get(id=student_id)
            
            print(f"✅ Found exam: {exam.title}, student: {student.username}")
            
            # Delete any existing submission
            deleted_count = ExamSubmission.objects.filter(exam=exam, student=student).delete()
            print(f"🗑️ Deleted {deleted_count} existing submissions")
            
            # Create new submission
            submission = ExamSubmission.objects.create(
                exam=exam,
                student=student,
                score=0,
                passed=False
            )
            print(f"📝 Created submission: {submission.id}")
            
            # Calculate score
            total_score = 0
            earned_score = 0
            
            print(f"🔍 Processing {len(answers)} answers...")
            
            for i, answer_data in enumerate(answers):
                print(f"📝 Answer {i+1}: {answer_data}")
                
                question_id = answer_data.get('question_id')
                selected_choice_id = answer_data.get('selected_choice_id')
                
                print(f"   Question ID: {question_id}, Choice ID: {selected_choice_id}")
                
                try:
                    question = Question.objects.get(id=question_id)
                    total_score += question.score
                    print(f"   ✅ Question found: {question.question_text}, Score: {question.score}")
                    
                    if question.question_type == 'multiple_choice' and selected_choice_id:
                        selected_choice = Choice.objects.get(id=selected_choice_id)
                        print(f"   ✅ Choice found: {selected_choice.choice_text}")
                        
                        # Check if choice has is_correct field
                        is_correct = getattr(selected_choice, 'is_correct', False)
                        print(f"   ✅ Is correct: {is_correct}")
                        
                        if is_correct:
                            earned_score += question.score
                            print(f"   🎯 Correct! Earned score: {earned_score}")
                    
                    # Create answer record
                    Answer.objects.create(
                        exam_submission=submission,
                        question=question,
                        selected_choice_id=selected_choice_id,
                        answer_text=answer_data.get('answer_text', ''),
                        is_correct=is_correct
                    )
                    print(f"   ✅ Answer record created")
                    
                except Question.DoesNotExist:
                    print(f"   ❌ Question not found: {question_id}")
                except Choice.DoesNotExist:
                    print(f"   ❌ Choice not found: {selected_choice_id}")
                except Exception as e:
                    print(f"   ❌ Error processing answer: {str(e)}")
            
            print(f"📊 Final calculation - Total: {total_score}, Earned: {earned_score}")
            
            # Calculate final score
            if total_score > 0:
                submission.score = (earned_score / total_score) * 100
            else:
                submission.score = 0
                
            submission.passed = submission.score >= exam.passing_score
            submission.submitted_at = timezone.now()
            submission.save()
            
            print(f"🎯 Final score: {submission.score}% (Passing: {exam.passing_score}%, Passed: {submission.passed})")
            
            # Issue certificate if passed
            certificate_issued = False
            if submission.passed:
                certificate = self.issue_certificate(student, exam.course)
                certificate_issued = certificate is not None
                print(f"📜 Certificate issued: {certificate_issued}")
            
            response_data = {
                'score': submission.score,
                'passed': submission.passed,
                'total_questions': len(answers),
                'correct_answers': earned_score // 10 if total_score > 0 else 0,
                'certificate_issued': certificate_issued
            }
            
            print("✅ SUBMISSION COMPLETE:", response_data)
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ SUBMISSION FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)
    
    def issue_certificate(self, student, course):
        print(f"🎓 Attempting to issue certificate for student {student.id}, course {course.id}")
        
        # Check if assignment is approved (if exists)
        assignment = Assignment.objects.filter(course=course).first()
        if assignment:
            print(f"📝 Checking assignment approval for course {course.id}")
            submission_exists = AssignmentSubmission.objects.filter(
                assignment=assignment,
                student=student,
                status='approved'
            ).exists()
            if not submission_exists:
                print("❌ Assignment not approved - cannot issue certificate")
                return None
        
        # Check if all videos are watched
        total_lectures = course.lectures.count()
        completed_lectures = StudentProgress.objects.filter(
            student=student,
            video_lecture__course=course,
            watched=True
        ).count()
        
        print(f"🎬 Video progress: {completed_lectures}/{total_lectures} lectures completed")
        
        if completed_lectures == total_lectures:
            certificate, created = Certificate.objects.get_or_create(
                student=student,
                course=course
            )
            if created:
                print(f"✅ Certificate created: {certificate.id}")
            else:
                print(f"ℹ️ Certificate already exists: {certificate.id}")
            return certificate
        else:
            print(f"❌ Not all videos completed: {completed_lectures}/{total_lectures}")
            return None

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
    
    