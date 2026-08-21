<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiExpertService
{
    public function analyzeSensorData($sectorId, $metrics)
    {
        $apiKey = config('services.gemini.key');
        
        if (empty($apiKey)) {
            return "Kunci API Gemini belum dikonfigurasi.";
        }

        $systemInstruction = "Anda adalah seorang pakar pertanian cerdas (Smart Farming Expert). Tugas Anda adalah menganalisis data metrik sensor dari sektor pertanian berikut ini, berikan analisa mendalam namun ringkas mengenai kondisi saat ini, potensi risiko (jika ada nilai ekstrem/anomali), dan rekomendasi tindakan praktis untuk petani. Jawab menggunakan bahasa Indonesia yang jelas, profesional, dan mudah dipahami, gunakan format Markdown jika perlu untuk poin-poin penting. Hanya berikan saran yang berkaitan dengan bidang pertanian (hidroponik atau kandang ayam).";

        $prompt = "Berikut adalah data sensor terkini dari sektor " . $sectorId . ":\n\n";
        
        if (is_array($metrics)) {
            foreach ($metrics as $key => $value) {
                $prompt .= "- " . ucfirst($key) . ": " . $value . "\n";
            }
        } else {
            $prompt .= $metrics;
        }

        $prompt .= "\nMohon berikan analisis Anda sebagai pakar pertanian terhadap data di atas.";

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                'system_instruction' => [
                    'parts' => [
                        ['text' => $systemInstruction]
                    ]
                ],
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 800,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    return $data['candidates'][0]['content']['parts'][0]['text'];
                }
                return "AI tidak mengembalikan analisis yang valid.";
            } else {
                Log::error('Gemini API Error: ' . $response->body());
                return "Gagal mendapatkan analisis dari AI. Pesan error: " . $response->status();
            }
        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage());
            return "Terjadi kesalahan saat memanggil API AI: " . $e->getMessage();
        }
    }
}
