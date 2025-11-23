from django.db import models
from users.models import User
from courses.models import Course
import uuid

class Certificate(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    certificate_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    issued_date = models.DateTimeField(auto_now_add=True)
    final_score = models.DecimalField(max_digits=5, decimal_places=2)
    download_url = models.URLField(blank=True)

    class Meta:
        unique_together = ['student', 'course']

    def __str__(self):
        return f"Certificate {self.certificate_id} - {self.student.username}"