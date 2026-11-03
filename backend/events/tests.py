from datetime import datetime, timedelta
from django.utils import timezone
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from resources.models import Hall, Equipment
from events.models import Event, Registration
from bookings.models import EquipmentAllocation
from notifications.models import Notification

User = get_user_model()


class SmartCampusTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            username='admin_user', email='admin@campus.edu', password='password123', role=User.Role.ADMIN
        )
        self.faculty = User.objects.create_user(
            username='faculty_user', email='faculty@campus.edu', password='password123', role=User.Role.FACULTY
        )
        self.student = User.objects.create_user(
            username='student_user', email='student@campus.edu', password='password123', role=User.Role.STUDENT
        )

        # Hall
        self.hall_a = Hall.objects.create(name='Auditorium A', capacity=100, location='Building 1')
        self.hall_b = Hall.objects.create(name='Seminar Room B', capacity=30, location='Building 2')

        # Equipment
        self.projector = Equipment.objects.create(name='4K Projector', total_quantity=5, description='High lumen')

        # Baseline times: tomorrow 10:00 to 12:00
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        self.t1 = now + timedelta(days=1, hours=2)  # 10:00
        self.t2 = self.t1 + timedelta(hours=2)       # 12:00
        self.t_overlap = self.t1 + timedelta(hours=1) # 11:00
        self.t3 = self.t2 + timedelta(hours=2)       # 14:00

    def test_role_permissions(self):
        """Test Student, Faculty, Admin access control."""
        # Student cannot create events
        self.client.force_authenticate(user=self.student)
        res = self.client.post('/api/events/', {
            'title': 'Student Hackathon',
            'hall': self.hall_a.id,
            'start': self.t1.isoformat(),
            'end': self.t2.isoformat(),
            'expected_attendees': 50,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Faculty CAN create events
        self.client.force_authenticate(user=self.faculty)
        res = self.client.post('/api/events/', {
            'title': 'AI Symposium',
            'hall': self.hall_a.id,
            'start': self.t1.isoformat(),
            'end': self.t2.isoformat(),
            'expected_attendees': 50,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        event_id = res.data['id']

        # Student cannot approve events
        self.client.force_authenticate(user=self.student)
        res_approve = self.client.post(f'/api/events/{event_id}/approve/')
        self.assertEqual(res_approve.status_code, status.HTTP_403_FORBIDDEN)

        # Admin CAN approve events
        self.client.force_authenticate(user=self.admin)
        res_approve_admin = self.client.post(f'/api/events/{event_id}/approve/')
        self.assertEqual(res_approve_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(res_approve_admin.data['status'], 'APPROVED')

    def test_hall_overlap_detection(self):
        """Reject events that conflict in time and hall with PENDING or APPROVED events."""
        # Create an approved event
        Event.objects.create(
            title='Existing Event',
            organizer=self.faculty,
            hall=self.hall_a,
            start=self.t1,
            end=self.t2,
            status=Event.Status.APPROVED,
            expected_attendees=40,
        )

        self.client.force_authenticate(user=self.faculty)

        # 1. Overlapping event in same hall (11:00 to 14:00 overlaps 10:00 to 12:00)
        res = self.client.post('/api/events/', {
            'title': 'Conflicting Event',
            'hall': self.hall_a.id,
            'start': self.t_overlap.isoformat(),
            'end': self.t3.isoformat(),
            'expected_attendees': 30,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('hall', res.data)

        # 2. Non-overlapping event in same hall (12:00 to 14:00 does not conflict with 10:00 to 12:00)
        res_ok = self.client.post('/api/events/', {
            'title': 'Subsequent Event',
            'hall': self.hall_a.id,
            'start': self.t2.isoformat(),
            'end': self.t3.isoformat(),
            'expected_attendees': 30,
        }, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        # 3. Same time, different hall is allowed
        res_diff_hall = self.client.post('/api/events/', {
            'title': 'Parallel Event in Room B',
            'hall': self.hall_b.id,
            'start': self.t1.isoformat(),
            'end': self.t2.isoformat(),
            'expected_attendees': 20,
        }, format='json')
        self.assertEqual(res_diff_hall.status_code, status.HTTP_201_CREATED)

        # 4. Expected attendees exceeds capacity
        res_over_cap = self.client.post('/api/events/', {
            'title': 'Oversized Event',
            'hall': self.hall_b.id, # cap 30
            'start': self.t2.isoformat(),
            'end': self.t3.isoformat(),
            'expected_attendees': 50,
        }, format='json')
        self.assertEqual(res_over_cap.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Invalid end time (end before start)
        res_time = self.client.post('/api/events/', {
            'title': 'Time travel',
            'hall': self.hall_b.id,
            'start': self.t2.isoformat(),
            'end': self.t1.isoformat(),
            'expected_attendees': 10,
        }, format='json')
        self.assertEqual(res_time.status_code, status.HTTP_400_BAD_REQUEST)

    def test_equipment_limits(self):
        """Equipment allocation must not exceed total_quantity across overlapping events."""
        # Total projector quantity = 5
        # Event 1 books 3 projectors
        ev1 = Event.objects.create(
            title='Movie Night',
            organizer=self.faculty,
            hall=self.hall_a,
            start=self.t1,
            end=self.t2,
            status=Event.Status.APPROVED,
            expected_attendees=50,
        )
        EquipmentAllocation.objects.create(event=ev1, equipment=self.projector, quantity=3)

        self.client.force_authenticate(user=self.faculty)

        # Overlapping Event in Room B requests 3 projectors (3 + 3 = 6 > 5) -> Must be rejected
        res = self.client.post('/api/events/', {
            'title': 'Workshop',
            'hall': self.hall_b.id,
            'start': self.t_overlap.isoformat(),
            'end': self.t3.isoformat(),
            'expected_attendees': 20,
            'requested_equipment': [
                {'equipment': self.projector.id, 'quantity': 3}
            ]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('requested_equipment', res.data)

        # Overlapping Event requests 2 projectors (3 + 2 = 5 <= 5) -> Allowed
        res_ok = self.client.post('/api/events/', {
            'title': 'Workshop Allowed',
            'hall': self.hall_b.id,
            'start': self.t_overlap.isoformat(),
            'end': self.t3.isoformat(),
            'expected_attendees': 20,
            'requested_equipment': [
                {'equipment': self.projector.id, 'quantity': 2}
            ]
        }, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

    def test_notification_creation_signals(self):
        """Test signal-driven notification creation for submit, approve, reject, cancel, and register."""
        # 1. Event submitted (created PENDING) -> Admin receives notification
        Notification.objects.all().delete()
        self.client.force_authenticate(user=self.faculty)
        res_create = self.client.post('/api/events/', {
            'title': 'Guest Lecture',
            'hall': self.hall_a.id,
            'start': self.t1.isoformat(),
            'end': self.t2.isoformat(),
            'expected_attendees': 60,
        }, format='json')
        event_id = res_create.data['id']

        admin_notifs = Notification.objects.filter(user=self.admin)
        self.assertTrue(admin_notifs.exists())
        self.assertIn("Guest Lecture", admin_notifs.first().message)

        # 2. Event approved -> Organizer receives notification
        self.client.force_authenticate(user=self.admin)
        self.client.post(f'/api/events/{event_id}/approve/')
        faculty_notifs = Notification.objects.filter(user=self.faculty)
        self.assertTrue(faculty_notifs.filter(message__icontains='approved').exists())

        # 3. Registration confirmed -> Student receives notification
        self.client.force_authenticate(user=self.student)
        res_reg = self.client.post(f'/api/events/{event_id}/register/')
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        student_notifs = Notification.objects.filter(user=self.student)
        self.assertTrue(student_notifs.filter(message__icontains='successfully registered').exists())

        # 4. Event cancelled -> Registered students receive cancellation notification
        self.client.force_authenticate(user=self.admin)
        self.client.post(f'/api/events/{event_id}/cancel/')
        self.assertTrue(
            Notification.objects.filter(user=self.student, message__icontains='cancelled').exists()
        )
