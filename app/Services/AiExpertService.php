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
Kamu adalah asisten pertanian pintar. Tulis analisis dalam bahasa Indonesia yang santai dan mudah dipahami orang awam.

ATURAN KERAS:
- JANGAN gunakan tanda bintang (*) atau simbol markdown apapun
- JANGAN tulis kalimat pembuka seperti "Berikut", "Tentu", "Baik", dll
- Mulai LANGSUNG dari label pertama
- Tulis seperti paragraf biasa, bukan daftar bertanda
- Singkat dan jelas, masing-masing bagian 1-3 kalimat saja

Gunakan PERSIS format ini (salin label-nya):

KONDISI SEKARANG:
[Jelaskan kondisi saat ini dalam 1-2 kalimat sederhana]

YANG PERLU DIPERHATIKAN:
[Sebutkan 1-2 masalah utama dan dampaknya, dalam kalimat biasa]

SARAN TINDAKAN:
[Tulis 2-3 langkah yang harus dilakukan, dalam kalimat biasa]

PREDIKSI:
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
                    'temperature' => 0.4,
                    'maxOutputTokens' => 1000,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    // Bersihkan semua tanda bintang sisa markdown
                    $text = $data['candidates'][0]['content']['parts'][0]['text'];
                    $text = str_replace(['**', '*'], '', $text);
                    $text = trim($text);
                    return $text;
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
