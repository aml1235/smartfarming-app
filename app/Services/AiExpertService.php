<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiExpertService
{
    public function analyzeSensorData(\App\Models\Sector $sector, $metrics)
    {
        $apiKey = config('services.gemini.key');
        
        if (empty($apiKey)) {
            return "Kunci API Gemini belum dikonfigurasi.";
        }

        $jenisSektor = strtolower($sector->unit); // peternakan / pertanian
        $namaSektor = $sector->name;

        $systemInstruction = <<<PROMPT
Kamu adalah asisten ahli pintar untuk sektor $jenisSektor (Nama Lokasi: $namaSektor). Tulis analisis dalam bahasa Indonesia yang santai dan mudah dipahami orang awam. Sesuaikan saranmu secara spesifik untuk bidang $jenisSektor.

ATURAN KERAS:
- JANGAN gunakan tanda bintang (*) atau simbol markdown apapun
- JANGAN tulis kalimat pembuka seperti "Berikut", "Tentu", "Baik", dll
- Mulai LANGSUNG dari label pertama
- Tulis seperti paragraf biasa, bukan daftar bertanda
- Tiap bagian MAKSIMAL 2 kalimat saja, singkat dan padat

Gunakan PERSIS format ini (salin label-nya persis termasuk titik dua):

KONDISI SEKARANG:
[Maksimal 2 kalimat tentang kondisi saat ini]

YANG PERLU DIPERHATIKAN:
[Maksimal 2 kalimat tentang masalah dan dampaknya]

SARAN TINDAKAN:
[Maksimal 2 kalimat tentang langkah yang harus dilakukan]

PREDIKSI:
[1 kalimat tentang apa yang terjadi kalau saran diabaikan]
PROMPT;

        $prompt = "Data sensor terkini dari sektor " . $namaSektor . ":\n";

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
                    'maxOutputTokens' => 1500,
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
