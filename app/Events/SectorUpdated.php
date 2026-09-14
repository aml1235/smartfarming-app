<?php

namespace App\Events;

use App\Models\Sector;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

/**
 * Event yang dikirim setiap kali mqtt:listen menerima data sensor baru.
 *
 * Menggunakan ShouldBroadcastNow (bukan ShouldBroadcast) agar event
 * dikirim langsung tanpa melalui queue — karena mqtt:listen sudah
 * berjalan sebagai daemon, tidak perlu overhead queue tambahan.
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
     * Channel publik 'sectors' — semua client bisa subscribe.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('sectors');
    }

    /**
     * Data yang dikirim ke client (hanya yang diperlukan dashboard).
     */
    public function broadcastWith(): array
    {
        return $this->sectorData;
    }
}
