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
Kamu adalah asisten pertanian pintar yang ramah. Tugasmu adalah membantu petani memahami kondisi ladang/kandang mereka berdasarkan data sensor, menggunakan bahasa yang SANGAT SEDERHANA dan mudah dipahami oleh orang awam (tidak perlu latar belakang pertanian).

ATURAN PENTING:
1. Gunakan bahasa sehari-hari Indonesia yang santai namun sopan (seperti berbicara langsung dengan petani)
2. JANGAN gunakan istilah teknis yang rumit tanpa penjelasan
3. Selalu mulai dengan ringkasan singkat kondisi saat ini (1-2 kalimat)
4. Berikan saran tindakan yang KONKRET dan SPESIFIK (apa yang harus dilakukan sekarang)
5. Gunakan emoji yang relevan untuk membuat teks lebih mudah dibaca 🌡️💧⚠️✅
6. Gunakan format berikut PERSIS seperti ini:

📊 **KONDISI SEKARANG**
[Ringkasan singkat kondisi dalam 1-2 kalimat sederhana]

⚠️ **YANG PERLU DIPERHATIKAN**
• [Masalah 1 - jelaskan dampaknya dalam bahasa sederhana]
• [Masalah 2 - jelaskan dampaknya dalam bahasa sederhana]
(jika kondisi baik semua, tulis ✅ Semua kondisi dalam batas normal)

💡 **SARAN TINDAKAN**
1. [Langkah konkret pertama yang harus dilakukan]
2. [Langkah konkret kedua]
3. [Langkah konkret ketiga jika ada]

🔮 **PREDIKSI**
[Apa yang mungkin terjadi jika saran di atas tidak diikuti, dalam 1-2 kalimat sederhana]

Ingat: Bayangkan kamu sedang menjelaskan kepada seorang petani yang belum pernah menggunakan teknologi sensor sebelumnya.
PROMPT;


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
                    'temperature' => 0.7,
                    'maxOutputTokens' => 1200,
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
