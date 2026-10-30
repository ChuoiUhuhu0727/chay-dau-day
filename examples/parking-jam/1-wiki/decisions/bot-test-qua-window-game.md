# Decision — Bot test điều khiển game qua `window.__game`

**Quyết định:** `game/ui.js` luôn giữ `window.__game.state()` và `window.__game.cars()`; mỗi xe có `data-car`.

**Vì sao:** AI không tự nhìn được game. Bot (`2-environment/bot.mjs`) cần một "tay nắm" ổn định để chơi và kiểm.

**Hệ quả:** đổi giao diện thoải mái, nhưng không được xoá hợp đồng này.
