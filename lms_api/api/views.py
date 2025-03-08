from rest_framework import generics
from .serializers import LoginSerializer, ProfileSerializer, RegisterSerializer, ProjectSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Project
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model


CustomUser = get_user_model()

class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        else:
            print("Errors:", serializer.errors)  # Debugging line
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'reward': user.reward,
                    'profile_picture': user.profile_picture,
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")  # Expect the refresh token in the request body
            if not refresh_token:
                return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()  # Add the token to the blacklist (requires SimpleJWT blacklist enabled)

            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)



class ProfileSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = ProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        # Log the errors for debugging
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ProjectCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ProjectSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        projects = Project.objects.filter(user=request.user).order_by('-created_at')
        print("Projects Queryset:", projects)  # Debugging: Log the queryset
        serializer = ProjectSerializer(projects, many=True)
        print("Serialized Data:", serializer.data)  # Debugging: Log the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, project_id, *args, **kwargs):
        try:
            project = Project.objects.get(id=project_id, user=request.user)
            project.delete()
            return Response({"message": "Project deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)


class ProjectDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id, *args, **kwargs):
        try:
            project = Project.objects.get(id=project_id, user=request.user)
            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, project_id, *args, **kwargs):
        try:
            project = Project.objects.get(id=project_id, user=request.user)
            project.delete()
            return Response({"message": "Project deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)


class ProjectUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, project_id, *args, **kwargs):
        try:
            project = Project.objects.get(id=project_id, user=request.user)
            print("Fetched Project for Update:", project)  # Debugging: Log the fetched project
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        print("Request Data:", request.data)  # Debugging: Log the incoming request data
        serializer = ProjectSerializer(project, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            # Check if the project is being marked as completed
            if request.data.get('completed', False) and not project.completed:
                # Add 3 reward points to the user
                user = request.user
                user.reward += 3
                user.save()
                print(f"Added 3 reward points to user {user.username}. New reward: {user.reward}")

            serializer.save()
            print("Updated Project Data:", serializer.data)  # Debugging: Log the updated project data
            return Response(serializer.data, status=status.HTTP_200_OK)
        print("Serializer Errors:", serializer.errors)  # Debugging: Log serializer errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class NotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = []
        projects = Project.objects.filter(user=request.user)
        for project in projects:
            notifications.extend(project.check_for_notifications())
        return Response(notifications, status=status.HTTP_200_OK)
    

    
class RewardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reward_points = request.user.reward
        return Response({'points': reward_points}, status=status.HTTP_200_OK)