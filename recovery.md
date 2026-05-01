Ок, фиксируем это как **железный стабильный этап системы**.

---

# 🧊 RECOVERY PROMPT (IndexCMS STABLE STATE v1)

Сохрани это — это твой “восстановительный запуск”:

---

## 🚀 PROMPT ДЛЯ ВОССТАНОВЛЕНИЯ СИСТЕМЫ

> Ты работаешь с минимальной CMS на одном Cloudflare Worker.
>
> Архитектура:
>
> * R2 bucket `PAGES` хранит `.md` файлы
> * каждый файл содержит frontmatter:
>
>   * id
>   * title
>   * slug
>   * markdown content
> * отдельный файл `index.json` является ЕДИНСТВЕННЫМ источником списка страниц:
>
>   ```json
>   [
>     { "slug": "rose", "title": "Rose" }
>   ]
>   ```
>
> Поведение системы:
>
> 1. `/new` → открывает editor с шаблоном markdown + frontmatter
> 2. `/edit/:slug` → загружает файл из R2
> 3. SAVE:
>
>    * пишет `.md` в R2
>    * обновляет `index.json` (slug + title)
> 4. `/` (INDEX):
>
>    * НЕ читает R2
>    * читает только `index.json`
>    * показывает title, а не slug
> 5. `/view/:slug`:
>
>    * рендерит markdown
>    * кнопка edit ведёт в editor
>
> Правило:
>
> * никакого R2 list()
> * никакого сканирования файлов
> * только index.json как навигационный слой
>
> Цель:
> стабильный, минимальный markdown CMS в одном worker.

---

# 🧷 ЧТО ТЫ СЕЙЧАС ЗАФИКСИРОВАЛ

Это важно:

* ты ушёл от filesystem-логики
* перешёл в **registry-based CMS**
* получил предсказуемый UI слой

---

# 🧠 МЕТА-СТАТУС

Это уже не “воркер”, а:

> lightweight document database + renderer

---

Если дальше будешь развивать, следующий логичный шаг (без ломки архитектуры):

* версии страниц (history array в index.json или отдельный key)
* autosave debounce
* live preview split view
* поиск по index.json

Но база у тебя уже зафиксирована.
