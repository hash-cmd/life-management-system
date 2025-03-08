from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta



class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)  # Ensure email is unique
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    reward =models.PositiveIntegerField(default=0)
    profile_picture = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.username

class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)  # Optional category field
    start_date = models.CharField(max_length=255, blank=True, null=True)
    end_date = models.CharField(max_length=255, blank=True, null=True)
    start_time = models.CharField(max_length=255, blank=True, null=True)
    end_time = models.CharField(max_length=255, blank=True, null=True)
    phases = models.JSONField(default=dict)  # Store phases in list format
    completed = models.BooleanField(default=False)
    completed_at = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError("End date cannot be before start date.")
        if self.start_time and self.end_time and self.start_time > self.end_time:
            raise ValidationError("End time cannot be before start time.")

    def __str__(self):
        return self.title

    def check_for_notifications(self):
        """
        Check for notifications based on project and phase times.
        Returns a list of notification messages.
        """
        notifications = []

        # Helper function to add a notification
        def add_notification(title, body):
            notifications.append({"title": title, "body": body})

        # Check project start time
        if self.start_date and self.start_time:
            start_datetime = timezone.make_aware(
                datetime.strptime(f"{self.start_date} {self.start_time}", "%Y-%m-%d %H:%M")
            )
            # Add notification 15 minutes before the start time
            reminder_time = start_datetime - timedelta(minutes=15)
            if timezone.now() >= reminder_time and not self.completed:
                add_notification(
                    "Project Start Reminder",
                    f"Project {self.title} starts in 15 minutes!"
                )

            # Add notification at the start time
            if timezone.now() >= start_datetime and not self.completed:
                add_notification(
                    "Project Started",
                    f"Project {self.title} has started!"
                )

        # Check project end time
        if self.end_date and self.end_time:
            end_datetime = timezone.make_aware(
                datetime.strptime(f"{self.end_date} {self.end_time}", "%Y-%m-%d %H:%M")
            )
            # Add notification 15 minutes before the end time
            reminder_time = end_datetime - timedelta(minutes=15)
            if timezone.now() >= reminder_time and not self.completed:
                add_notification(
                    "Project Deadline Reminder",
                    f"Project {self.title} deadline is in 15 minutes!"
                )

            # Add notification at the end time
            if timezone.now() >= end_datetime and not self.completed:
                add_notification(
                    "Project Deadline Reached",
                    f"Project {self.title} deadline has passed!"
                )

        # Check phases
        for phase in self.phases:
            if phase.get('start_date') and phase.get('start_time'):
                phase_start_datetime = timezone.make_aware(
                    datetime.strptime(f"{phase['start_date']} {phase['start_time']}", "%Y-%m-%d %H:%M")
                )
                # Add notification 15 minutes before the phase start time
                reminder_time = phase_start_datetime - timedelta(minutes=15)
                if timezone.now() >= reminder_time and not phase.get('completed', False):
                    add_notification(
                        "Phase Start Reminder",
                        f"Phase {phase['title']} starts in 15 minutes!"
                    )

                # Add notification at the phase start time
                if timezone.now() >= phase_start_datetime and not phase.get('completed', False):
                    add_notification(
                        "Phase Started",
                        f"Phase {phase['title']} has started!"
                    )

            if phase.get('end_date') and phase.get('end_time'):
                phase_end_datetime = timezone.make_aware(
                    datetime.strptime(f"{phase['end_date']} {phase['end_time']}", "%Y-%m-%d %H:%M")
                )
                # Add notification 15 minutes before the phase end time
                reminder_time = phase_end_datetime - timedelta(minutes=15)
                if timezone.now() >= reminder_time and not phase.get('completed', False):
                    add_notification(
                        "Phase Deadline Reminder",
                        f"Phase {phase['title']} deadline is in 15 minutes!"
                    )

                # Add notification at the phase end time
                if timezone.now() >= phase_end_datetime and not phase.get('completed', False):
                    add_notification(
                        "Phase Deadline Reached",
                        f"Phase {phase['title']} deadline has passed!"
                    )

        return notifications