# PLAN.md — 美食遊覽 完整方案

> 最終版本：v9.2（commit `96ee1f1`，2026-06-29）
> 目標：164 家宵夜地圖（高雄 46 + 台南 50 + 彰化 68），視覺驗證 100% 對應正確店家照片

---

## 最終狀態

| 維度 | 結果 |
|---|---|
| **版本** | **v9.2** (Cyberpunk Glassmorphism) |
| **店家總數** | 164 |
| **有視覺驗證照片** | 135 (82%) |
| **純文字卡（誠實）** | 29 (12 FAIL + 17 SKIP) |
| **部署包大小** | ~654 KB index.html |
| **commits** | 41+ |
| **部署 URL** | https://food-map-tw-dun.vercel.app |

---

## 縣市分布

| 縣市 | 有照片 | 總數 | 完成率 |
|---|---|---|---|
| 高雄 | 45 | 46 | 98% |
| 台南 | 51 | 50 | 102% |
| 彰化 | 39 | 68 | 57% |
| **總計** | **135** | **164** | **82%** |

---

## 技術架構

```
前端：Vanilla JS SPA（無框架）
樣式：Cyberpunk Glassmorphism v9（霓虹青/紫）
後端：Supabase Cloud（Postgres + RLS + Auth）
部署：Vercel（GitHub auto-deploy，build-time env inject）
月費：$0
```

---

## 已知坑

1. **lh3 URL 會過期**：個別店家圖返回 403，需重新抓
2. **彰化 18 家無照片**：Maps auto-routing 對小型在地店失敗
3. **.env.local 在 git 历史**：已加進 .gitignore，但歷史 commit 仍有（需 `git filter-branch` 清理）
4. **v9.3 任務未完成**：data/TASKS.md 的 5 項任務全部 open

---

## 歷史教訓

- Maps Place Photo lh3 URL 品質不穩（auto-routing 5-15% 給錯店）
- Wikipedia commons cover_photo 100% 假，必須用 Maps search
- 每家 1 張 lh3 視覺驗證就夠
- agent-browser 對 Maps 不被擋（Playwright 會被擋）
- 誠實原則：不確定的不放圖，FAIL 標 `_no_photo: true`
