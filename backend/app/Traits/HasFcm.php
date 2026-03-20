<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Google\Auth\Credentials\ServiceAccountCredentials;

trait HasFcm
{
    private function getFcmAccessToken()
    {
        $credentialsPath = storage_path('app/mtrms-6101d-firebase-adminsdk-fbsvc-4c9ba5ac93.json');
        if (!file_exists($credentialsPath)) {
            $credentialsPath = storage_path('app/firebase-service-account.json');
        }
        
        if (!file_exists($credentialsPath)) {
            Log::warning('FCM Service Account JSON not found at expected paths.');
            return null;
        }

        try {
            $credentials = new ServiceAccountCredentials(
                'https://www.googleapis.com/auth/cloud-platform',
                json_decode(file_get_contents($credentialsPath), true)
            );

            $token = $credentials->fetchAuthToken();
            return $token['access_token'] ?? null;
        } catch (\Exception $e) {
            Log::error('Error fetching FCM Access Token: ' . $e->getMessage());
            return null;
        }
    }

    public function sendFcmNotification($user, $title, $body, $data = [])
    {
        if (!$user->fcm_token) {
            return false;
        }

        try {
            $projectId = config('services.firebase.project_id');
            if (!$projectId) {
                Log::warning('FCM notification skipped: FIREBASE_PROJECT_ID not set.');
                return false;
            }

            $accessToken = $this->getFcmAccessToken();
            if (!$accessToken) {
                return false;
            }

            $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            $response = Http::withToken($accessToken)->post($url, [
                'message' => [
                    'token' => $user->fcm_token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body
                    ],
                    'data' => array_merge($data, [
                        'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    ]),
                ],
            ]);

            if (!$response->successful()) {
                Log::error("FCM Send Error for user {$user->id}: " . $response->body());
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('FCM Error: ' . $e->getMessage());
            return false;
        }
    }
}
