from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from resources.models import Hall, Equipment
from events.models import Event, Registration
from bookings.models import EquipmentAllocation

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial demo data with 1 admin, 2 faculty, 3 students, 4 halls, equipment, and events.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding demo database..."))

        # 1. Create Users
        users_data = [
            {'username': 'admin', 'email': 'admin@campus.edu', 'password': 'adminpassword', 'role': User.Role.ADMIN, 'first': 'Campus', 'last': 'Administrator', 'staff': True, 'super': True},
            {'username': 'prof_smith', 'email': 'prof.smith@campus.edu', 'password': 'facultypassword', 'role': User.Role.FACULTY, 'first': 'Marcus', 'last': 'Smith', 'staff': False, 'super': False},
            {'username': 'dr_patel', 'email': 'dr.patel@campus.edu', 'password': 'facultypassword', 'role': User.Role.FACULTY, 'first': 'Priya', 'last': 'Patel', 'staff': False, 'super': False},
            {'username': 'student_alice', 'email': 'alice@student.campus.edu', 'password': 'studentpassword', 'role': User.Role.STUDENT, 'first': 'Alice', 'last': 'Wong', 'staff': False, 'super': False},
            {'username': 'student_bob', 'email': 'bob@student.campus.edu', 'password': 'studentpassword', 'role': User.Role.STUDENT, 'first': 'Bob', 'last': 'Miller', 'staff': False, 'super': False},
            {'username': 'student_charlie', 'email': 'charlie@student.campus.edu', 'password': 'studentpassword', 'role': User.Role.STUDENT, 'first': 'Charlie', 'last': 'Evans', 'staff': False, 'super': False},
        ]

        users = {}
        for ud in users_data:
            user, created = User.objects.get_or_create(
                username=ud['username'],
                defaults={
                    'email': ud['email'],
                    'role': ud['role'],
                    'first_name': ud['first'],
                    'last_name': ud['last'],
                    'is_staff': ud['staff'],
                    'is_superuser': ud['super'],
                }
            )
            user.role = ud['role']
            user.is_staff = ud['staff']
            user.is_superuser = ud['super']
            user.set_password(ud['password'])
            user.save()
            users[ud['username']] = user

        # 2. Create 4 Halls
        halls_data = [
            {'name': 'Grand Auditorium', 'capacity': 400, 'location': 'Central Quad, Building A', 'is_active': True},
            {'name': 'Turing Lecture Hall', 'capacity': 160, 'location': 'Computer Science Dept, 2nd Floor', 'is_active': True},
            {'name': 'Newton Science Theater', 'capacity': 100, 'location': 'Natural Sciences Complex, Wing B', 'is_active': True},
            {'name': 'Synergy Workshop Lab', 'capacity': 40, 'location': 'Innovation Hub, Room 104', 'is_active': True},
        ]

        halls = {}
        for hd in halls_data:
            hall, _ = Hall.objects.update_or_create(
                name=hd['name'],
                defaults={'capacity': hd['capacity'], 'location': hd['location'], 'is_active': hd['is_active']}
            )
            halls[hd['name']] = hall

        # 3. Create Equipment
        equipment_data = [
            {'name': '4K Laser Projector', 'total_quantity': 8, 'description': '8000-lumen ultra HD presentation projector'},
            {'name': 'Wireless Lapel Microphone Set', 'total_quantity': 12, 'description': 'Dual-channel UHF wireless microphone kit with receiver'},
            {'name': 'Active PA Sound System', 'total_quantity': 6, 'description': '1000W portable audio speaker system with tripod stands'},
            {'name': 'Mobile Video Conference Cart', 'total_quantity': 4, 'description': '65-inch 4K display cart with PTZ auto-tracking camera'},
            {'name': 'Stage Spotlight Bar', 'total_quantity': 5, 'description': 'DMX-controlled RGB LED wash lighting unit'},
        ]

        equipment = {}
        for ed in equipment_data:
            eq, _ = Equipment.objects.update_or_create(
                name=ed['name'],
                defaults={'total_quantity': ed['total_quantity'], 'description': ed['description']}
            )
            equipment[ed['name']] = eq

        # 4. Sample Events & Allocations
        # Delete prior sample events
        Event.objects.all().delete()

        now = timezone.now().replace(minute=0, second=0, microsecond=0)

        # Event 1: AI & Robotics Keynote (Approved, tomorrow morning)
        e1_start = now + timedelta(days=1, hours=2)
        e1_end = e1_start + timedelta(hours=3)
        e1 = Event.objects.create(
            title='AI & Robotics Breakthrough Summit',
            description='Keynote session on autonomous agents, robotics architectures, and multi-modal models.',
            organizer=users['prof_smith'],
            hall=halls['Grand Auditorium'],
            start=e1_start,
            end=e1_end,
            status=Event.Status.APPROVED,
            expected_attendees=250,
        )
        EquipmentAllocation.objects.create(event=e1, equipment=equipment['4K Laser Projector'], quantity=2)
        EquipmentAllocation.objects.create(event=e1, equipment=equipment['Active PA Sound System'], quantity=2)
        EquipmentAllocation.objects.create(event=e1, equipment=equipment['Wireless Lapel Microphone Set'], quantity=4)
        Registration.objects.create(user=users['student_alice'], event=e1)
        Registration.objects.create(user=users['student_bob'], event=e1)

        # Event 2: Quantum Computing Colloquium (Approved, day after tomorrow)
        e2_start = now + timedelta(days=2, hours=4)
        e2_end = e2_start + timedelta(hours=2)
        e2 = Event.objects.create(
            title='Quantum Algorithms & Superconducting Circuits',
            description='Interactive discussion on superconducting qubits and circuit quantum electrodynamics.',
            organizer=users['dr_patel'],
            hall=halls['Turing Lecture Hall'],
            start=e2_start,
            end=e2_end,
            status=Event.Status.APPROVED,
            expected_attendees=85,
        )
        EquipmentAllocation.objects.create(event=e2, equipment=equipment['4K Laser Projector'], quantity=1)
        EquipmentAllocation.objects.create(event=e2, equipment=equipment['Wireless Lapel Microphone Set'], quantity=2)
        Registration.objects.create(user=users['student_charlie'], event=e2)

        # Event 3: Sustainable Energy Hackathon (Pending approval)
        e3_start = now + timedelta(days=3, hours=1)
        e3_end = e3_start + timedelta(hours=6)
        e3 = Event.objects.create(
            title='Campus Clean Energy Hackathon',
            description='Student-faculty collaborative 6-hour sprint solving microgrid energy storage challenges.',
            organizer=users['prof_smith'],
            hall=halls['Newton Science Theater'],
            start=e3_start,
            end=e3_end,
            status=Event.Status.PENDING,
            expected_attendees=70,
        )
        EquipmentAllocation.objects.create(event=e3, equipment=equipment['Mobile Video Conference Cart'], quantity=1)
        EquipmentAllocation.objects.create(event=e3, equipment=equipment['4K Laser Projector'], quantity=1)

        # Event 4: Deep Learning Hands-On Workshop (Pending approval)
        e4_start = now + timedelta(days=4, hours=3)
        e4_end = e4_start + timedelta(hours=3)
        e4 = Event.objects.create(
            title='Hands-On Transformer Fine-Tuning Workshop',
            description='Practical GPU laboratory session on parameter-efficient fine-tuning and retrieval pipelines.',
            organizer=users['dr_patel'],
            hall=halls['Synergy Workshop Lab'],
            start=e4_start,
            end=e4_end,
            status=Event.Status.PENDING,
            expected_attendees=35,
        )
        EquipmentAllocation.objects.create(event=e4, equipment=equipment['Mobile Video Conference Cart'], quantity=1)

        self.stdout.write(self.style.SUCCESS("\n========================================================"))
        self.stdout.write(self.style.SUCCESS("Smart Campus Event Portal Demo Data Seeded Successfully!"))
        self.stdout.write(self.style.SUCCESS("========================================================"))
        self.stdout.write("\nDEMO CREDENTIALS:")
        self.stdout.write("--------------------------------------------------------")
        self.stdout.write(f"  ADMIN:    username: admin           password: adminpassword")
        self.stdout.write(f"  FACULTY:  username: prof_smith      password: facultypassword")
        self.stdout.write(f"  FACULTY:  username: dr_patel        password: facultypassword")
        self.stdout.write(f"  STUDENT:  username: student_alice   password: studentpassword")
        self.stdout.write(f"  STUDENT:  username: student_bob     password: studentpassword")
        self.stdout.write(f"  STUDENT:  username: student_charlie password: studentpassword")
        self.stdout.write("--------------------------------------------------------")
        self.stdout.write(f"  HALLS:     {Hall.objects.count()} halls created")
        self.stdout.write(f"  EQUIPMENT: {Equipment.objects.count()} equipment categories created")
        self.stdout.write(f"  EVENTS:    {Event.objects.count()} events (2 Approved, 2 Pending)")
        self.stdout.write("========================================================\n")
