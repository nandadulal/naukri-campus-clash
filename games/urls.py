from django.urls import path
from games.views import vibe_sets, update_user_profile, get_user_profile, leaderboard, create_session, save_transcript

urlpatterns = [
    path("vibe-sets/", vibe_sets, name="vibe_sets"),
    path("update-score/", update_user_profile, name="update_user_profile"),
    path("user-profile/", get_user_profile, name="user-profile"),
    path("leaderboard/", leaderboard, name="leaderboard"),
    path("create-session/", create_session, name='create_session'),
    path("transcript/", save_transcript, name="save_transcript"),
]
