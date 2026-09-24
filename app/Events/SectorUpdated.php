<?php

namespace App\Events;

use App\Models\Sector;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/**
 * Event yang dikirim setiap kali mqtt:listen menerima data sensor baru.
 *
 * Menggunakan ShouldBroadcastNow (bukan ShouldBroadcast) agar event
 * dikirim langsung tanpa melalui queue — karena mqtt:listen sudah
 * berjalan sebagai daemon, tidak perlu overhead queue tambahan.
 *
 * Keamanan: menggunakan PrivateChannel per-sektor sehingga hanya
 * pengguna yang berhak atas sektor tersebut yang dapat berlangganan.
 * Otorisasi dilakukan di routes/channels.php via canAccessSector().
 */
class SectorUpdated implements ShouldBroadcastNow
{
    public array $sectorData;

    public function __construct(public Sector $sector)
    {
        $this->sectorData = [
            'sector_id'  => $sector->sector_id,
            'name'       => $sector->name,
            'status'     => $sector->status,
            'metrics'    => $sector->metrics,
            'updated_at' => $sector->updated_at?->toISOString(),
        ];
    }

    /**
     * Kanal privat per-sektor — hanya subscriber yang diotorisasi
     * (via canAccessSector) yang bisa menerima event ini.
     */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('sector.' . $this->sector->sector_id)];
    }

    /**
     * Data yang dikirim ke client (hanya yang diperlukan dashboard).
     */
    public function broadcastWith(): array
    {
        return $this->sectorData;
    }
}
