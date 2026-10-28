# ③ VERIFICATION — giám khảo chấm đậu/rớt

`verify.sh <FID>` chấm 3 điều, theo đúng thứ tự:

1. Có file test cho tính năng chưa? (`game/tests/<FID>.test.js`) — luật: viết test trước.
2. Unit test luật chơi có xanh hết không? (`node --test`)
3. Bot có tự chơi hết game được không? (`2-environment/bot.mjs`)

Thoát mã **0** = 🟢 đạt. Khác 0 = 🔴 chưa đạt. AI không được tự nói "xong".
