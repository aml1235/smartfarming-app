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

        $systemInstruction = <<<PROMPT
Kamu adalah asisten kandang/kebun pintar. Balas HANYA dengan format 4 bagian di bawah ini. DILARANG KERAS menulis kalimat apapun sebelum atau sesudah format ini. DILARANG menulis kata-kata seperti "Berikut", "Tentu", "Baik", atau kalimat pembuka lainnya.

Gunakan bahasa Indonesia yang santai, singkat, dan mudah dipahami orang awam. Tiap bagian maksimal 2 poin saja. Gunakan emoji.

GUNAKAN FORMAT INI PERSIS (mulai langsung dari emoji pertama):

📊 **KONDISI SEKARANG**
[1-2 kalimat ringkas kondisi saat ini]

⚠️ **YANG PERLU DIPERHATIKAN**
• [Masalah utama dan dampaknya, singkat]
• [Masalah ke-2 jika ada, atau ✅ Semua aman]

💡 **SARAN TINDAKAN**
1. [Langkah pertama yang harus dilakukan sekarang]
2. [Langkah kedua]

🔮 **PREDIKSI**
[1 kalimat: apa yang terjadi kalau saran diabaikan]
PROMPT;

        $prompt = "Data sensor dari sektor " . $sectorId . ":\n";
        
        if (is_array($metrics)) {
            foreach ($metrics as $key => $value) {
                $prompt .= "- " . ucfirst($key) . ": " . $value . "\n";
            }
        } else {
            $prompt .= $metrics;
        }

        $prompt .= "\nAnalisis kondisi di atas.";

        try {
            // Trim untuk menghapus whitespace/\r\n dari Windows line endings
            $apiKey = trim($apiKey);
            $model  = config('services.gemini.model', 'gemini-3.6-flash');

            $url     = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";
            $headers = ['Content-Type' => 'application/json'];

            if (str_starts_with($apiKey, 'AIza')) {
                // Format AIza... → query param (sudah ditest, bekerja)
                $url .= "?key={$apiKey}";
            } else {
                // Format AQ... → x-goog-api-key header
                $headers['x-goog-api-key'] = $apiKey;
            }

            $response = Http::withHeaders($headers)->post($url, [
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
                    'temperature' => 0.5,
                    'maxOutputTokens' => 600,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    return $data['candidates'][0]['content']['parts'][0]['text'];
                }
                Log::error('Gemini API Unexpected Response Format: ' . json_encode($data));
                return "AI tidak mengembalikan analisis yang valid.";
            } else {
                Log::error('Gemini API Error: ' . $response->status() . ' - ' . $response->body());
                return "Gagal mendapatkan analisis dari AI. Pesan error: " . $response->status();
            }
        } catch (\Exception $e) {
            Log::error('Gemini API Exception: ' . $e->getMessage(), ['exception' => $e]);
            return "Terjadi kesalahan saat memanggil API AI: " . $e->getMessage();
        }
    }
}
