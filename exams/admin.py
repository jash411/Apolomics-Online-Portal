from django.contrib import admin
from .models import Exam, Question, Choice

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4

class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]

admin.site.register(Exam)
admin.site.register(Question, QuestionAdmin)
admin.site.register(Choice)